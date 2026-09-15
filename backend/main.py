from fastapi.middleware.cors import CORSMiddleware
from institution_service import identify_institution
from risk_service import calculate_risk_score
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, SecurityEvent, Alert
from pydantic import BaseModel
from typing import Dict
from ml_service import predict_threat
from database import SessionLocal, SecurityEvent, Alert, User
from auth_service import hash_password, verify_password, create_access_token, verify_token
from fastapi import HTTPException

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class EventInput(BaseModel):
    source_ip: str
    dest_ip: str
    event_type: str
    features: Dict[str, float] = {}  # network flow features for the AI model

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Threat detection backend is running!"}

@app.post("/events")
def create_event(event: EventInput, db: Session = Depends(get_db)):
    # Save the basic event info to the database
    new_event = SecurityEvent(
        source_ip=event.source_ip,
        dest_ip=event.dest_ip,
        event_type=event.event_type
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    # Run AI prediction if features were provided
    threat_type = "Unknown"
    confidence = 0.0
    risk_info = {"risk_score": 0, "risk_level": "Unknown"}
    institution_info = {"institution": "Not checked", "confidence": 0.0}

    if event.features:
        threat_type, confidence = predict_threat(event.features)
        risk_info = calculate_risk_score(threat_type, confidence)

        # Only look up institution info for meaningful risk (saves API calls)
        if risk_info["risk_score"] >= 30:
            institution_info = identify_institution(event.source_ip)

    alert_created = False
    ALERT_THRESHOLD = 60  # risk score at/above this triggers an alert

    if risk_info["risk_score"] >= ALERT_THRESHOLD:
        new_alert = Alert(
            event_id=new_event.id,
            threat_type=threat_type,
            risk_score=risk_info["risk_score"],
            risk_level=risk_info["risk_level"],
            institution=institution_info["institution"],
            status="new"
        )
        db.add(new_alert)
        db.commit()
        alert_created = True

    return {
        "event": new_event,
        "threat_type": threat_type,
        "confidence": confidence,
        "risk_score": risk_info["risk_score"],
        "risk_level": risk_info["risk_level"],
        "institution": institution_info["institution"],
        "institution_confidence": institution_info["confidence"],
        "alert_created": alert_created
    }
@app.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).all()
    return alerts

import pandas as pd
import numpy as np

@app.get("/sample-scenarios")
def get_sample_scenarios():
    """
    Returns real feature rows from the dataset for testing:
    one BENIGN example and one DDoS example.
    """
    df = pd.read_csv("../data/cicids2017_sample_1M_natural.csv")

    benign_row = df[df['Label'] == 'BENIGN'].iloc[0]
    ddos_row = df[df['Label'] == 'DDoS'].iloc[0]

    def clean_row(row):
        features = row.drop('Label').to_dict()
        return {
            k: (0 if (v != v or v in [float('inf'), float('-inf')]) else v)
            for k, v in features.items()
        }

    return {
        "normal": clean_row(benign_row),
        "attack": clean_row(ddos_row)
    }
@app.get("/identify/{ip_address}")
def identify_ip(ip_address: str):
    """
    Standalone institution lookup - check any IP without
    needing to submit a full security event.
    """
    result = identify_institution(ip_address)
    return {
        "ip_address": ip_address,
        "institution": result["institution"],
        "confidence": result["confidence"]
    }
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

@app.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        username=user.username,
        hashed_password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(db_user.username)
    return {"access_token": token, "token_type": "bearer"}
@app.delete("/alerts")
def clear_alerts(db: Session = Depends(get_db)):
    db.query(Alert).delete()
    db.commit()
    return {"message": "All alerts cleared"}
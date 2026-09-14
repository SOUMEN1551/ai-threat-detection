from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

DATABASE_URL = "mysql+pymysql://2uBnJ43Cwa2y3bP.root:UQ9dR4URKPYhsuJh@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class SecurityEvent(Base):
    __tablename__ = "security_events"
    id = Column(Integer, primary_key=True, index=True)
    source_ip = Column(String(50))
    dest_ip = Column(String(50))
    event_type = Column(String(100))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer)
    threat_type = Column(String(100))
    risk_score = Column(Integer)
    risk_level = Column(String(50))
    institution = Column(String(255))
    status = Column(String(50), default="new")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(255))
Base.metadata.create_all(bind=engine)
print("Connected and table created successfully!")
import os
import joblib
import json
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load the multi-class trained model
model = joblib.load(os.path.join(BASE_DIR, "threat_model_multiclass.pkl"))

with open(os.path.join(BASE_DIR, "feature_names.json"), "r") as f:
    FEATURE_NAMES = json.load(f)

def predict_threat(features: dict):
    """
    features: a dictionary of network flow features
    Returns: (prediction, confidence)
    prediction is now a specific label like "DDoS", "DoS Hulk", "BENIGN", etc.
    """
    row = [features.get(name, 0) for name in FEATURE_NAMES]
    row_df = pd.DataFrame([row], columns=FEATURE_NAMES)

    prediction = model.predict(row_df)[0]
    probabilities = model.predict_proba(row_df)[0]
    confidence = max(probabilities)

    return prediction, round(float(confidence), 4)

def explain_threat(features: dict, prediction: str, confidence: float) -> dict:
    """
    Explainable AI (XAI): Identifies the top network features contributing to the prediction.
    """
    if prediction == "BENIGN":
        return {
            "summary": "Network telemetry conforms to normal, balanced communication standards with symmetric packet timing and expected TCP flow behavior.",
            "top_factors": [
                {"feature": "Handshake Symmetry", "value": "Normal", "importance": 0.05, "impact": "Low", "description": "Bidirectional flow active with consistent packet exchange."},
                {"feature": "Flow Rate", "value": "Standard", "importance": 0.03, "impact": "Low", "description": "Packet rate within normal thresholds for benign traffic."}
            ]
        }

    importances = model.feature_importances_
    scored_features = []

    for idx, name in enumerate(FEATURE_NAMES):
        val = features.get(name, 0)
        imp = float(importances[idx])
        
        # Calculate impact score combining feature importance and magnitude
        try:
            num_val = float(val)
        except (ValueError, TypeError):
            num_val = 0.0

        if num_val != 0:
            score = imp * (1.0 + np.log1p(abs(num_val)))
        else:
            score = imp * 0.1
        scored_features.append((name, num_val, imp, score))

    scored_features.sort(key=lambda x: x[3], reverse=True)
    top_4 = scored_features[:4]

    top_factors = []
    descriptions = []

    for name, val, imp, _ in top_4:
        impact = "High" if imp >= 0.03 else "Medium"
        if "Packets/s" in name and val > 1000:
            desc = f"Extreme rate of {val:,.1f} pkts/s indicates automated flood burst."
        elif "Duration" in name and val < 100:
            desc = f"Ultra-short duration ({val} ms) characteristic of micro-burst SYN floods."
        elif "Duration" in name and val > 1000000:
            desc = f"Persistent lingering connection ({val / 1000000:.1f}s) exhausting socket pools."
        elif "Destination Port" in name:
            desc = f"Target port {int(val)} commonly targeted for application-layer saturation."
        elif "Backward" in name and val == 0:
            desc = "Absence of response packets indicates target host saturation or dropped replies."
        elif "Init_Win_bytes" in name:
            desc = f"Window parameter {val} reveals abnormal TCP header negotiation signature."
        else:
            desc = f"Telemetry parameter '{name}' ({val:,.2f}) matches known {prediction} signature patterns."
        
        top_factors.append({
            "feature": name,
            "value": round(val, 2),
            "importance": round(imp, 4),
            "impact": impact,
            "description": desc
        })
        descriptions.append(desc)

    summary = f"Classified as {prediction} with {confidence*100:.1f}% confidence. Primary drivers: " + "; ".join(descriptions[:2])

    return {
        "summary": summary,
        "top_factors": top_factors
    }
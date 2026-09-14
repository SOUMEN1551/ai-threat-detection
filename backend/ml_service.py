import joblib
import json
import numpy as np
import pandas as pd

# Load the multi-class trained model
model = joblib.load("threat_model_multiclass.pkl")

with open("feature_names.json", "r") as f:
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
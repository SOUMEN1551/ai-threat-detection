import pandas as pd
from ml_service import predict_threat

# Load one of our saved sample rows to test with
samples = pd.read_csv("sample_features.csv")
sample_row = samples.iloc[0].to_dict()

prediction, confidence = predict_threat(sample_row)
print(f"Prediction: {prediction}")
print(f"Confidence: {confidence}")
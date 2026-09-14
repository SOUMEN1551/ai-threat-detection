import pandas as pd
import numpy as np

df = pd.read_csv("../data/cicids2017_sample_1M_natural.csv")
X = df.drop('Label', axis=1).select_dtypes(include=['number'])
X = X.replace([np.inf, -np.inf], np.nan).fillna(0)

# Save the column names (feature names) the model expects
feature_names = X.columns.tolist()
import json
with open("feature_names.json", "w") as f:
    json.dump(feature_names, f)

# Save 5 sample rows to test with later
X.head(5).to_csv("sample_features.csv", index=False)
print("Saved feature_names.json and sample_features.csv")
print(f"Model expects {len(feature_names)} features")
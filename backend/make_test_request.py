import pandas as pd
import json

samples = pd.read_csv("sample_features.csv")
sample_row = samples.iloc[0].to_dict()

test_request = {
    "source_ip": "192.168.1.50",
    "dest_ip": "192.168.1.99",
    "event_type": "network_flow",
    "features": sample_row
}

with open("test_request.json", "w") as f:
    json.dump(test_request, f, indent=2)

print("Saved test_request.json - open it and copy its contents into /docs")
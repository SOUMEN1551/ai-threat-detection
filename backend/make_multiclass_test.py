import pandas as pd
import numpy as np
import json

df = pd.read_csv("../data/cicids2017_sample_1M_natural.csv")

# Grab one row that's a DDoS attack, to get an interesting test case
ddos_row = df[df['Label'] == 'DDoS'].iloc[0]
features = ddos_row.drop('Label').to_dict()

# Clean up any inf/nan values
features = {k: (0 if (v != v or v in [float('inf'), float('-inf')]) else v) for k, v in features.items()}

test_request = {
    "source_ip": "203.0.113.50",
    "dest_ip": "192.168.1.99",
    "event_type": "network_flow",
    "features": features
}

with open("test_request_multiclass.json", "w") as f:
    json.dump(test_request, f, indent=2)

print("Saved test_request_multiclass.json")
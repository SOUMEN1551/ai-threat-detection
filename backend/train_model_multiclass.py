import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib

print("Loading data...")
df = pd.read_csv("../data/cicids2017_sample_1M_natural.csv")

# This time, keep the ORIGINAL labels (DDoS, DoS Hulk, BENIGN, etc.)
# instead of collapsing them into ATTACK/BENIGN

print("\nOriginal label counts:")
print(df['Label'].value_counts())

X = df.drop('Label', axis=1)
y = df['Label']

X = X.select_dtypes(include=['number'])
X = X.replace([np.inf, -np.inf], np.nan).fillna(0)

print(f"\nUsing {X.shape[1]} numeric features")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Training multi-class model... (this may take a few minutes)")
# class_weight='balanced' helps the model pay more attention to rare attack types
# like Heartbleed and SQL Injection, which have very few examples
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'
)
model.fit(X_train, y_train)

print("\nEvaluating model...")
predictions = model.predict(X_test)
print(classification_report(y_test, predictions))

joblib.dump(model, "threat_model_multiclass.pkl")
print("\nModel saved as threat_model_multiclass.pkl!")
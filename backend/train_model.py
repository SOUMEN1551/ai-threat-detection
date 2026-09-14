import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib

print("Loading data...")
df = pd.read_csv("../data/cicids2017_sample_1M_natural.csv")

# Simplify the problem: BENIGN vs ATTACK
df['Label'] = df['Label'].apply(lambda x: 'BENIGN' if x == 'BENIGN' else 'ATTACK')

print("\nNew label counts:")
print(df['Label'].value_counts())

# Separate features (X) from the answer (y)
X = df.drop('Label', axis=1)
y = df['Label']

# Keep only numeric columns for now (simplify for a first model)
X = X.select_dtypes(include=['number'])

# Some rows may have missing or infinite values — clean those up
import numpy as np
X = X.replace([np.inf, -np.inf], np.nan)
X = X.fillna(0)

print(f"\nUsing {X.shape[1]} numeric features")

# Split into training data (80%) and testing data (20%)
print("\nSplitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Train the model
print("Training model... (this may take a minute)")
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Check how good it is
print("\nEvaluating model...")
predictions = model.predict(X_test)
print(classification_report(y_test, predictions))

# Save the trained model to a file
joblib.dump(model, "threat_model.pkl")
print("\nModel saved as threat_model.pkl!")
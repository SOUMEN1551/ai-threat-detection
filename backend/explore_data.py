import pandas as pd

# Load the CSV file (adjust path if needed)
df = pd.read_csv("../data/cicids2017_sample_1M_natural.csv")

print("First 5 rows:")
print(df.head())

print("\nShape (rows, columns):")
print(df.shape)

print("\nColumn names:")
print(df.columns.tolist)

print("\nLabel value counts:")
print(df['Label'].value_counts())
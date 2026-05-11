import pandas as pd

from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import StandardScaler

import joblib

# LOAD DATASET
df = pd.read_csv(
    "dataset/Synthetic_patient-HealthCare-Monitoring_dataset.csv"
)

print("Dataset Loaded Successfully")

# REMOVE NULL VALUES
df = df.dropna()

# REMOVE DUPLICATES
df = df.drop_duplicates()

print("Cleaning Completed")

# FEATURES
X = df[[
    'Heart Rate (bpm)',
    'SpO2 Level (%)',
    'Systolic Blood Pressure (mmHg)',
    'Diastolic Blood Pressure (mmHg)',
    'Body Temperature (°C)'
]]

# TARGET
y = df['Predicted Disease']

# LABEL ENCODING
encoder = LabelEncoder()

y_encoded = encoder.fit_transform(y)

print("Label Encoding Completed")

# FEATURE SCALING
scaler = StandardScaler()

X_scaled = scaler.fit_transform(X)

print("Feature Scaling Completed")

# SAVE PROCESSED DATASET
processed_df = pd.DataFrame(X_scaled)

processed_df['target'] = y_encoded

processed_df.to_csv(
    "dataset/processed_dataset.csv",
    index=False
)

# SAVE ENCODER
joblib.dump(
    encoder,
    "models/encoder.pkl"
)

# SAVE SCALER
joblib.dump(
    scaler,
    "models/scaler.pkl"
)

print("Preprocessing Completed")
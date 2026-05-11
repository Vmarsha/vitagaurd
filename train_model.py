import pandas as pd

from sklearn.ensemble import RandomForestClassifier

from sklearn.model_selection import train_test_split

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    classification_report
)

import joblib

# LOAD DATASET
df = pd.read_csv("vitaguard_advanced_patient_dataset.csv")

# FEATURES
X = df[[
    'age',
    'heart_rate',
    'spo2',
    'temperature',
    'respiratory_rate',
    'blood_pressure_systolic',
    'blood_pressure_diastolic'
]]

# TARGET
y = df['risk_level']

# SPLIT DATA
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# MODEL
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# TRAIN MODEL
model.fit(X_train, y_train)

# PREDICTIONS
predictions = model.predict(X_test)

# ACCURACY
accuracy = accuracy_score(y_test, predictions)

# PRECISION
precision = precision_score(
    y_test,
    predictions,
    average='weighted'
)

# RESULTS
print(f"Accuracy: {accuracy * 100:.2f}%")

print(f"Precision: {precision * 100:.2f}%")

print("\nClassification Report:\n")

print(classification_report(y_test, predictions))

# SAVE MODEL
joblib.dump(model, "model.pkl")

print("Model saved successfully")
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

# LOAD DATASET
df = pd.read_csv(
    "vitaguard_advanced_patient_dataset.csv"
)

# FEATURES
X = df[[

    "age",

    "heart_rate",

    "spo2",

    "temperature",

    "respiratory_rate",

    "blood_pressure_systolic",

    "blood_pressure_diastolic"

]]

# TARGET
y = df["risk_level"]

# SPLIT
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

# TRAIN
model.fit(
    X_train,
    y_train
)

# TEST
predictions = model.predict(
    X_test
)

accuracy = accuracy_score(
    y_test,
    predictions
)

print(
    f"Model Accuracy: {accuracy * 100:.2f}%"
)

# SAVE MODEL
joblib.dump(
    model,
    "model.pkl"
)

print(
    "Model saved successfully"
)
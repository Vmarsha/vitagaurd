import pandas as pd

from sklearn.model_selection import train_test_split

from sklearn.linear_model import LogisticRegression

from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score
)

import joblib

# LOAD DATASET
df = pd.read_csv(
    "dataset/processed_dataset.csv"
)

# FEATURES
X = df.drop('target', axis=1)

# TARGET
y = df['target']

# SPLIT
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# =========================
# LOGISTIC REGRESSION
# =========================

lr_model = LogisticRegression()

lr_model.fit(X_train, y_train)

lr_predictions = lr_model.predict(X_test)

lr_accuracy = accuracy_score(
    y_test,
    lr_predictions
)

lr_precision = precision_score(
    y_test,
    lr_predictions,
    average='weighted'
)

print("\nLOGISTIC REGRESSION")

print(f"Accuracy: {lr_accuracy*100:.2f}%")

print(f"Precision: {lr_precision*100:.2f}%")

# =========================
# RANDOM FOREST
# =========================

rf_model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

rf_model.fit(X_train, y_train)

rf_predictions = rf_model.predict(X_test)

rf_accuracy = accuracy_score(
    y_test,
    rf_predictions
)

rf_precision = precision_score(
    y_test,
    rf_predictions,
    average='weighted'
)

print("\nRANDOM FOREST")

print(f"Accuracy: {rf_accuracy*100:.2f}%")

print(f"Precision: {rf_precision*100:.2f}%")

# SAVE BOTH MODELS
joblib.dump(
    lr_model,
    "models/logistic_model.pkl"
)

joblib.dump(
    rf_model,
    "models/random_forest_model.pkl"
)

print("\nBoth Models Saved Successfully")
"""
Model Evaluation & Benchmark Script for VitaGuard
Compares multiple ML classification algorithms on the 7-feature clinical vitals dataset.
"""
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix
import joblib

np.random.seed(42)

def generate_clinical_dataset(n_samples_per_class=400):
    """
    Generates realistic clinical vital signs dataset for 5 diagnostic classes.
    Features: age, heart_rate, spo2, temperature, respiratory_rate, blood_pressure_systolic, blood_pressure_diastolic
    """
    data = []
    labels = []

    # Class 0: Normal / Low Risk
    for _ in range(n_samples_per_class):
        age = np.random.randint(18, 85)
        hr = np.random.uniform(60, 95)
        spo2 = np.random.uniform(95, 99.5)
        temp = np.random.uniform(97.2, 99.0)
        rr = np.random.uniform(12, 19)
        sbp = np.random.uniform(105, 128)
        dbp = np.random.uniform(68, 84)
        data.append([age, hr, spo2, temp, rr, sbp, dbp])
        labels.append(0)

    # Class 1: Cardiac Risk
    for _ in range(n_samples_per_class):
        age = np.random.randint(35, 90)
        hr = np.random.choice([np.random.uniform(115, 175), np.random.uniform(38, 52)])
        spo2 = np.random.uniform(92, 98)
        temp = np.random.uniform(97.0, 99.5)
        rr = np.random.uniform(16, 26)
        sbp = np.random.uniform(145, 195)
        dbp = np.random.uniform(92, 118)
        data.append([age, hr, spo2, temp, rr, sbp, dbp])
        labels.append(1)

    # Class 2: Respiratory Distress
    for _ in range(n_samples_per_class):
        age = np.random.randint(20, 85)
        hr = np.random.uniform(95, 130)
        spo2 = np.random.uniform(76, 91.5)
        temp = np.random.uniform(97.0, 99.8)
        rr = np.random.uniform(26, 46)
        sbp = np.random.uniform(110, 148)
        dbp = np.random.uniform(70, 92)
        data.append([age, hr, spo2, temp, rr, sbp, dbp])
        labels.append(2)

    # Class 3: Fever / Infection
    for _ in range(n_samples_per_class):
        age = np.random.randint(18, 80)
        hr = np.random.uniform(98, 135)
        spo2 = np.random.uniform(92, 97)
        temp = np.random.uniform(101.2, 105.2)
        rr = np.random.uniform(18, 28)
        sbp = np.random.uniform(102, 138)
        dbp = np.random.uniform(62, 86)
        data.append([age, hr, spo2, temp, rr, sbp, dbp])
        labels.append(3)

    # Class 4: Critical Multi-Organ Risk
    for _ in range(n_samples_per_class):
        age = np.random.randint(45, 95)
        hr = np.random.uniform(130, 185)
        spo2 = np.random.uniform(72, 88)
        temp = np.random.choice([np.random.uniform(102.5, 106.0), np.random.uniform(93.0, 95.5)])
        rr = np.random.uniform(32, 50)
        sbp = np.random.choice([np.random.uniform(170, 220), np.random.uniform(65, 85)])
        dbp = np.random.choice([np.random.uniform(105, 130), np.random.uniform(35, 52)])
        data.append([age, hr, spo2, temp, rr, sbp, dbp])
        labels.append(4)

    cols = ["age", "heart_rate", "spo2", "temperature", "respiratory_rate", "blood_pressure_systolic", "blood_pressure_diastolic"]
    X = pd.DataFrame(data, columns=cols)
    y = np.array(labels)
    return X, y

def main():
    print("=" * 80)
    print("VITAGUARD CLINICAL AI MODEL BENCHMARK & EVALUATION")
    print("=" * 80)

    X, y = generate_clinical_dataset(n_samples_per_class=400)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    print(f"Total Dataset Size : {len(X)} samples (5 balanced clinical classes)")
    print(f"Training Set Size  : {len(X_train)} samples")
    print(f"Testing Set Size   : {len(X_test)} samples\n")

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=5),
        "Support Vector Machine (SVM)": SVC(kernel='rbf', probability=True, random_state=42),
        "Decision Tree Classifier": DecisionTreeClassifier(max_depth=10, random_state=42),
        "Random Forest Classifier (VitaGuard)": RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42),
    }

    results = []

    for name, clf in models.items():
        # Train
        t0 = time.time()
        clf.fit(X_train, y_train)
        train_time = (time.time() - t0) * 1000

        # Predict & Benchmark Latency
        t0 = time.time()
        y_pred = clf.predict(X_test)
        inference_latency_ms = ((time.time() - t0) / len(X_test)) * 1000

        acc = accuracy_score(y_test, y_pred) * 100
        prec = precision_score(y_test, y_pred, average="weighted") * 100
        rec = recall_score(y_test, y_pred, average="weighted") * 100
        f1 = f1_score(y_test, y_pred, average="weighted")

        results.append({
            "Model": name,
            "Accuracy (%)": f"{acc:.1f}%",
            "Precision (%)": f"{prec:.1f}%",
            "Recall (%)": f"{rec:.1f}%",
            "F1-Score": f"{f1:.3f}",
            "Latency (ms/sample)": f"{inference_latency_ms:.3f} ms",
        })

    results_df = pd.DataFrame(results)
    print("COMPARATIVE EVALUATION SUMMARY TABLE:")
    print(results_df.to_string(index=False))
    print("\n" + "=" * 80)

    # Detailed Evaluation of Selected VitaGuard Random Forest Model
    rf_model = models["Random Forest Classifier (VitaGuard)"]
    y_rf_pred = rf_model.predict(X_test)
    class_names = ["0: Normal", "1: Cardiac Risk", "2: Respiratory Distress", "3: Fever/Infection", "4: Critical Multi-Organ Risk"]

    print("DETAILED CLASSIFICATION REPORT (RANDOM FOREST):")
    print(classification_report(y_test, y_rf_pred, target_names=class_names, digits=3))
    print("=" * 80)
    print("CONFUSION MATRIX (RANDOM FOREST):")
    cm = confusion_matrix(y_test, y_rf_pred)
    print(cm)
    print("=" * 80)

    # Feature Importances
    print("RANDOM FOREST FEATURE IMPORTANCES:")
    importances = rf_model.feature_importances_
    for col, imp in sorted(zip(X.columns, importances), key=lambda x: x[1], reverse=True):
        print(f"  • {col:25s}: {imp*100:.2f}%")
    print("=" * 80)

if __name__ == "__main__":
    main()

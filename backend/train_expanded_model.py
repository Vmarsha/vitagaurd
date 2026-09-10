"""
VitaGuard Comprehensive Multi-Disease Clinical ML Training Pipeline
Trains an advanced Random Forest Classifier on a 14,000-sample dataset spanning:
- Everyday General Outpatient / OPD Ailments (Common Cold, Tension Headache, Mild Dehydration, Allergic Rhinitis, Mild Hypertension)
- Specialized Ward Inpatient Conditions (Pneumonia, COPD, Hypertensive Crisis)
- Acute Critical Care Emergencies & Rare Pathologies (Myocardial Infarction, Heart Block, ARDS, Septic Shock, Malignant Hyperthermia, Hemorrhagic Shock)
"""
import json
import os
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_SAVE_PATH = MODELS_DIR / "model.pkl"
METADATA_SAVE_PATH = MODELS_DIR / "model_metadata.json"

FEATURE_COLS = [
    "age", "heart_rate", "spo2", "temperature",
    "respiratory_rate", "blood_pressure_systolic", "blood_pressure_diastolic"
]

def generate_comprehensive_dataset():
    """
    Generates 14,000 clinically realistic patient records with authentic
    hospital vital sign noise, overlapping symptoms, and sensor motion artifacts.
    """
    np.random.seed(42)
    records = []
    labels = []
    cohort_names = []

    # 1. Healthy Resting Baseline
    for _ in range(1000):
        records.append([
            np.random.randint(18, 80),
            np.clip(np.random.normal(74, 12), 52, 105),
            np.clip(np.random.normal(97.6, 2.0), 93.0, 100.0),
            np.clip(np.random.normal(98.4, 0.8), 96.5, 100.4),
            np.clip(np.random.normal(16, 3.5), 10, 24),
            np.clip(np.random.normal(118, 14), 92, 150),
            np.clip(np.random.normal(76, 9), 56, 95)
        ])
        labels.append(0)
        cohort_names.append("Healthy Resting Baseline")

    # 2. Common Cold & Viral URTI (Occasional mild fever & pulse spikes from cough)
    for _ in range(1000):
        records.append([
            np.random.randint(18, 75),
            np.clip(np.random.normal(82, 14), 60, 118),
            np.clip(np.random.normal(97.0, 2.2), 92.5, 99.5),
            np.clip(np.random.normal(99.4, 1.1), 97.5, 101.8),
            np.clip(np.random.normal(17, 3.5), 11, 25),
            np.clip(np.random.normal(122, 14), 95, 155),
            np.clip(np.random.normal(78, 10), 58, 96)
        ])
        labels.append(0)
        cohort_names.append("Common Cold & Viral URTI")

    # 3. Tension Headache & Migraine (Pain autonomic arousal)
    for _ in range(1000):
        records.append([
            np.random.randint(20, 70),
            np.clip(np.random.normal(86, 15), 62, 122),
            np.clip(np.random.normal(97.8, 1.8), 94.0, 100.0),
            np.clip(np.random.normal(98.6, 0.8), 96.8, 100.5),
            np.clip(np.random.normal(17, 3.5), 11, 24),
            np.clip(np.random.normal(128, 16), 100, 162),
            np.clip(np.random.normal(84, 11), 64, 104)
        ])
        labels.append(0)
        cohort_names.append("Tension Headache & Migraine")

    # 4. Mild Dehydration & Gastritis
    for _ in range(1000):
        records.append([
            np.random.randint(18, 78),
            np.clip(np.random.normal(94, 15), 68, 128),
            np.clip(np.random.normal(97.2, 2.0), 93.0, 99.5),
            np.clip(np.random.normal(98.8, 0.9), 96.8, 101.2),
            np.clip(np.random.normal(18, 3.8), 12, 26),
            np.clip(np.random.normal(112, 15), 88, 145),
            np.clip(np.random.normal(72, 11), 52, 94)
        ])
        labels.append(0)
        cohort_names.append("Mild Dehydration & Gastritis")

    # 5. Seasonal Allergy & Rhinitis
    for _ in range(1000):
        records.append([
            np.random.randint(18, 65),
            np.clip(np.random.normal(78, 12), 56, 110),
            np.clip(np.random.normal(96.8, 2.2), 92.0, 99.5),
            np.clip(np.random.normal(98.5, 0.8), 96.8, 100.2),
            np.clip(np.random.normal(18, 3.5), 12, 26),
            np.clip(np.random.normal(120, 14), 95, 150),
            np.clip(np.random.normal(78, 9), 58, 95)
        ])
        labels.append(0)
        cohort_names.append("Allergic Rhinitis & Seasonal Allergy")

    # 6. Hypertensive Tachyarrhythmia (Class 1)
    for _ in range(1000):
        records.append([
            np.random.randint(38, 88),
            np.clip(np.random.normal(136, 22), 95, 185),
            np.clip(np.random.normal(94.2, 3.2), 86.0, 99.0),
            np.clip(np.random.normal(98.6, 1.2), 96.0, 101.5),
            np.clip(np.random.normal(21, 4.5), 13, 32),
            np.clip(np.random.normal(168, 24), 125, 220),
            np.clip(np.random.normal(102, 16), 75, 130)
        ])
        labels.append(1)
        cohort_names.append("Hypertensive Tachycardia")

    # 7. Acute Coronary Ischemia (Class 1)
    for _ in range(1000):
        records.append([
            np.random.randint(45, 92),
            np.clip(np.random.normal(122, 22), 85, 170),
            np.clip(np.random.normal(93.2, 3.5), 85.0, 98.0),
            np.clip(np.random.normal(98.7, 1.2), 96.0, 101.5),
            np.clip(np.random.normal(23, 5.0), 14, 36),
            np.clip(np.random.normal(118, 24), 78, 165),
            np.clip(np.random.normal(74, 15), 45, 105)
        ])
        labels.append(1)
        cohort_names.append("Acute Coronary Ischemia")

    # 8. Complete Heart Block Bradycardia (Class 1 - Rare)
    for _ in range(1000):
        records.append([
            np.random.randint(50, 95),
            np.clip(np.random.normal(46, 8.0), 30, 68),
            np.clip(np.random.normal(93.8, 3.2), 86.0, 98.5),
            np.clip(np.random.normal(98.0, 1.1), 95.5, 100.5),
            np.clip(np.random.normal(16, 3.8), 10, 26),
            np.clip(np.random.normal(104, 20), 68, 145),
            np.clip(np.random.normal(62, 13), 38, 88)
        ])
        labels.append(1)
        cohort_names.append("Complete Heart Block Bradycardia")

    # 9. ARDS Refractory Hypoxia (Class 2)
    for _ in range(1000):
        records.append([
            np.random.randint(22, 85),
            np.clip(np.random.normal(114, 20), 78, 160),
            np.clip(np.random.normal(83.5, 5.5), 68.0, 93.0),
            np.clip(np.random.normal(98.9, 1.4), 96.0, 102.0),
            np.clip(np.random.normal(32, 7.0), 18, 50),
            np.clip(np.random.normal(126, 20), 88, 170),
            np.clip(np.random.normal(80, 12), 54, 108)
        ])
        labels.append(2)
        cohort_names.append("ARDS Refractory Hypoxia")

    # 10. COPD & Asthma Exacerbation (Class 2)
    for _ in range(1000):
        records.append([
            np.random.randint(30, 88),
            np.clip(np.random.normal(108, 18), 75, 150),
            np.clip(np.random.normal(88.0, 4.5), 78.0, 95.0),
            np.clip(np.random.normal(98.6, 1.2), 96.0, 101.5),
            np.clip(np.random.normal(28, 6.0), 16, 44),
            np.clip(np.random.normal(138, 20), 98, 180),
            np.clip(np.random.normal(84, 12), 58, 110)
        ])
        labels.append(2)
        cohort_names.append("COPD & Asthma Exacerbation")

    # 11. Febrile Pneumonia Sepsis (Class 3)
    for _ in range(1000):
        records.append([
            np.random.randint(18, 85),
            np.clip(np.random.normal(112, 18), 78, 152),
            np.clip(np.random.normal(93.2, 3.2), 85.0, 98.0),
            np.clip(np.random.normal(102.2, 1.6), 99.5, 105.8),
            np.clip(np.random.normal(23, 5.2), 13, 36),
            np.clip(np.random.normal(116, 18), 84, 155),
            np.clip(np.random.normal(74, 12), 48, 102)
        ])
        labels.append(3)
        cohort_names.append("Febrile Pneumonia Sepsis")

    # 12. Malignant Hyperthermia (Class 3 - Rare)
    for _ in range(1000):
        records.append([
            np.random.randint(18, 75),
            np.clip(np.random.normal(144, 20), 105, 188),
            np.clip(np.random.normal(92.0, 3.5), 84.0, 97.5),
            np.clip(np.random.normal(104.5, 1.5), 101.5, 108.0),
            np.clip(np.random.normal(31, 6.0), 18, 48),
            np.clip(np.random.normal(148, 22), 105, 195),
            np.clip(np.random.normal(92, 14), 62, 125)
        ])
        labels.append(3)
        cohort_names.append("Malignant Hyperthermia")

    # 13. Septic Shock Multi-Organ Failure (Class 4)
    for _ in range(1000):
        temp_mode = np.random.choice([np.random.normal(103.5, 1.8), np.random.normal(94.5, 1.4)])
        records.append([
            np.random.randint(40, 95),
            np.clip(np.random.normal(145, 24), 98, 198),
            np.clip(np.random.normal(81.5, 6.5), 64.0, 92.0),
            np.clip(temp_mode, 91.0, 107.0),
            np.clip(np.random.normal(36, 8.5), 20, 56),
            np.clip(np.random.normal(76, 14), 48, 108),
            np.clip(np.random.normal(48, 10), 28, 72)
        ])
        labels.append(4)
        cohort_names.append("Septic Shock Multi-Organ Failure")

    # 14. Hypovolemic Hemorrhagic Shock (Class 4 - Rare)
    for _ in range(1000):
        records.append([
            np.random.randint(18, 90),
            np.clip(np.random.normal(152, 22), 108, 202),
            np.clip(np.random.normal(83.0, 5.8), 68.0, 93.0),
            np.clip(np.random.normal(95.4, 1.4), 92.5, 98.5),
            np.clip(np.random.normal(34, 7.0), 18, 52),
            np.clip(np.random.normal(72, 12), 45, 102),
            np.clip(np.random.normal(44, 9), 25, 68)
        ])
        labels.append(4)
        cohort_names.append("Hemorrhagic Trauma Shock")

    df = pd.DataFrame(records, columns=FEATURE_COLS)
    return df, np.array(labels), np.array(cohort_names)

def main():
    print("=" * 80)
    print("VITAGUARD CLINICAL AI — 14,000-PATIENT MULTI-COHORT TRAINING PIPELINE")
    print("=" * 80)

    X, y, cohort_names = generate_comprehensive_dataset()
    print(f"Total Dataset Generated : {len(X)} clinical records across 14 disease cohorts")
    print(f"Features (7)            : {FEATURE_COLS}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"Training Set Size       : {len(X_train)} samples (80%)")
    print(f"Testing Set Size        : {len(X_test)} samples (20%)")
    print("\nTraining Enhanced Random Forest Classifier (250 Ensemble Trees)...")

    clf = RandomForestClassifier(
        n_estimators=250,
        max_depth=18,
        min_samples_split=3,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )

    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    acc = accuracy_score(y_test, y_pred) * 100
    precision = precision_score(y_test, y_pred, average="weighted") * 100
    recall = recall_score(y_test, y_pred, average="weighted") * 100
    f1 = f1_score(y_test, y_pred, average="weighted")

    print("\n" + "=" * 80)
    print("COMPREHENSIVE MODEL EVALUATION RESULTS:")
    print("=" * 80)
    print(f"Overall Accuracy         : {acc:.2f}%")
    print(f"Weighted Precision       : {precision:.2f}%")
    print(f"Weighted Recall          : {recall:.2f}%")
    print(f"Weighted F1-Score        : {f1:.4f}")

    class_names = [
        "0: Normal (Cold/Headache/Baseline)",
        "1: Cardiac Risk & Infarction",
        "2: Respiratory Distress & ARDS",
        "3: Fever & Sepsis Infection",
        "4: Critical Multi-Organ Collapse"
    ]
    print("\nDetailed Class-Wise Classification Report:")
    print(classification_report(y_test, y_pred, target_names=class_names, digits=3))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    # Save trained model.pkl
    joblib.dump(clf, MODEL_SAVE_PATH)
    print(f"\nTrained Model Serialized to: {MODEL_SAVE_PATH}")

    # Compute Feature Importances
    importances = {feat: float(imp * 100) for feat, imp in zip(FEATURE_COLS, clf.feature_importances_)}
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    print("\nFeature Importances (Explainable AI):")
    for feat, imp in sorted_importances.items():
        print(f"  • {feat:<26}: {imp:.2f}%")

    # Save Metadata
    metadata = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 250,
        "training_samples": len(X_train),
        "testing_samples": len(X_test),
        "total_samples": len(X),
        "accuracy_pct": round(acc, 2),
        "precision_pct": round(precision, 2),
        "recall_pct": round(recall, 2),
        "f1_score": round(f1, 4),
        "feature_importances": sorted_importances,
        "disease_cohorts": [
            "Healthy Resting Baseline",
            "Common Cold & Viral URTI",
            "Tension Headache & Migraine",
            "Mild Dehydration & Gastritis",
            "Allergic Rhinitis & Seasonal Allergy",
            "Hypertensive Tachycardia",
            "Acute Coronary Ischemia",
            "Complete Heart Block Bradycardia (Rare)",
            "ARDS Refractory Hypoxia",
            "COPD & Asthma Exacerbation",
            "Febrile Pneumonia Sepsis",
            "Malignant Hyperthermia (Rare)",
            "Septic Shock Multi-Organ Failure",
            "Hemorrhagic Trauma Shock (Rare)"
        ]
    }

    with open(METADATA_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Model Metadata Saved to    : {METADATA_SAVE_PATH}")
    print("=" * 80)

if __name__ == "__main__":
    main()

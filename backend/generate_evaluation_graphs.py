"""
VitaGuard Evaluation Graph Generator
Calculates Accuracy, Precision, Recall, and F1-Score and exports publication-quality graphs.
"""
import os
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

# Output directory for presentation images
OUTPUT_DIR = Path(__file__).parent.parent
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'

from train_expanded_model import generate_comprehensive_dataset

def main():
    print("Loading 14,000-sample comprehensive multi-disease clinical dataset...")
    X, y, cohort_names = generate_comprehensive_dataset()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=5),
        "Support Vector Machine": SVC(kernel='rbf', random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=14, random_state=42),
        "Random Forest (VitaGuard)": RandomForestClassifier(n_estimators=250, max_depth=18, random_state=42, n_jobs=-1),
    }

    metrics = {"Model": [], "Accuracy": [], "Precision": [], "Recall": [], "F1-Score": []}

    for name, clf in models.items():
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        metrics["Model"].append(name)
        metrics["Accuracy"].append(accuracy_score(y_test, preds) * 100)
        metrics["Precision"].append(precision_score(y_test, preds, average="weighted") * 100)
        metrics["Recall"].append(recall_score(y_test, preds, average="weighted") * 100)
        metrics["F1-Score"].append(f1_score(y_test, preds, average="weighted") * 100)

    df_metrics = pd.DataFrame(metrics)
    print("\nCalculated Metrics:")
    print(df_metrics)

    # -------------------------------------------------------------
    # GRAPH 1: Comparative Multi-Metric Bar Chart
    # -------------------------------------------------------------
    plt.figure(figsize=(11, 6), dpi=300)
    x = np.arange(len(df_metrics["Model"]))
    width = 0.2

    colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    plt.bar(x - 1.5*width, df_metrics["Accuracy"], width, label='Accuracy (%)', color=colors[0], edgecolor='black', linewidth=0.5)
    plt.bar(x - 0.5*width, df_metrics["Precision"], width, label='Precision (%)', color=colors[1], edgecolor='black', linewidth=0.5)
    plt.bar(x + 0.5*width, df_metrics["Recall"], width, label='Recall (%)', color=colors[2], edgecolor='black', linewidth=0.5)
    plt.bar(x + 1.5*width, df_metrics["F1-Score"], width, label='F1-Score (%)', color=colors[3], edgecolor='black', linewidth=0.5)

    plt.ylabel('Score (%)', fontsize=12, fontweight='bold')
    plt.title('Comparison of Clinical ML Model Metrics (VitaGuard Benchmark)', fontsize=14, fontweight='bold', pad=15)
    plt.xticks(x, df_metrics["Model"], fontsize=10, fontweight='semibold')
    plt.ylim(50, 105)
    plt.legend(frameon=True, facecolor='white', framealpha=0.9, fontsize=10, loc='lower right')
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    g1_path = OUTPUT_DIR / "model_metrics_comparison.png"
    plt.savefig(g1_path, dpi=300)
    plt.close()
    print(f"Saved: {g1_path}")

    # -------------------------------------------------------------
    # GRAPH 2: Confusion Matrix Heatmap for Random Forest
    # -------------------------------------------------------------
    rf = models["Random Forest (VitaGuard)"]
    rf_preds = rf.predict(X_test)
    cm = confusion_matrix(y_test, rf_preds)
    class_labels = ["Normal", "Cardiac Risk", "Respiratory", "Fever/Infection", "Critical Risk"]

    plt.figure(figsize=(8, 6.5), dpi=300)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=True,
                xticklabels=class_labels, yticklabels=class_labels,
                annot_kws={"size": 13, "weight": "bold"})
    plt.title('VitaGuard Random Forest — Confusion Matrix', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Predicted Clinical Condition', fontsize=12, fontweight='bold', labelpad=10)
    plt.ylabel('Actual Clinical Condition', fontsize=12, fontweight='bold', labelpad=10)
    plt.tight_layout()
    g2_path = OUTPUT_DIR / "confusion_matrix_heatmap.png"
    plt.savefig(g2_path, dpi=300)
    plt.close()
    print(f"Saved: {g2_path}")

    # -------------------------------------------------------------
    # GRAPH 3: Class-Wise Precision, Recall & F1-Score Breakdown
    # -------------------------------------------------------------
    report = classification_report(y_test, rf_preds, target_names=class_labels, output_dict=True)
    class_df = pd.DataFrame([
        {
            "Condition": cls,
            "Precision": report[cls]["precision"] * 100,
            "Recall": report[cls]["recall"] * 100,
            "F1-Score": report[cls]["f1-score"] * 100,
        }
        for cls in class_labels
    ])

    plt.figure(figsize=(10, 5.5), dpi=300)
    cx = np.arange(len(class_labels))
    cwidth = 0.25
    plt.bar(cx - cwidth, class_df["Precision"], cwidth, label='Precision (%)', color='#06b6d4', edgecolor='black', linewidth=0.5)
    plt.bar(cx, class_df["Recall"], cwidth, label='Recall (%)', color='#10b981', edgecolor='black', linewidth=0.5)
    plt.bar(cx + cwidth, class_df["F1-Score"], cwidth, label='F1-Score (%)', color='#6366f1', edgecolor='black', linewidth=0.5)

    plt.ylabel('Score (%)', fontsize=12, fontweight='bold')
    plt.title('Class-Wise Precision, Recall & F1-Score (VitaGuard Random Forest)', fontsize=13, fontweight='bold', pad=15)
    plt.xticks(cx, class_labels, fontsize=10, fontweight='semibold')
    plt.ylim(50, 105)
    plt.legend(frameon=True, facecolor='white', framealpha=0.9, fontsize=10)
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    g3_path = OUTPUT_DIR / "classwise_metrics.png"
    plt.savefig(g3_path, dpi=300)
    plt.close()
    print(f"Saved: {g3_path}")

    # -------------------------------------------------------------
    # GRAPH 4: Explainable AI (XAI) Feature Importance Chart
    # -------------------------------------------------------------
    feat_imp = pd.DataFrame({
        "Feature": ["Heart Rate", "Diastolic BP", "Respiratory Rate", "SpO₂ (Blood Oxygen)", "Core Temperature", "Systolic BP", "Age"],
        "Importance": rf.feature_importances_ * 100
    }).sort_values(by="Importance", ascending=True)

    plt.figure(figsize=(9, 5), dpi=300)
    plt.barh(feat_imp["Feature"], feat_imp["Importance"], color='#059669', edgecolor='black', linewidth=0.5, height=0.55)
    for index, value in enumerate(feat_imp["Importance"]):
        plt.text(value + 0.4, index, f"{value:.1f}%", va='center', fontsize=10, fontweight='bold', color='#1f2937')

    plt.xlabel('Relative Feature Importance (%)', fontsize=11, fontweight='bold')
    plt.title('Explainable AI (XAI) — Vital Sign Feature Attribution', fontsize=13, fontweight='bold', pad=12)
    plt.xlim(0, max(feat_imp["Importance"]) + 5)
    plt.grid(axis='x', linestyle='--', alpha=0.6)
    plt.tight_layout()
    g4_path = OUTPUT_DIR / "feature_importance_chart.png"
    plt.savefig(g4_path, dpi=300)
    plt.close()
    print(f"Saved: {g4_path}")

    print("\nAll 4 presentation graphs successfully generated and saved to your project directory!")

if __name__ == "__main__":
    main()

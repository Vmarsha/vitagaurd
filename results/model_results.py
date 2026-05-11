import pandas as pd

import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split

from sklearn.linear_model import LogisticRegression

from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix
)

# =========================
# LOAD DATASET
# =========================

df = pd.read_csv(
    "dataset/processed_dataset.csv"
)

print("Dataset Loaded Successfully")

# =========================
# FEATURES & TARGET
# =========================

X = df.drop('target', axis=1)

y = df['target']

# =========================
# TRAIN TEST SPLIT
# =========================

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

lr_prob = lr_model.predict_proba(X_test)

print("Logistic Regression Completed")

# =========================
# RANDOM FOREST
# =========================

rf_model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

rf_model.fit(X_train, y_train)

rf_predictions = rf_model.predict(X_test)

rf_prob = rf_model.predict_proba(X_test)

print("Random Forest Completed")

# =========================
# METRICS
# =========================

metrics = ['Accuracy', 'Precision', 'Recall', 'F1 Score']

# LOGISTIC REGRESSION SCORES
lr_scores = [

    accuracy_score(
        y_test,
        lr_predictions
    ),

    precision_score(
        y_test,
        lr_predictions,
        average='weighted'
    ),

    recall_score(
        y_test,
        lr_predictions,
        average='weighted'
    ),

    f1_score(
        y_test,
        lr_predictions,
        average='weighted'
    )
]

# RANDOM FOREST SCORES
rf_scores = [

    accuracy_score(
        y_test,
        rf_predictions
    ),

    precision_score(
        y_test,
        rf_predictions,
        average='weighted'
    ),

    recall_score(
        y_test,
        rf_predictions,
        average='weighted'
    ),

    f1_score(
        y_test,
        rf_predictions,
        average='weighted'
    )
]

# =========================
# ROC AUC VALUES
# =========================

lr_auc = roc_auc_score(
    y_test,
    lr_prob,
    multi_class='ovr'
)

rf_auc = roc_auc_score(
    y_test,
    rf_prob,
    multi_class='ovr'
)

print("\nROC AUC VALUES\n")

print(
    f"Logistic Regression ROC AUC: {lr_auc:.4f}"
)

print(
    f"Random Forest ROC AUC: {rf_auc:.4f}"
)

# =========================
# RESULTS TABLE
# =========================

results_df = pd.DataFrame({

    'Model': [
        'Logistic Regression',
        'Random Forest'
    ],

    'Accuracy': [
        lr_scores[0],
        rf_scores[0]
    ],

    'Precision': [
        lr_scores[1],
        rf_scores[1]
    ],

    'Recall': [
        lr_scores[2],
        rf_scores[2]
    ],

    'F1 Score': [
        lr_scores[3],
        rf_scores[3]
    ],

    'ROC AUC': [
        lr_auc,
        rf_auc
    ]
})

print("\nMODEL PERFORMANCE TABLE\n")

print(results_df)

# SAVE CSV
results_df.to_csv(
    "models/model_results.csv",
    index=False
)

print("Results Table Saved")

# =========================
# PERFORMANCE GRAPH
# =========================

x = range(len(metrics))

plt.figure(figsize=(12,6))

plt.bar(
    [i - 0.2 for i in x],
    lr_scores,
    width=0.4,
    label='Logistic Regression'
)

plt.bar(
    [i + 0.2 for i in x],
    rf_scores,
    width=0.4,
    label='Random Forest'
)

plt.xticks(x, metrics)

plt.ylabel("Score")

plt.title(
    "Model Performance Comparison"
)

plt.legend()

plt.savefig(
    "models/performance_comparison.png"
)

plt.close()

print("Performance Graph Saved")

# =========================
# ROC CURVE
# =========================

lr_fpr, lr_tpr, _ = roc_curve(
    y_test,
    lr_prob[:,1],
    pos_label=1
)

rf_fpr, rf_tpr, _ = roc_curve(
    y_test,
    rf_prob[:,1],
    pos_label=1
)

plt.figure(figsize=(10,6))

plt.plot(
    lr_fpr,
    lr_tpr,
    label=f'Logistic Regression (AUC={lr_auc:.2f})'
)

plt.plot(
    rf_fpr,
    rf_tpr,
    label=f'Random Forest (AUC={rf_auc:.2f})'
)

plt.plot(
    [0,1],
    [0,1],
    linestyle='--'
)

plt.xlabel("False Positive Rate")

plt.ylabel("True Positive Rate")

plt.title("ROC Curve Comparison")

plt.legend()

plt.savefig(
    "models/roc_curve.png"
)

plt.close()

print("ROC Curve Saved")

# =========================
# LOGISTIC REGRESSION MATRIX
# =========================

lr_cm = confusion_matrix(
    y_test,
    lr_predictions
)

plt.figure(figsize=(8,6))

plt.imshow(
    lr_cm,
    cmap='Blues'
)

plt.title(
    "Logistic Regression Confusion Matrix"
)

plt.colorbar()

plt.xlabel("Predicted")

plt.ylabel("Actual")

for i in range(len(lr_cm)):
    for j in range(len(lr_cm)):
        plt.text(
            j,
            i,
            lr_cm[i, j],
            ha='center',
            va='center',
            color='black'
        )

plt.savefig(
    "models/logistic_confusion_matrix.png"
)

plt.close()

print("Logistic Regression Matrix Saved")

# =========================
# RANDOM FOREST MATRIX
# =========================

rf_cm = confusion_matrix(
    y_test,
    rf_predictions
)

plt.figure(figsize=(8,6))

plt.imshow(
    rf_cm,
    cmap='Greens'
)

plt.title(
    "Random Forest Confusion Matrix"
)

plt.colorbar()

plt.xlabel("Predicted")

plt.ylabel("Actual")

for i in range(len(rf_cm)):
    for j in range(len(rf_cm)):
        plt.text(
            j,
            i,
            rf_cm[i, j],
            ha='center',
            va='center',
            color='black'
        )

plt.savefig(
    "models/random_forest_confusion_matrix.png"
)

plt.close()

print("Random Forest Matrix Saved")

print("\nALL RESULTS GENERATED SUCCESSFULLY")
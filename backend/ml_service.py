"""
Wraps model.pkl (the RandomForestClassifier from train_model.py) and the
clinical interpretation logic that used to live inline in Ai_risk_analysis.py.
"""
import random
from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path(__file__).parent / "models" / "model.pkl"
DOCTORS_PATH = Path(__file__).parent / "data" / "vitaguard_doctors.csv"

_model = None
_doctors_df = None

# prediction class -> (condition label, risk level, department to escalate to)
CONDITION_MAP = {
    0: ("Normal", "LOW", "General Medicine"),
    1: ("Cardiac Risk", "HIGH", "Cardiology"),
    2: ("Respiratory Distress", "CRITICAL", "Pulmonology"),
    3: ("Fever / Infection", "HIGH", "Infectious Disease"),
    4: ("Critical Multi-Organ Risk", "EMERGENCY", "Critical Care / ICU"),
}

FEATURE_ORDER = [
    "age", "heart_rate", "spo2", "temperature",
    "respiratory_rate", "blood_pressure_systolic", "blood_pressure_diastolic",
]


def get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"model.pkl not found at {MODEL_PATH}. Run train_model.py first."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def get_doctors_df():
    global _doctors_df
    if _doctors_df is None:
        if not DOCTORS_PATH.exists():
            raise FileNotFoundError(
                f"Doctor dataset not found at {DOCTORS_PATH}."
            )
        _doctors_df = pd.read_csv(DOCTORS_PATH)
    return _doctors_df


def predict_risk(vitals: dict) -> dict:
    """
    vitals: dict with keys matching FEATURE_ORDER.
    Returns condition, risk level, assigned doctor, and clinical explainability
    with False-Positive Suppression Filters (e.g. Liebermeister Rule, Pain Tachycardia).
    """
    model = get_model()

    input_df = pd.DataFrame([{k: vitals[k] for k in FEATURE_ORDER}])
    prediction = int(model.predict(input_df)[0])

    condition, risk, department = CONDITION_MAP.get(
        prediction, ("Unknown", "UNKNOWN", "General Medicine")
    )

    # --------------------------------------------------------------------------
    # CLINICAL FALSE-POSITIVE ALARM SUPPRESSION GUARDS (CDSS Safety Filter)
    # --------------------------------------------------------------------------
    hr = float(vitals.get("heart_rate", 75))
    temp = float(vitals.get("temperature", 98.6))
    spo2 = float(vitals.get("spo2", 98))
    sbp = float(vitals.get("blood_pressure_systolic", 120))
    dbp = float(vitals.get("blood_pressure_diastolic", 80))
    rr = float(vitals.get("respiratory_rate", 16))

    clinical_reasoning = "AI Random Forest consensus matching typical physiological pattern."
    guard_triggered = False

    # Guard 1: Liebermeister Rule (Simple Fever with Expected Compensatory Pulse)
    # Medical Rule: HR increases ~8.5-10 BPM per 1°F temperature rise.
    # A temp of 100-102°F with HR 95-120 and normal BP/O2 is a Simple Fever, NOT Cardiac Collapse.
    if 99.2 <= temp <= 102.5 and 90 <= hr <= 125 and spo2 >= 95.0 and 95 <= sbp <= 145:
        if condition in ("Cardiac Risk", "Critical Multi-Organ Risk"):
            condition = "Fever / Viral Infection"
            risk = "LOW"
            department = "General Medicine"
            clinical_reasoning = f"False Alarm Suppressed: Elevated pulse ({int(hr)} BPM) is normal physiological compensation for fever ({temp:.1f}°F) under Liebermeister rule. Lungs & BP stable."
            guard_triggered = True

    # Guard 2: Tension Headache / Anxiety Pain Spike
    # Mild autonomic pulse/BP elevation without hypoxia or fever is benign
    elif temp < 99.2 and hr <= 105 and spo2 >= 96.0 and 110 <= sbp <= 145 and rr <= 20:
        if condition != "Normal":
            condition = "Normal (Mild Pain / Anxiety)"
            risk = "LOW"
            department = "General Medicine"
            clinical_reasoning = "False Alarm Suppressed: Mild pulse/BP elevation consistent with transient pain or anxiety. No organ compromise."
            guard_triggered = True

    # Guard 3: Mild Dehydration / Orthostatic Pulse
    elif 90 <= hr <= 110 and spo2 >= 96.0 and temp <= 99.5 and sbp >= 95 and rr <= 20:
        if condition in ("Cardiac Risk", "Critical Multi-Organ Risk"):
            condition = "Normal (Mild Dehydration / Fatigue)"
            risk = "LOW"
            department = "General Medicine"
            clinical_reasoning = "False Alarm Suppressed: Mild compensatory tachycardia with adequate oxygenation and normal perfusion."
            guard_triggered = True

    doctor = assign_doctor(department)

    return {
        "condition": condition,
        "risk_level": risk,
        "department": department,
        "doctor_name": doctor["doctor_name"],
        "doctor_contact": doctor["contact_number"],
        "doctor_email": doctor["email"],
        "clinical_reasoning": clinical_reasoning,
        "false_alarm_guard_active": guard_triggered,
    }


def assign_doctor(department: str) -> dict:
    """Prefer a doctor from the matching department; fall back to any doctor."""
    df = get_doctors_df()
    matches = df[df["department"] == department]
    pool = matches if not matches.empty else df
    row = pool.sample(1).iloc[0]
    return {
        "doctor_name": row["doctor_name"],
        "department": row["department"],
        "contact_number": row["contact_number"],
        "email": row["email"],
    }


def automation_steps(risk_level: str, doctor_name: str) -> list:
    """Simulated clinical automation workflow, mirroring the original
    automation_workflow.py logic, returned as structured steps instead of
    being hardcoded into UI code."""
    if risk_level in ("CRITICAL", "EMERGENCY"):
        return [
            {"label": "Critical escalation triggered", "status": "error"},
            {"label": "Emergency email sent", "status": "success"},
            {"label": "ICU team notified", "status": "success"},
            {"label": "Incident report generated", "status": "success"},
            {"label": f"Assigned doctor: {doctor_name}", "status": "success"},
        ]
    elif risk_level == "HIGH":
        return [
            {"label": "High risk escalation", "status": "warning"},
            {"label": "Nurse notification sent", "status": "success"},
            {"label": "Doctor consultation triggered", "status": "success"},
        ]
    else:
        return [
            {"label": "Patient stable", "status": "success"},
        ]


def build_email_preview(row: dict, patient_name: str) -> str:
    return (
        f"TO: {row['doctor_name']}\n"
        f"EMAIL: {row['doctor_email']}\n"
        f"SUBJECT: VitaGuard Patient Deterioration Alert\n\n"
        f"Patient: {patient_name}\n"
        f"Detected Condition: {row['condition']}\n"
        f"Risk Category: {row['risk_level']}\n"
        f"Deterioration Score: {row.get('deterioration_score', 0) or 0}/100\n\n"
        "The VitaGuard AI monitoring system detected an abnormal clinical pattern. "
        "The assigned clinician should verify the patient and measurements.\n"
    )

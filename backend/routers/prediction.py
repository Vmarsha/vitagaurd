from fastapi import APIRouter, BackgroundTasks, HTTPException
from database import get_connection
from schemas import VitalsInput, PredictionOut
import ml_service
from clinical_alerts import process_alert

router = APIRouter(prefix="/api", tags=["prediction"])


@router.post("/predict", response_model=PredictionOut)
def predict(vitals: VitalsInput, background_tasks: BackgroundTasks):
    result = ml_service.predict_risk(vitals.dict())
    if vitals.doctor_name:
        result["doctor_name"] = vitals.doctor_name
    if vitals.doctor_email:
        result["doctor_email"] = vitals.doctor_email

    with get_connection() as conn:
        cursor = conn.execute(
            """INSERT INTO readings (
                patient_id, source, device_id, age, heart_rate, spo2, temperature,
                respiratory_rate, blood_pressure_systolic, blood_pressure_diastolic,
                ecg_raw, fall_detected, condition, risk_level,
                doctor_name, department, doctor_contact, doctor_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                vitals.patient_id, vitals.source, vitals.device_id, vitals.age,
                vitals.heart_rate, vitals.spo2, vitals.temperature,
                vitals.respiratory_rate, vitals.blood_pressure_systolic,
                vitals.blood_pressure_diastolic, vitals.ecg_raw,
                int(vitals.fall_detected), result["condition"], result["risk_level"],
                result["doctor_name"], result["department"],
                result["doctor_contact"], result["doctor_email"],
            ),
        )
        reading_id = cursor.lastrowid

    # Run email automation after the API response path has completed.
    background_tasks.add_task(process_alert, reading_id)
    return {"reading_id": reading_id, **result}


@router.get("/readings")
def list_readings(limit: int = 50):
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM readings ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]


@router.get("/readings/{reading_id}")
def get_reading(reading_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM readings WHERE id = ?", (reading_id,)).fetchone()
    return dict(row) if row else {}


@router.get("/readings/{reading_id}/automation")
def get_automation_steps(reading_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT risk_level, doctor_name, alert_status, deterioration_score FROM readings WHERE id = ?", (reading_id,)).fetchone()
    if not row:
        return {"steps": []}
    steps = ml_service.automation_steps(row["risk_level"], row["doctor_name"])
    steps.append({"label": f"Deterioration score: {row['deterioration_score'] or 0}/100", "status": "warning" if (row["deterioration_score"] or 0) >= 30 else "success"})
    steps.append({"label": f"Doctor email status: {row['alert_status'] or 'NOT_REQUIRED'}", "status": "success" if row["alert_status"] == "SENT" else "warning"})
    return {"steps": steps}


@router.get("/readings/{reading_id}/email")
def get_email_preview(reading_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT r.*, p.name as patient_name FROM readings r LEFT JOIN patients p ON r.patient_id = p.patient_id WHERE r.id = ?", (reading_id,)).fetchone()
    if not row:
        return {"email": None}
    patient_name = row["patient_name"] or row["patient_id"] or "Unknown Patient"
    return {"email": ml_service.build_email_preview(dict(row), patient_name) if hasattr(ml_service, 'build_email_preview') else f"TO: {row['doctor_name']}\nEMAIL: {row['doctor_email']}\nSUBJECT: VitaGuard Patient Deterioration Alert\n\nPatient: {patient_name}\nDetected Condition: {row['condition']}\nRisk Category: {row['risk_level']}"}


@router.post("/readings/{reading_id}/resend-alert")
def resend_alert(reading_id: int):
    result = process_alert(reading_id, force=True)
    if result.get("status") == "missing":
        raise HTTPException(status_code=404, detail="Reading not found")
    return result


@router.post("/readings/{reading_id}/acknowledge")
def acknowledge_alert(reading_id: int):
    from datetime import datetime
    with get_connection() as conn:
        row = conn.execute("SELECT id, alert_status FROM readings WHERE id = ?", (reading_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Reading not found")
        conn.execute("UPDATE readings SET alert_status = 'ACKNOWLEDGED', acknowledged_at = ? WHERE id = ?", (datetime.utcnow().isoformat(timespec="seconds"), reading_id))
    return {"status": "acknowledged", "reading_id": reading_id}

@router.get("/patients/{patient_id}/deterioration")
def patient_deterioration(patient_id: str, limit: int = 20):
    """Return a transparent trend summary for the dashboard."""
    from clinical_alerts import calculate_deterioration
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM readings WHERE patient_id = ? ORDER BY id DESC LIMIT ?",
            (patient_id, min(max(limit, 1), 100)),
        ).fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="No readings found for this patient")
    history = [dict(r) for r in reversed(rows)]
    latest = history[-1]
    analysis = calculate_deterioration(patient_id, latest, exclude_reading_id=latest["id"])
    return {"patient_id": patient_id, "latest": latest, "analysis": analysis, "history": history}


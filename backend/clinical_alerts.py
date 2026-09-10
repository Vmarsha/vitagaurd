from datetime import datetime, timedelta
from database import get_connection
from email_service import send_alert_email

ALERT_LEVELS = {"HIGH", "CRITICAL", "EMERGENCY"}


def _safe_delta(old, new):
    if old is None or new is None:
        return 0.0
    return float(new) - float(old)


def calculate_deterioration(patient_id: str, current: dict, exclude_reading_id: int | None = None) -> dict:
    """Score deterioration using recent patient history plus current abnormality.

    This is a transparent rule-based layer on top of the ML classification; it is
    intentionally not presented as a medically validated score.
    """
    if not patient_id:
        return {"score": 0, "trend": "INSUFFICIENT_HISTORY", "reasons": []}

    with get_connection() as conn:
        rows = conn.execute(
            """SELECT heart_rate, spo2, temperature, created_at\n               FROM readings WHERE patient_id = ?\n               ORDER BY id DESC LIMIT 5""",
            (patient_id,),
        ).fetchall()

    previous = [dict(r) for r in rows]
    if not previous:
        return {"score": 0, "trend": "BASELINE", "reasons": []}

    latest = previous[0]
    score = 0.0
    reasons = []

    hr_delta = _safe_delta(latest["heart_rate"], current.get("heart_rate"))
    spo2_delta = _safe_delta(latest["spo2"], current.get("spo2"))
    temp_delta = _safe_delta(latest["temperature"], current.get("temperature"))

    if hr_delta >= 10:
        score += min(25, hr_delta)
        reasons.append(f"Heart rate increased by {hr_delta:.0f} BPM")
    if spo2_delta <= -2:
        score += min(30, abs(spo2_delta) * 8)
        reasons.append(f"SpO₂ decreased by {abs(spo2_delta):.1f}%")
    if temp_delta >= 0.5:
        score += min(20, temp_delta * 15)
        reasons.append(f"Temperature increased by {temp_delta:.1f}°")

    hr = current.get("heart_rate") or 0
    spo2 = current.get("spo2") or 100
    temp = current.get("temperature") or 0
    abnormal = sum([
        hr > 120 or hr < 50,
        spo2 < 94,
        temp >= 38.0,
    ])
    if abnormal:
        score += abnormal * 8
        reasons.append(f"{abnormal} abnormal vital parameter(s) persist")

    score = round(min(100, score), 1)
    if score >= 60:
        trend = "RAPIDLY_DETERIORATING"
    elif score >= 30:
        trend = "WORSENING"
    else:
        trend = "STABLE"

    return {"score": score, "trend": trend, "reasons": reasons}


def should_send_alert(patient_id: str, risk_level: str) -> bool:
    if risk_level not in ALERT_LEVELS:
        return False
    if not patient_id:
        return True
    with get_connection() as conn:
        row = conn.execute(
            """SELECT alert_sent_at FROM readings\n               WHERE patient_id = ? AND alert_status = 'SENT'\n               ORDER BY id DESC LIMIT 1""",
            (patient_id,),
        ).fetchone()
    if not row or not row["alert_sent_at"]:
        return True
    try:
        last = datetime.fromisoformat(row["alert_sent_at"])
        return datetime.utcnow() - last >= timedelta(minutes=15)
    except ValueError:
        return True


def build_alert(patient_name, row, deterioration):
    subject = f"[VitaGuard] {row['risk_level']} alert — {row['condition']} — {row['patient_id']}"
    reasons = deterioration["reasons"] or ["Current AI risk classification requires clinical review"]
    body = f"""VitaGuard Clinical Alert\n\nPatient: {patient_name}\nPatient ID: {row['patient_id'] or 'Unknown'}\nRisk: {row['risk_level']}\nPredicted condition: {row['condition']}\nDepartment: {row['department']}\nAssigned doctor: {row['doctor_name']}\n\nCurrent vitals\nHeart rate: {row['heart_rate']} BPM\nSpO₂: {row['spo2']}%\nTemperature: {row['temperature']}\nRespiratory rate: {row['respiratory_rate']}\nBlood pressure: {row['blood_pressure_systolic']}/{row['blood_pressure_diastolic']} mmHg\n\nDeterioration analysis\nScore: {deterioration['score']}/100\nTrend: {deterioration['trend']}\nReasons:\n""" + "\n".join(f"- {r}" for r in reasons) + """\n\nThis is an automated decision-support alert for demonstration/research use. Clinical staff should verify the patient and measurements before acting.\n\nVitaGuard Automation Engine\n"""
    return subject, body


def process_alert(reading_id: int, force: bool = False):
    with get_connection() as conn:
        row = conn.execute(
            """SELECT r.*, COALESCE(p.name, r.patient_id, 'Unknown Patient') AS patient_name
               FROM readings r LEFT JOIN patients p ON r.patient_id = p.patient_id
               WHERE r.id = ?""",
            (reading_id,),
        ).fetchone()
    if not row:
        return {"status": "missing"}

    deterioration = calculate_deterioration(row["patient_id"], dict(row), exclude_reading_id=reading_id)
    risk = row["risk_level"] or "UNKNOWN"
    if risk not in ALERT_LEVELS:
        with get_connection() as conn:
            conn.execute("UPDATE readings SET deterioration_score = ?, alert_status = 'NOT_REQUIRED' WHERE id = ?", (deterioration["score"], reading_id))
        return {"status": "not_required", **deterioration}

    if not force and not should_send_alert(row["patient_id"], risk):
        with get_connection() as conn:
            conn.execute("UPDATE readings SET deterioration_score = ?, alert_status = 'COOLDOWN' WHERE id = ?", (deterioration["score"], reading_id))
        return {"status": "cooldown", **deterioration}

    subject, body = build_alert(row["patient_name"], row, deterioration)
    result = send_alert_email(row["doctor_email"], subject, body)
    now = datetime.utcnow().isoformat(timespec="seconds") if result["sent"] else None
    status = "SENT" if result["sent"] else "PENDING"
    with get_connection() as conn:
        conn.execute(
            "UPDATE readings SET deterioration_score = ?, alert_status = ?, alert_sent_at = ? WHERE id = ?",
            (deterioration["score"], status, now, reading_id),
        )
    return {"status": status.lower(), "email": row["doctor_email"], "reason": result["reason"], **deterioration}

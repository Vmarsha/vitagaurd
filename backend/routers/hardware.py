"""
Hardware ingestion endpoints. The ESP32 firmware (firmware/vitaguard_esp32.ino)
POSTs here directly - this used to be a separate FastAPI service but is now
merged into the main backend as requested.
"""
import threading
from fastapi import APIRouter, HTTPException, BackgroundTasks
from database import get_connection
from schemas import HardwarePayload
from routers.websocket import broadcast_patient_telemetry
import ml_service
from clinical_alerts import process_alert

router = APIRouter(prefix="/api/hardware", tags=["hardware"])

# Fast in-memory cache of the latest reading per device, so the frontend can
# poll without hitting SQLite every time. The DB remains the source of truth
# for history.
_lock = threading.Lock()
_latest_by_device = {}


@router.post("/ingest")
async def ingest(payload: HardwarePayload, background_tasks: BackgroundTasks):
    patient_id = payload.patient_id or "PT-101"

    # Convert Celsius to Fahrenheit if reading is within Celsius range (< 60°C)
    temp = payload.temperature
    if 25.0 <= temp <= 50.0:
        temp = round(temp * 9.0 / 5.0 + 32.0, 1)

    # Retrieve patient demographics and previous vitals baseline from DB
    age = 55
    sbp = 120.0
    dbp = 80.0
    rr = 16.0

    with get_connection() as conn:
        p_row = conn.execute("SELECT age FROM patients WHERE patient_id = ?", (patient_id,)).fetchone()
        if p_row and p_row["age"]:
            age = int(p_row["age"])

        last_reading = conn.execute(
            """SELECT blood_pressure_systolic, blood_pressure_diastolic, respiratory_rate
               FROM readings WHERE patient_id = ? AND blood_pressure_systolic IS NOT NULL
               ORDER BY id DESC LIMIT 1""",
            (patient_id,)
        ).fetchone()
        if last_reading:
            if last_reading["blood_pressure_systolic"]:
                sbp = float(last_reading["blood_pressure_systolic"])
            if last_reading["blood_pressure_diastolic"]:
                dbp = float(last_reading["blood_pressure_diastolic"])
            if last_reading["respiratory_rate"]:
                rr = float(last_reading["respiratory_rate"])

    # Run AI Risk Assessment automatically if vitals are active
    condition = None
    risk_level = None
    doctor_name = None
    department = None
    doctor_contact = None
    doctor_email = None

    if payload.heart_rate > 0 or payload.spo2 > 0:
        vitals_dict = {
            "age": age,
            "heart_rate": payload.heart_rate if payload.heart_rate > 0 else 75.0,
            "spo2": payload.spo2 if payload.spo2 > 0 else 98.0,
            "temperature": temp if temp > 70.0 else 98.6,
            "respiratory_rate": rr,
            "blood_pressure_systolic": sbp,
            "blood_pressure_diastolic": dbp,
        }
        try:
            pred = ml_service.predict_risk(vitals_dict)
            condition = pred["condition"]
            risk_level = pred["risk_level"]
            doctor_name = pred["doctor_name"]
            department = pred["department"]
            doctor_contact = pred["doctor_contact"]
            doctor_email = pred["doctor_email"]
        except Exception as e:
            print(f"[Hardware Ingest] AI prediction error: {e}")

    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO readings (
                patient_id, source, device_id, age, heart_rate, spo2,
                temperature, respiratory_rate, blood_pressure_systolic, blood_pressure_diastolic,
                ecg_raw, fall_detected, condition, risk_level,
                doctor_name, department, doctor_contact, doctor_email
            ) VALUES (?, 'hardware', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                patient_id, payload.device_id, age, payload.heart_rate,
                payload.spo2, temp, rr, sbp, dbp, payload.ecg_raw,
                int(payload.fall_detected), condition, risk_level,
                doctor_name, department, doctor_contact, doctor_email,
            ),
        )
        reading_id = cursor.lastrowid
        row = conn.execute(
            "SELECT * FROM readings WHERE id = ?", (reading_id,)
        ).fetchone()

    record = dict(row)
    with _lock:
        _latest_by_device[payload.device_id] = record

    # Trigger automatic background escalation alert if condition is high-risk
    if risk_level in ("HIGH", "CRITICAL", "EMERGENCY"):
        background_tasks.add_task(process_alert, reading_id)

    telemetry = {
        "patient_id": patient_id,
        "device_id": payload.device_id,
        "heart_rate": payload.heart_rate,
        "spo2": payload.spo2,
        "temperature": temp,
        "ecg": payload.ecg_raw,
        "fall_detected": payload.fall_detected,
        "condition": condition,
        "risk_level": risk_level,
        "device_status": "ONLINE",
        "timestamp": record.get("created_at"),
    }
    # Schedule async WebSocket fan-out
    if patient_id:
        await broadcast_patient_telemetry(patient_id, telemetry)

    return {
        "status": "ok",
        "reading_id": reading_id,
        "condition": condition,
        "risk_level": risk_level,
        "alert_triggered": risk_level in ("HIGH", "CRITICAL", "EMERGENCY"),
    }


@router.get("/latest/{device_id}")
def get_latest(device_id: str):
    with _lock:
        record = _latest_by_device.get(device_id)
    if record:
        return record

    # Fall back to DB in case the server restarted since the last reading
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT * FROM readings WHERE device_id = ? AND source = 'hardware'
            ORDER BY created_at DESC LIMIT 1
            """,
            (device_id,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No data yet for this device")
    return dict(row)


@router.get("/history/{device_id}")
def get_history(device_id: str, limit: int = 50):
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM readings WHERE device_id = ? AND source = 'hardware'
            ORDER BY created_at DESC LIMIT ?
            """,
            (device_id, limit),
        ).fetchall()
    return [dict(r) for r in reversed(rows)]


@router.get("/devices")
def list_devices():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT DISTINCT device_id FROM readings WHERE source = 'hardware'"
        ).fetchall()
    return [r["device_id"] for r in rows]

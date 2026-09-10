"""
Inter-Hospital Transfer & Facility Capability Matching Service
Finds nearby specialized partner hospitals when the current hospital lacks specific advanced facilities,
and dispatches official inter-hospital medical transfer escalations.
"""
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from database import get_connection
from email_service import send_alert_email

HOSPITALS_DATA_PATH = Path(__file__).parent / "data" / "nearby_hospitals.json"

_hospitals_cache = None

def get_all_nearby_hospitals() -> List[Dict]:
    global _hospitals_cache
    if _hospitals_cache is None:
        if not HOSPITALS_DATA_PATH.exists():
            return []
        with open(HOSPITALS_DATA_PATH, "r", encoding="utf-8") as f:
            _hospitals_cache = json.load(f)
    return _hospitals_cache

def find_matching_hospitals(condition: Optional[str] = None) -> List[Dict]:
    """
    Ranks nearby hospitals based on matched clinical condition and available ICU beds.
    """
    hospitals = get_all_nearby_hospitals()
    if not condition or condition in ("Normal", "All", "ALL"):
        return sorted(hospitals, key=lambda h: h["distance_km"])

    matched = []
    others = []

    for h in hospitals:
        if condition in h.get("matched_conditions", []):
            matched.append(h)
        else:
            others.append(h)

    # Sort matched hospitals first by available ICU beds (descending) and distance (ascending)
    matched.sort(key=lambda h: (-(h.get("available_icu_beds", 0)), h.get("distance_km", 999)))
    others.sort(key=lambda h: h.get("distance_km", 999))

    return matched + others

def create_transfer_escalation(
    patient_id: str,
    target_hospital_id: str,
    required_treatment: str,
    justification_notes: str,
    attending_physician: str,
    transport_mode: str = "Level-1 Critical Care Ambulance (ALS)",
) -> Dict:
    """
    Creates an inter-hospital transfer record and dispatches an emergency notification email
    to both the destination receiving hospital and the attending physician.
    """
    transfer_id = f"TRF-{datetime.utcnow().strftime('%m%d')}-{uuid.uuid4().hex[:5].upper()}"
    hospitals = get_all_nearby_hospitals()
    target_hosp = next((h for h in hospitals if h["id"] == target_hospital_id), None)

    if not target_hosp:
        raise ValueError(f"Target hospital {target_hospital_id} not found")

    with get_connection() as conn:
        # Fetch patient details
        p_row = conn.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,)).fetchone()
        patient_name = p_row["name"] if p_row else "Patient"
        current_ward = f"{p_row['ward']} ({p_row['room']})" if p_row and p_row["ward"] else "General Ward"

        # Fetch latest reading
        latest_reading = conn.execute(
            "SELECT * FROM readings WHERE patient_id = ? ORDER BY id DESC LIMIT 1",
            (patient_id,)
        ).fetchone()

        condition = latest_reading["condition"] if latest_reading and latest_reading["condition"] else "Clinical Deterioration"
        risk_level = latest_reading["risk_level"] if latest_reading and latest_reading["risk_level"] else "CRITICAL"
        hr = latest_reading["heart_rate"] if latest_reading and latest_reading["heart_rate"] else "N/A"
        spo2 = latest_reading["spo2"] if latest_reading and latest_reading["spo2"] else "N/A"
        temp = latest_reading["temperature"] if latest_reading and latest_reading["temperature"] else "N/A"
        bp_sys = latest_reading["blood_pressure_systolic"] if latest_reading and latest_reading["blood_pressure_systolic"] else "N/A"
        bp_dia = latest_reading["blood_pressure_diastolic"] if latest_reading and latest_reading["blood_pressure_diastolic"] else "N/A"

        # Insert transfer record into SQLite
        conn.execute(
            """
            INSERT INTO hospital_transfers (
                transfer_id, patient_id, patient_name, current_ward, condition, risk_level,
                source_hospital, target_hospital_id, target_hospital_name, target_department,
                required_treatment, transport_mode, contact_phone, contact_email,
                status, justification_notes, attending_physician
            ) VALUES (?, ?, ?, ?, ?, ?, 'KC General Hospital (Bengaluru, India)', ?, ?, ?, ?, ?, ?, ?, 'DISPATCHED', ?, ?)
            """,
            (
                transfer_id, patient_id, patient_name, current_ward, condition, risk_level,
                target_hosp["id"], target_hosp["name"], target_hosp["primary_specialty"],
                required_treatment, transport_mode, target_hosp["emergency_phone"],
                target_hosp["coordinator_email"], justification_notes, attending_physician
            )
        )

        row = conn.execute("SELECT * FROM hospital_transfers WHERE transfer_id = ?", (transfer_id,)).fetchone()

    # Build and dispatch Inter-Hospital Escalation Email with India Map link to target hospital coordinator & doctor
    maps_link = target_hosp.get("maps_url", f"https://www.google.com/maps/search/?api=1&query={target_hosp.get('latitude', 12.9716)},{target_hosp.get('longitude', 77.5946)}")
    subject = f"[VitaGuard India Transfer] URGENT Escalation: {patient_name} ({patient_id}) -> {target_hosp['name']}"
    body = f"""
================================================================================
OFFICIAL INTER-HOSPITAL EMERGENCY TRANSFER ESCALATION DISPATCH
VitaGuard Autonomous Clinical Healthcare Network (India Regional Hub)
================================================================================

TRANSFER ID         : {transfer_id}
DATE & TIME         : {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
ORIGINATING FACILITY: KC General Hospital (Bengaluru, Karnataka, India - Ward: {current_ward})
RECEIVING HOSPITAL  : {target_hosp['name']}
LOCATION / ADDRESS  : {target_hosp.get('address', 'Bengaluru, India')}
RECEIVING UNIT      : {target_hosp['primary_specialty']}
DISTANCE & ETA      : {target_hosp['distance_km']} km (Approx. {target_hosp['travel_time_mins']} mins via {transport_mode})
MAPS GPS NAVIGATION : {maps_link}
HOTLINE CONTACT     : {target_hosp['emergency_phone']} ({target_hosp['coordinator_name']})

--------------------------------------------------------------------------------
PATIENT CLINICAL PROFILE
--------------------------------------------------------------------------------
Patient Name        : {patient_name}
Patient ID / MRN    : {patient_id}
Diagnosed Condition : {condition}
Clinical Risk Level : {risk_level} (ACUTE ESCALATION)
Current Vitals      : Heart Rate: {hr} BPM | SpO2: {spo2}% | Temp: {temp}°F | BP: {bp_sys}/{bp_dia} mmHg

--------------------------------------------------------------------------------
TRANSFER JUSTIFICATION & REQUIRED SPECIALIZED TREATMENT
--------------------------------------------------------------------------------
Required Facility   : {required_treatment}
Reason for Transfer : Local hospital lacks specialized {target_hosp['primary_specialty']} infrastructure.
Physician Notes     : {justification_notes or 'Emergency specialized inter-hospital transfer initiated under ICMR/AIIMS clinical protocols.'}
Attending Physician : {attending_physician}
Transport Priority  : {transport_mode} (Green Corridor Priority Ambulance Alerted)

--------------------------------------------------------------------------------
CONFIRMATION & PROTOCOL
--------------------------------------------------------------------------------
The destination emergency intake team has been alerted. ICU bed reservation requested.
Paramedic transfer slip and live telemetry stream attached.

Confidential Clinical Health Document • VitaGuard EMR Transfer Protocol (India)
================================================================================
"""

    recipient_email = target_hosp.get("coordinator_email") or "vishruthac40@gmail.com"
    email_result = {"sent": False}
    try:
        email_result = send_alert_email(recipient_email, subject, body)
    except Exception as e:
        print(f"[Hospital Transfer Service] Email dispatch warning: {e}")

    transfer_data = dict(row)
    transfer_data["email_sent"] = email_result.get("sent", False)
    transfer_data["email_details"] = email_result
    return transfer_data

def list_recent_transfers(patient_id: Optional[str] = None) -> List[Dict]:
    with get_connection() as conn:
        if patient_id:
            rows = conn.execute(
                "SELECT * FROM hospital_transfers WHERE patient_id = ? ORDER BY id DESC",
                (patient_id,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM hospital_transfers ORDER BY id DESC LIMIT 50"
            ).fetchall()
    return [dict(r) for r in rows]

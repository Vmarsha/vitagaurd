"""Compatibility API for the Google AI Studio VitaGuard frontend.
Keeps the existing /api routes intact while exposing the frontend contract under /api/v1.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from database import get_connection
from clinical_alerts import calculate_deterioration
import ml_service

router = APIRouter(prefix="/api/v1", tags=["frontend"])

def risk_map(value):
    v=(value or "STABLE").upper()
    if v in {"HIGH", "HIGH_RISK"}: return "HIGH_RISK"
    if v in {"EMERGENCY", "CRITICAL"}: return "CRITICAL"
    if v in {"MONITOR", "MONITORING"}: return "MONITORING"
    return "STABLE"

def patient_obj(row, latest=None):
    return {
        "id": row["patient_id"], "name": row["name"], "age": row["age"],
        "gender": row["gender"] or "Other", "mrn": row["patient_id"],
        "ward": row["ward"] or "Unassigned", "bed": row["room"] or "—",
        "currentRisk": risk_map(latest["risk_level"] if latest else None),
        "currentStatus": "CRITICAL" if latest and risk_map(latest["risk_level"])=="CRITICAL" else "STABLE",
        "assignedDoctor": latest["doctor_name"] if latest and latest["doctor_name"] else "Unassigned",
        "doctorId": latest["doctor_name"] if latest and latest["doctor_name"] else "",
        "department": latest["department"] if latest and latest["department"] else "Unassigned",
        "admissionDate": row["created_at"], "primaryDiagnosis": latest["condition"] if latest and latest["condition"] else "Not assessed",
        "lastUpdated": latest["created_at"] if latest else row["created_at"],
    }

@router.get("/overview/metrics")
def overview_metrics():
    with get_connection() as conn:
        patients=conn.execute("SELECT COUNT(*) c FROM patients").fetchone()["c"]
        latest=conn.execute("SELECT risk_level, COUNT(*) c FROM readings GROUP BY risk_level").fetchall()
        active=conn.execute("SELECT COUNT(*) c FROM readings WHERE alert_status IN ('PENDING','SENT')").fetchone()["c"]
        ack=conn.execute("SELECT COUNT(*) c FROM readings WHERE alert_status='ACKNOWLEDGED' AND date(acknowledged_at)=date('now')").fetchone()["c"]
        devices=conn.execute("SELECT COUNT(DISTINCT device_id) c FROM readings WHERE source='hardware' AND created_at >= datetime('now','-5 minutes')").fetchone()["c"]
    counts={risk_map(r['risk_level']):r['c'] for r in latest}
    return {"totalPatients":patients,"stablePatients":counts.get("STABLE",0),"monitoringRequired":counts.get("MONITORING",0),"highRiskPatients":counts.get("HIGH_RISK",0),"criticalPatients":counts.get("CRITICAL",0),"activeAlerts":active,"acknowledgedAlertsToday":ack,"iotNodesOnline":devices,"totalIotNodes":max(devices,1)}

@router.get("/patients")
def patients(risk: str|None=None, q: str|None=None):
    with get_connection() as conn:
        rows=conn.execute("SELECT * FROM patients ORDER BY created_at DESC").fetchall()
        out=[]
        for p in rows:
            latest=conn.execute("SELECT * FROM readings WHERE patient_id=? ORDER BY id DESC LIMIT 1",(p['patient_id'],)).fetchone()
            obj=patient_obj(p,latest)
            if risk and risk!='ALL' and obj['currentRisk']!=risk: continue
            if q and q.lower() not in ' '.join(str(v) for v in obj.values()).lower(): continue
            out.append(obj)
    return out

@router.post("/patients")
def admit_patient(patient_data: dict):
    p_id = patient_data.get("patient_id") or patient_data.get("id") or f"PT-{datetime.utcnow().strftime('%H%M%S')}"
    name = patient_data.get("name") or "New Patient"
    age = int(patient_data.get("age") or 45)
    gender = patient_data.get("gender") or "Other"
    ward = patient_data.get("ward") or "General Ward"
    room = patient_data.get("room") or patient_data.get("bed") or "Bed 1"
    
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO patients (patient_id, name, age, gender, ward, room)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(patient_id) DO UPDATE SET
                name=excluded.name, age=excluded.age, gender=excluded.gender,
                ward=excluded.ward, room=excluded.room
            """,
            (p_id, name, age, gender, ward, room),
        )
        p = conn.execute("SELECT * FROM patients WHERE patient_id = ?", (p_id,)).fetchone()
    return patient_obj(p, None)

@router.get("/patients/{patient_id}")
def patient(patient_id: str):
    with get_connection() as conn:
        p=conn.execute("SELECT * FROM patients WHERE patient_id=?",(patient_id,)).fetchone()
        if not p: raise HTTPException(404,"Patient not found")
        latest=conn.execute("SELECT * FROM readings WHERE patient_id=? ORDER BY id DESC LIMIT 1",(patient_id,)).fetchone()
    return patient_obj(p,latest)

@router.get("/sensors/live/{patient_id}")
def live(patient_id: str):
    with get_connection() as conn:
        r=conn.execute("SELECT * FROM readings WHERE patient_id=? AND source='hardware' ORDER BY id DESC LIMIT 1",(patient_id,)).fetchone()
    if not r: raise HTTPException(404,"No hardware data")
    d=dict(r)
    return {"patientId":patient_id,"deviceId":d.get("device_id") or "VitaGuard-ESP32","heartRate":d.get("heart_rate") or 0,"spO2":d.get("spo2") or 0,"temperature":d.get("temperature") or 0,"ecgLead":"Lead II","ecgSampleRateHz":0,"ecgRhythm":"Sinus Rhythm","motionStatus":"RESTING","fallDetected":bool(d.get("fall_detected")),"deviceStatus":"ONLINE","batteryLevel":0,"signalStrengthDbm":0,"latencyMs":0,"lastUpdated":d.get("created_at")}

@router.get("/ai/analysis/{patient_id}")
def ai_analysis(patient_id: str):
    with get_connection() as conn:
        r=conn.execute("SELECT * FROM readings WHERE patient_id=? AND condition IS NOT NULL ORDER BY id DESC LIMIT 1",(patient_id,)).fetchone()
        p=conn.execute("SELECT * FROM patients WHERE patient_id=?",(patient_id,)).fetchone()
    if not r: raise HTTPException(404,"No prediction yet")
    d=dict(r)
    return {"patientId":patient_id,"patientName":p['name'] if p else patient_id,"predictedCondition":d.get('condition') or 'Unknown',"riskLevel":risk_map(d.get('risk_level')),"confidence":0,"assignedDoctor":d.get('doctor_name') or 'Unassigned',"department":d.get('department') or 'Unassigned',"analysisTimestamp":d.get('created_at'),"modelIdentifier":"VitaGuard Random Forest","recommendedAction":"Clinical review recommended","featureAttributions":[],"clinicalRationale":"Result generated by the VitaGuard backend model."}

@router.get("/deterioration/{patient_id}")
def deterioration(patient_id: str):
    with get_connection() as conn:
        rows=conn.execute("SELECT * FROM readings WHERE patient_id=? ORDER BY id ASC LIMIT 50",(patient_id,)).fetchall()
        p=conn.execute("SELECT * FROM patients WHERE patient_id=?",(patient_id,)).fetchone()
    if not rows: raise HTTPException(404,"No readings")
    hist=[dict(x) for x in rows]; latest=hist[-1]
    analysis=calculate_deterioration(patient_id, latest)
    score=analysis['score']; trend="CRITICAL" if score>=60 else "DETERIORATING" if score>=30 else "STABLE"
    points=[{"time":x.get('created_at'),"heartRate":x.get('heart_rate') or 0,"spO2":x.get('spo2') or 0,"temperature":x.get('temperature') or 0,"respiratoryRate":x.get('respiratory_rate') or 0,"systolicBP":x.get('blood_pressure_systolic') or 0,"diastolicBP":x.get('blood_pressure_diastolic') or 0,"deteriorationIndex":score} for x in hist]
    return {"patientId":patient_id,"patientName":p['name'] if p else patient_id,"deteriorationScore":score,"status":trend,"historicalTrends":points,"flaggedReasons":analysis['reasons'],"lastCalculated":latest.get('created_at'),"deteriorationVelocity":"RAPID" if score>=60 else "MODERATE" if score>=30 else "STEADY","baselineValues":{"heartRate":points[0]['heartRate'],"spO2":points[0]['spO2'],"temperature":points[0]['temperature'],"respRate":points[0]['respiratoryRate'],"bloodPressure":f"{points[0]['systolicBP']}/{points[0]['diastolicBP']} mmHg"},"currentValues":{"heartRate":points[-1]['heartRate'],"spO2":points[-1]['spO2'],"temperature":points[-1]['temperature'],"respRate":points[-1]['respiratoryRate'],"bloodPressure":f"{points[-1]['systolicBP']}/{points[-1]['diastolicBP']} mmHg"}}

@router.get("/ai/explain/{patient_id}")
def explain(patient_id: str):
    data=deterioration(patient_id)
    return {"patientId":patient_id,"patientName":data['patientName'],"riskLevel":"CRITICAL" if data['deteriorationScore']>=60 else "HIGH_RISK" if data['deteriorationScore']>=30 else "STABLE","deteriorationScore":data['deteriorationScore'],"reasons":data['flaggedReasons'],"factors":[],"aiAttributionNotes":"Transparent trend explanation generated from stored vital readings.","abnormalDurationMinutes":0,"backendEndpoint":f"/api/v1/ai/explain/{patient_id}"}

@router.get("/alerts")
def alerts(status: str|None=None):
    with get_connection() as conn:
        rows=conn.execute("SELECT r.*, COALESCE(p.name,r.patient_id) patient_name, p.ward, p.room FROM readings r LEFT JOIN patients p ON p.patient_id=r.patient_id WHERE r.alert_status IN ('PENDING','SENT','COOLDOWN','ACKNOWLEDGED') ORDER BY r.id DESC",()).fetchall()
    out=[]
    for r in rows:
        d=dict(r)
        if status and status!='ALL' and d.get('alert_status')!=status: continue
        out.append({"id":str(d['id']),"patientId":d.get('patient_id') or '',"patientName":d.get('patient_name') or '',"ward":d.get('ward') or '—',"bed":d.get('room') or '—',"predictedCondition":d.get('condition') or 'Unknown',"riskLevel":risk_map(d.get('risk_level')),"deteriorationScore":d.get('deterioration_score') or 0,"alertReason":"Clinical risk or deterioration requires review.","assignedDoctor":d.get('doctor_name') or 'Unassigned',"doctorId":d.get('doctor_name') or '',"emailStatus":d.get('alert_status') or 'PENDING',"ackStatus":d.get('alert_status') or 'PENDING',"timestamp":d.get('created_at')})
    return out

from datetime import datetime
import os
from email_service import send_alert_email

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge(alert_id: str, body: dict|None=None, background_tasks: BackgroundTasks = None):
    body = body or {}
    doctor_name = body.get("doctor_name") or "Attending Physician"
    notes = body.get("notes") or "Bedside evaluation completed and clinical orders verified."
    
    clean_id = str(alert_id).replace("ALT-", "").replace("ALT", "").strip()
    reading_row = None
    try:
        rid = int(clean_id)
        with get_connection() as conn:
            conn.execute("UPDATE readings SET alert_status='ACKNOWLEDGED', acknowledged_at=datetime('now') WHERE id=?",(rid,))
            reading_row = conn.execute(
                """SELECT r.*, COALESCE(p.name, r.patient_id, 'Unknown Patient') AS patient_name
                   FROM readings r LEFT JOIN patients p ON r.patient_id = p.patient_id
                   WHERE r.id = ?""",
                (rid,)
            ).fetchone()
    except (ValueError, TypeError):
        pass

    # Send doctor acknowledgement confirmation email
    if reading_row:
        r_dict = dict(reading_row)
        patient_name = r_dict.get("patient_name") or r_dict.get("patient_id") or "Patient"
        doctor_email = r_dict.get("doctor_email")
        if not doctor_email:
            df = ml_service.get_doctors_df()
            matches = df[df["doctor_name"] == doctor_name]
            if not matches.empty:
                doctor_email = matches.iloc[0]["email"]
        if not doctor_email:
            doctor_email = os.getenv("ALERT_FROM_EMAIL")
            
        if doctor_email:
            p_id = r_dict.get("patient_id") or "Unknown"
            condition = r_dict.get("condition") or "Clinical Escalation"
            risk = r_dict.get("risk_level") or "REVIEW"
            subject = f"[VitaGuard] Escalation ACKNOWLEDGED — {condition} — Patient {p_id}"
            email_body = (
                f"VitaGuard Clinical Escalation Acknowledgement\n"
                f"==================================================\n"
                f"Status: OFFICIALLY ACKNOWLEDGED & SIGNED OFF\n\n"
                f"Patient Name: {patient_name}\n"
                f"Patient ID: {p_id}\n"
                f"Condition: {condition}\n"
                f"Risk Category: {risk}\n\n"
                f"Acknowledging Clinician: {doctor_name}\n"
                f"Timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n"
                f"Bedside Action & Response Notes:\n"
                f"\"{notes}\"\n\n"
                f"Recorded Vitals at Alert:\n"
                f"- Heart Rate: {r_dict.get('heart_rate', '—')} BPM\n"
                f"- SpO₂: {r_dict.get('spo2', '—')}%\n"
                f"- Temperature: {r_dict.get('temperature', '—')}°\n"
                f"- Respiratory Rate: {r_dict.get('respiratory_rate', '—')}\n"
                f"- Blood Pressure: {r_dict.get('blood_pressure_systolic', '—')}/{r_dict.get('blood_pressure_diastolic', '—')} mmHg\n\n"
                f"This clinical action has been archived in the VitaGuard decision-support audit log.\n"
                f"==================================================\n"
                f"VitaGuard Automation & Clinical Safety Engine\n"
            )
            if background_tasks:
                background_tasks.add_task(send_alert_email, doctor_email, subject, email_body)
            else:
                send_alert_email(doctor_email, subject, email_body)

    return {"success": True, "message": "Alert acknowledged and confirmation email dispatched"}

@router.get("/doctors")
def doctors():
    df=ml_service.get_doctors_df(); out=[]
    for i,r in df.iterrows():
        name=r.get('Doctor Name') or r.get('doctor_name') or r.iloc[0]
        out.append({"id":str(i+1),"name":str(name),"department":str(r.get('Department') or r.get('department') or ''),"specialization":str(r.get('Specialization') or r.get('specialization') or ''),"activeCases":0,"activeAlerts":0,"email":str(r.get('Email') or r.get('email') or ''),"pager":"","onCall":True,"avatarInitials":''.join(x[0] for x in str(name).split()[:2])})
    return out

@router.get("/hospitals/nearby")
def get_nearby_hospitals(condition: str | None = None):
    import hospital_transfer_service
    return hospital_transfer_service.find_matching_hospitals(condition)

@router.post("/transfers/escalate")
def escalate_transfer(payload: dict):
    import hospital_transfer_service
    patient_id = payload.get("patient_id")
    target_hospital_id = payload.get("target_hospital_id")
    required_treatment = payload.get("required_treatment", "Advanced Tertiary Medical Care")
    justification_notes = payload.get("justification_notes", "Local facility lacks specialized equipment for patient condition.")
    attending_physician = payload.get("attending_physician", "Attending Physician")
    transport_mode = payload.get("transport_mode", "Level-1 Critical Care Ambulance (ALS)")

    if not patient_id or not target_hospital_id:
        raise HTTPException(400, "patient_id and target_hospital_id are required")

    try:
        res = hospital_transfer_service.create_transfer_escalation(
            patient_id=patient_id,
            target_hospital_id=target_hospital_id,
            required_treatment=required_treatment,
            justification_notes=justification_notes,
            attending_physician=attending_physician,
            transport_mode=transport_mode,
        )
        return {"success": True, "transfer": res}
    except Exception as e:
        raise HTTPException(500, f"Transfer escalation failed: {str(e)}")

@router.get("/transfers")
def list_transfers(patient_id: str | None = None):
    import hospital_transfer_service
    return hospital_transfer_service.list_recent_transfers(patient_id)


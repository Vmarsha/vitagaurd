"""
VitaGuard Comprehensive Clinical Demo Data Seeder
Populates the SQLite database (vitaguard.db) with rich, realistic clinical patient profiles,
multi-point historical vital streams (for Deterioration trajectory curves),
live hardware sensor telemetry snapshots, clinical alerts, and inter-hospital transfer records.
"""
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import random

DB_PATH = Path(__file__).parent / "vitaguard.db"

PATIENTS = [
    {
        "patient_id": "PT-101",
        "name": "Arthur Pendelton",
        "age": 68,
        "gender": "Male",
        "ward": "ICU Unit A",
        "room": "Bed 04",
        "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
        "condition": "Septic Shock / Multi-Organ Failure",
        "risk_level": "CRITICAL",
        "department": "Critical Care / ICU",
        "doctor_name": "Dr. Kavita Desai",
        "doctor_email": "vishruthac40@gmail.com",
        "doctor_contact": "+91-98450-11229",
        "vitals_progression": [
            {"hr": 92, "spo2": 96.0, "temp": 99.2, "rr": 18, "sbp": 115, "dbp": 75, "pdi": 12, "mins_ago": 180},
            {"hr": 105, "spo2": 93.5, "temp": 100.8, "rr": 22, "sbp": 102, "dbp": 68, "pdi": 38, "mins_ago": 120},
            {"hr": 118, "spo2": 91.0, "temp": 102.4, "rr": 26, "sbp": 90, "dbp": 58, "pdi": 65, "mins_ago": 60},
            {"hr": 134, "spo2": 87.5, "temp": 103.8, "rr": 32, "sbp": 78, "dbp": 46, "pdi": 88, "mins_ago": 5},
        ]
    },
    {
        "patient_id": "PT-102",
        "name": "Elena Rostova",
        "age": 54,
        "gender": "Female",
        "ward": "Cardiology Telemetry",
        "room": "Bed 12",
        "created_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
        "condition": "Acute Coronary Ischemia / Tachycardia",
        "risk_level": "HIGH",
        "department": "Cardiology",
        "doctor_name": "Dr. Ananya Rao",
        "doctor_email": "vishruthac40@gmail.com",
        "doctor_contact": "+91-98450-11223",
        "vitals_progression": [
            {"hr": 78, "spo2": 98.0, "temp": 98.6, "rr": 16, "sbp": 130, "dbp": 82, "pdi": 8, "mins_ago": 240},
            {"hr": 98, "spo2": 96.0, "temp": 98.7, "rr": 19, "sbp": 145, "dbp": 92, "pdi": 25, "mins_ago": 120},
            {"hr": 124, "spo2": 93.5, "temp": 98.8, "rr": 24, "sbp": 168, "dbp": 104, "pdi": 55, "mins_ago": 30},
            {"hr": 138, "spo2": 92.0, "temp": 98.9, "rr": 26, "sbp": 178, "dbp": 110, "pdi": 72, "mins_ago": 2},
        ]
    },
    {
        "patient_id": "PT-103",
        "name": "Marcus Vance",
        "age": 42,
        "gender": "Male",
        "ward": "Pulmonology Ward B",
        "room": "Bed 07",
        "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "condition": "ARDS Refractory Hypoxia",
        "risk_level": "CRITICAL",
        "department": "Pulmonology",
        "doctor_name": "Dr. Sneha Iyer",
        "doctor_email": "vishruthac40@gmail.com",
        "doctor_contact": "+91-98450-11225",
        "vitals_progression": [
            {"hr": 84, "spo2": 95.0, "temp": 98.8, "rr": 18, "sbp": 120, "dbp": 78, "pdi": 14, "mins_ago": 160},
            {"hr": 98, "spo2": 91.0, "temp": 99.2, "rr": 24, "sbp": 125, "dbp": 80, "pdi": 42, "mins_ago": 90},
            {"hr": 112, "spo2": 86.5, "temp": 99.4, "rr": 30, "sbp": 128, "dbp": 82, "pdi": 68, "mins_ago": 30},
            {"hr": 126, "spo2": 82.0, "temp": 99.6, "rr": 36, "sbp": 132, "dbp": 84, "pdi": 92, "mins_ago": 4},
        ]
    },
    {
        "patient_id": "PT-104",
        "name": "Clara Higgins",
        "age": 79,
        "gender": "Female",
        "ward": "Geriatric Ward",
        "room": "Bed 19",
        "created_at": (datetime.utcnow() - timedelta(days=4)).isoformat(),
        "condition": "Orthostatic Hypotension & Fall Event",
        "risk_level": "HIGH",
        "department": "Emergency Medicine",
        "doctor_name": "Dr. Neha Bhatt",
        "doctor_email": "vishruthac40@gmail.com",
        "doctor_contact": "+91-98450-11233",
        "vitals_progression": [
            {"hr": 74, "spo2": 97.0, "temp": 98.4, "rr": 16, "sbp": 118, "dbp": 74, "pdi": 5, "mins_ago": 200},
            {"hr": 82, "spo2": 96.5, "temp": 98.5, "rr": 17, "sbp": 105, "dbp": 66, "pdi": 18, "mins_ago": 100},
            {"hr": 110, "spo2": 95.0, "temp": 98.6, "rr": 21, "sbp": 92, "dbp": 58, "pdi": 48, "mins_ago": 15, "fall": 1},
        ]
    },
    {
        "patient_id": "PT-105",
        "name": "David Chen",
        "age": 35,
        "gender": "Male",
        "ward": "Surgical Recovery",
        "room": "Bed 02",
        "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "condition": "Normal (Post-Op Stable)",
        "risk_level": "LOW",
        "department": "General Medicine",
        "doctor_name": "Dr. Meera Pillai",
        "doctor_email": "vishruthac40@gmail.com",
        "doctor_contact": "+91-98450-11231",
        "vitals_progression": [
            {"hr": 72, "spo2": 98.5, "temp": 98.4, "rr": 15, "sbp": 118, "dbp": 76, "pdi": 0, "mins_ago": 180},
            {"hr": 70, "spo2": 99.0, "temp": 98.5, "rr": 14, "sbp": 120, "dbp": 78, "pdi": 0, "mins_ago": 60},
            {"hr": 68, "spo2": 99.2, "temp": 98.4, "rr": 14, "sbp": 116, "dbp": 75, "pdi": 0, "mins_ago": 10},
        ]
    },
    {
        "patient_id": "PT-106",
        "name": "Evelyn Brooks",
        "age": 62,
        "gender": "Female",
        "ward": "Stepdown Ward C",
        "room": "Bed 08",
        "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
        "condition": "Febrile Pneumonia Sepsis",
        "risk_level": "HIGH",
        "department": "Infectious Disease",
        "doctor_name": "Dr. Priya Nair",
        "doctor_email": "vishruthac40@gmail.com",
        "doctor_contact": "+91-98450-11227",
        "vitals_progression": [
            {"hr": 82, "spo2": 96.0, "temp": 99.8, "rr": 18, "sbp": 122, "dbp": 78, "pdi": 12, "mins_ago": 300},
            {"hr": 96, "spo2": 94.0, "temp": 101.5, "rr": 22, "sbp": 118, "dbp": 74, "pdi": 34, "mins_ago": 180},
            {"hr": 114, "spo2": 92.5, "temp": 103.2, "rr": 25, "sbp": 112, "dbp": 70, "pdi": 58, "mins_ago": 20},
        ]
    },
    {
        "patient_id": "PT-107",
        "name": "Samuel Okafor",
        "age": 51,
        "gender": "Male",
        "ward": "General Medicine",
        "room": "Bed 15",
        "created_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
        "condition": "Common Cold & Viral URTI",
        "risk_level": "LOW",
        "department": "General Medicine",
        "doctor_name": "Dr. Sanjay Kulkarni",
        "doctor_email": "vishruthac40@gmail.com",
        "doctor_contact": "+91-98450-11232",
        "vitals_progression": [
            {"hr": 76, "spo2": 98.0, "temp": 99.0, "rr": 16, "sbp": 122, "dbp": 78, "pdi": 0, "mins_ago": 240},
            {"hr": 78, "spo2": 97.8, "temp": 99.2, "rr": 16, "sbp": 124, "dbp": 80, "pdi": 0, "mins_ago": 120},
            {"hr": 74, "spo2": 98.2, "temp": 98.6, "rr": 15, "sbp": 120, "dbp": 78, "pdi": 0, "mins_ago": 15},
        ]
    },
    {
        "patient_id": "PT-108",
        "name": "Beatrice Morales",
        "age": 73,
        "gender": "Female",
        "ward": "ICU Unit B",
        "room": "Bed 01",
        "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "condition": "Complete Heart Block Bradycardia",
        "risk_level": "CRITICAL",
        "department": "Cardiology",
        "doctor_name": "Dr. Karan Mehta",
        "doctor_email": "vishruthac40@gmail.com",
        "doctor_contact": "+91-98450-11224",
        "vitals_progression": [
            {"hr": 64, "spo2": 96.0, "temp": 98.4, "rr": 16, "sbp": 115, "dbp": 72, "pdi": 10, "mins_ago": 180},
            {"hr": 52, "spo2": 94.0, "temp": 98.2, "rr": 18, "sbp": 104, "dbp": 62, "pdi": 35, "mins_ago": 90},
            {"hr": 42, "spo2": 91.5, "temp": 97.8, "rr": 20, "sbp": 94, "dbp": 54, "pdi": 76, "mins_ago": 5},
        ]
    }
]

HOSPITAL_TRANSFERS = [
    {
        "transfer_id": "TRF-0910-CARD01",
        "patient_id": "PT-102",
        "patient_name": "Elena Rostova",
        "current_ward": "Cardiology Telemetry (Bed 12)",
        "condition": "Acute Coronary Ischemia / Tachycardia",
        "risk_level": "HIGH",
        "source_hospital": "KC General Hospital (Bengaluru, India)",
        "target_hospital_id": "HOSP-IN-001",
        "target_hospital_name": "Sri Jayadeva Institute of Cardiovascular Sciences & Research",
        "target_department": "Cardiology, Interventional PCI & Cath Lab",
        "required_treatment": "Emergency Percutaneous Coronary Intervention (24/7 Primary PCI) & Cath Lab",
        "transport_mode": "Level-1 Critical Care Ambulance (ALS)",
        "contact_phone": "+91 80 2297 7400",
        "contact_email": "vishruthac40@gmail.com",
        "status": "DISPATCHED",
        "justification_notes": "Patient experiencing escalating ischemic chest pain with ST-segment depression on telemetry. Local facility lacks 24/7 interventional cath lab.",
        "attending_physician": "Dr. Ananya Rao, MD (Cardiology)"
    },
    {
        "transfer_id": "TRF-0910-RESP02",
        "patient_id": "PT-103",
        "patient_name": "Marcus Vance",
        "current_ward": "Pulmonology Ward B (Bed 07)",
        "condition": "ARDS Refractory Hypoxia",
        "risk_level": "CRITICAL",
        "source_hospital": "KC General Hospital (Bengaluru, India)",
        "target_hospital_id": "HOSP-IN-002",
        "target_hospital_name": "Manipal Hospital Comprehensive Pulmonary & ECMO Center",
        "target_department": "Pulmonology, Extracorporeal Life Support & ECMO",
        "required_treatment": "Veno-Venous Extracorporeal Membrane Oxygenation (ECMO) & HFOV",
        "transport_mode": "Code Red - Advanced Ventilator ALS Ambulance",
        "contact_phone": "+91 80 2502 4444",
        "contact_email": "vishruthac40@gmail.com",
        "status": "ACCEPTED",
        "justification_notes": "Refractory hypoxemia (PaO2/FiO2 < 80) unresponsive to maximum conventional invasive ventilation.",
        "attending_physician": "Dr. Sneha Iyer, MD (Pulmonology)"
    },
    {
        "transfer_id": "TRF-0910-SEPS03",
        "patient_id": "PT-101",
        "patient_name": "Arthur Pendelton",
        "current_ward": "ICU Unit A (Bed 04)",
        "condition": "Septic Shock / Multi-Organ Failure",
        "risk_level": "CRITICAL",
        "source_hospital": "KC General Hospital (Bengaluru, India)",
        "target_hospital_id": "HOSP-IN-003",
        "target_hospital_name": "Narayana Institute of Cardiac Sciences & Multi-Organ ICU",
        "target_department": "Critical Care, Sepsis & Multi-Organ Support",
        "required_treatment": "Continuous Renal Replacement Therapy (CRRT) & Cytokine Hemofiltration",
        "transport_mode": "Code Red - Multi-Organ Life Support Mobile ICU",
        "contact_phone": "+91 80 7122 2222",
        "contact_email": "vishruthac40@gmail.com",
        "status": "IN_TRANSIT",
        "justification_notes": "Refractory septic shock with anuric acute kidney injury requiring immediate bedside continuous dialysis.",
        "attending_physician": "Dr. Kavita Desai, MD (Critical Care)"
    }
]

def seed_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("[Seeder] Clearing old records for a fresh demo state...")
    cursor.execute("DELETE FROM readings")
    cursor.execute("DELETE FROM patients")
    cursor.execute("DELETE FROM hospital_transfers")

    print("[Seeder] Inserting comprehensive demo patients...")
    for p in PATIENTS:
        cursor.execute(
            """
            INSERT INTO patients (patient_id, name, age, gender, ward, room, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (p["patient_id"], p["name"], p["age"], p["gender"], p["ward"], p["room"], p["created_at"])
        )

    print("[Seeder] Inserting longitudinal vital sign readings and deterioration trajectories...")
    for p in PATIENTS:
        device_id = f"esp32_bed_{p['patient_id'].replace('PT-', '')}"
        for step in p["vitals_progression"]:
            created_at = (datetime.utcnow() - timedelta(minutes=step["mins_ago"])).strftime("%Y-%m-%d %H:%M:%S")
            alert_status = "SENT" if p["risk_level"] in ("HIGH", "CRITICAL") and step["mins_ago"] <= 30 else ("ACKNOWLEDGED" if p["risk_level"] in ("HIGH", "CRITICAL") and step["mins_ago"] > 60 else "NOT_REQUIRED")
            ack_at = (datetime.utcnow() - timedelta(minutes=step["mins_ago"] - 15)).strftime("%Y-%m-%d %H:%M:%S") if alert_status == "ACKNOWLEDGED" else None
            alert_sent_at = (datetime.utcnow() - timedelta(minutes=step["mins_ago"])).strftime("%Y-%m-%d %H:%M:%S") if alert_status in ("SENT", "ACKNOWLEDGED") else None

            cursor.execute(
                """
                INSERT INTO readings (
                    patient_id, source, device_id, age, heart_rate, spo2, temperature,
                    respiratory_rate, blood_pressure_systolic, blood_pressure_diastolic,
                    ecg_raw, fall_detected, condition, risk_level, doctor_name, department,
                    doctor_contact, doctor_email, deterioration_score, alert_status,
                    alert_sent_at, acknowledged_at, created_at
                ) VALUES (?, 'hardware', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    p["patient_id"], device_id, p["age"], step["hr"], step["spo2"], step["temp"],
                    step["rr"], step["sbp"], step["dbp"], random.randint(1950, 2150),
                    step.get("fall", 0), p["condition"], p["risk_level"], p["doctor_name"],
                    p["department"], p["doctor_contact"], p["doctor_email"], step["pdi"],
                    alert_status, alert_sent_at, ack_at, created_at
                )
            )

    print("[Seeder] Inserting inter-hospital transfer records...")
    for t in HOSPITAL_TRANSFERS:
        cursor.execute(
            """
            INSERT INTO hospital_transfers (
                transfer_id, patient_id, patient_name, current_ward, condition, risk_level,
                source_hospital, target_hospital_id, target_hospital_name, target_department,
                required_treatment, transport_mode, contact_phone, contact_email,
                status, justification_notes, attending_physician, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                t["transfer_id"], t["patient_id"], t["patient_name"], t["current_ward"],
                t["condition"], t["risk_level"], t["source_hospital"], t["target_hospital_id"],
                t["target_hospital_name"], t["target_department"], t["required_treatment"],
                t["transport_mode"], t["contact_phone"], t["contact_email"], t["status"],
                t["justification_notes"], t["attending_physician"],
                (datetime.utcnow() - timedelta(hours=random.randint(1, 6))).strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    conn.commit()
    conn.close()
    print("[Seeder] Demo data successfully seeded into vitaguard.db!")

if __name__ == "__main__":
    seed_data()

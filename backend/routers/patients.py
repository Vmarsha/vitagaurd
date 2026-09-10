from fastapi import APIRouter, HTTPException
from typing import List, Optional
from database import get_connection
from schemas import PatientCreate, PatientOut

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("", response_model=PatientOut)
def create_patient(patient: PatientCreate):
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO patients (patient_id, name, age, gender, ward, room)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(patient_id) DO UPDATE SET
                name=excluded.name, age=excluded.age, gender=excluded.gender,
                ward=excluded.ward, room=excluded.room
            """,
            (patient.patient_id, patient.name, patient.age,
             patient.gender, patient.ward, patient.room),
        )
        row = conn.execute(
            "SELECT * FROM patients WHERE patient_id = ?", (patient.patient_id,)
        ).fetchone()
    return dict(row)


@router.get("", response_model=List[PatientOut])
def list_patients():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM patients ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


@router.get("/{patient_id}")
def get_patient(patient_id: str):
    with get_connection() as conn:
        patient = conn.execute(
            "SELECT * FROM patients WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        readings = conn.execute(
            """
            SELECT * FROM readings WHERE patient_id = ?
            ORDER BY created_at DESC LIMIT 20
            """,
            (patient_id,),
        ).fetchall()

    return {
        "patient": dict(patient),
        "readings": [dict(r) for r in readings],
    }

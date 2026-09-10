from pydantic import BaseModel, Field
from typing import Optional


class PatientCreate(BaseModel):
    patient_id: str
    name: str
    age: int = Field(ge=1, le=120)
    gender: Optional[str] = None
    ward: Optional[str] = None
    room: Optional[str] = None


class PatientOut(BaseModel):
    patient_id: str
    name: str
    age: int
    gender: Optional[str] = None
    ward: Optional[str] = None
    room: Optional[str] = None
    created_at: str


class VitalsInput(BaseModel):
    patient_id: Optional[str] = None
    age: int = Field(ge=1, le=120)
    heart_rate: float = Field(ge=0, le=300)
    spo2: float = Field(ge=0, le=100)
    temperature: float = Field(ge=70, le=115)  # Fahrenheit
    respiratory_rate: float = Field(ge=0, le=80)
    blood_pressure_systolic: float = Field(ge=0, le=300)
    blood_pressure_diastolic: float = Field(ge=0, le=200)
    source: str = "manual"
    device_id: Optional[str] = None
    ecg_raw: Optional[int] = None
    fall_detected: bool = False
    doctor_name: Optional[str] = None
    doctor_email: Optional[str] = None


class PredictionOut(BaseModel):
    reading_id: int
    condition: str
    risk_level: str
    doctor_name: str
    department: str
    doctor_contact: str
    doctor_email: str


class HardwarePayload(BaseModel):
    device_id: str
    patient_id: Optional[str] = None
    heart_rate: float = -1
    spo2: float = -1
    temperature: float = -1
    ecg_raw: int = -1
    fall_detected: bool = False

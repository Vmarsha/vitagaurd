"""
SQLite persistence layer for VitaGuard.
Replaces the original app's scattered CSV files with one queryable database
so patient history, live hardware readings, and escalations all persist
across restarts.
"""
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent / "vitaguard.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
    patient_id   TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    age          INTEGER NOT NULL,
    gender       TEXT,
    ward         TEXT,
    room         TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS readings (
    id                       INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id               TEXT,
    source                   TEXT NOT NULL DEFAULT 'manual',   -- 'manual' | 'hardware'
    device_id                TEXT,
    age                      INTEGER,
    heart_rate                REAL,
    spo2                      REAL,
    temperature               REAL,
    respiratory_rate          REAL,
    blood_pressure_systolic   REAL,
    blood_pressure_diastolic  REAL,
    ecg_raw                   INTEGER,
    fall_detected             INTEGER DEFAULT 0,
    condition                 TEXT,
    risk_level                TEXT,
    doctor_name               TEXT,
    department                TEXT,
    doctor_contact             TEXT,
    doctor_email                TEXT,
    created_at                TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
);

CREATE TABLE IF NOT EXISTS hospital_transfers (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_id          TEXT UNIQUE,
    patient_id           TEXT NOT NULL,
    patient_name         TEXT NOT NULL,
    current_ward         TEXT,
    condition            TEXT NOT NULL,
    risk_level           TEXT NOT NULL,
    source_hospital      TEXT DEFAULT 'St. Jude Medical Center',
    target_hospital_id   TEXT NOT NULL,
    target_hospital_name TEXT NOT NULL,
    target_department    TEXT NOT NULL,
    required_treatment   TEXT NOT NULL,
    transport_mode       TEXT DEFAULT 'Level-1 Critical Care Ambulance (ALS)',
    contact_phone        TEXT,
    contact_email        TEXT,
    status               TEXT DEFAULT 'DISPATCHED',
    justification_notes  TEXT,
    attending_physician  TEXT,
    created_at           TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
);

CREATE INDEX IF NOT EXISTS idx_readings_patient ON readings (patient_id);
CREATE INDEX IF NOT EXISTS idx_readings_device ON readings (device_id);
CREATE INDEX IF NOT EXISTS idx_readings_created ON readings (created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_patient ON hospital_transfers (patient_id);
"""


def init_db():
    with get_connection() as conn:
        conn.executescript(SCHEMA)
        # Lightweight migration for databases created by older VitaGuard versions.
        columns = {r[1] for r in conn.execute("PRAGMA table_info(readings)").fetchall()}
        migrations = {
            "deterioration_score": "ALTER TABLE readings ADD COLUMN deterioration_score REAL DEFAULT 0",
            "alert_status": "ALTER TABLE readings ADD COLUMN alert_status TEXT DEFAULT 'NOT_REQUIRED'",
            "alert_sent_at": "ALTER TABLE readings ADD COLUMN alert_sent_at TEXT",
            "acknowledged_at": "ALTER TABLE readings ADD COLUMN acknowledged_at TEXT",
        }
        for name, statement in migrations.items():
            if name not in columns:
                conn.execute(statement)


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Foreign keys are intentionally NOT enforced: hardware readings and
    # manual vitals entries can legitimately arrive with a patient_id that
    # hasn't been registered via /api/patients yet (e.g. a sensor node
    # streaming before admission is completed in the UI). Enforcing the FK
    # here would reject those readings instead of just recording them.
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

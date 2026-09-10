from fastapi import APIRouter
from database import get_connection

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary():
    with get_connection() as conn:
        patient_count = conn.execute(
            "SELECT COUNT(*) c FROM patients"
        ).fetchone()["c"]

        reading_count = conn.execute(
            "SELECT COUNT(*) c FROM readings"
        ).fetchone()["c"]

        risk_breakdown = conn.execute(
            """
            SELECT risk_level, COUNT(*) c FROM readings
            WHERE risk_level IS NOT NULL
            GROUP BY risk_level
            """
        ).fetchall()

        active_devices = conn.execute(
            """
            SELECT COUNT(DISTINCT device_id) c FROM readings
            WHERE source = 'hardware'
              AND created_at >= datetime('now', '-5 minutes')
            """
        ).fetchone()["c"]

        recent_critical = conn.execute(
            """
            SELECT COUNT(*) c FROM readings
            WHERE risk_level IN ('CRITICAL', 'EMERGENCY')
              AND created_at >= datetime('now', '-1 hour')
            """
        ).fetchone()["c"]

    return {
        "patients_monitored": patient_count,
        "total_readings": reading_count,
        "risk_breakdown": {r["risk_level"]: r["c"] for r in risk_breakdown},
        "active_hardware_devices": active_devices,
        "critical_alerts_last_hour": recent_critical,
        "system_status": "ACTIVE",
    }

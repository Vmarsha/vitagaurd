import os
import smtplib
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
from email.message import EmailMessage


def is_configured() -> bool:
    return all(os.getenv(k) for k in ("SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "ALERT_FROM_EMAIL"))


def send_alert_email(to_email: str, subject: str, body: str) -> dict:
    """Send an alert email. Returns a structured result instead of raising SMTP errors."""
    if not to_email:
        return {"sent": False, "reason": "Doctor email is missing"}
    if not is_configured():
        return {"sent": False, "reason": "SMTP is not configured; alert was recorded but not sent"}

    host = os.environ["SMTP_HOST"]
    port = int(os.environ["SMTP_PORT"])
    username = os.environ["SMTP_USERNAME"]
    password = os.environ["SMTP_PASSWORD"].replace(" ", "").replace("-", "").strip()
    sender = os.environ["ALERT_FROM_EMAIL"]
    target_recipient = os.getenv("ALERT_OVERRIDE_EMAIL") or to_email

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = target_recipient
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(msg)
        return {"sent": True, "reason": "Email sent successfully"}
    except Exception as exc:
        return {"sent": False, "reason": f"SMTP error: {exc}"}

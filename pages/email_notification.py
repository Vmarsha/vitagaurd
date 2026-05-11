import streamlit as st

st.title("Automated Email Notification")

name = st.session_state.get(
    "name",
    "Unknown"
)

doctor = st.session_state.get(
    "doctor",
    "Doctor"
)

email = st.session_state.get(
    "email",
    "doctor@hospital.com"
)

risk = st.session_state.get(
    "risk",
    "Unknown"
)

condition = st.session_state.get(
    "condition",
    "Unknown"
)

email_content = f"""
TO: {doctor}

EMAIL: {email}

SUBJECT: VitaGuard Patient Deterioration Alert

Patient Name: {name}

Detected Condition: {condition}

Risk Category: {risk}

The VitaGuard AI monitoring system has detected abnormal clinical patterns requiring medical attention.

Immediate clinical review is recommended.

Regards,
VitaGuard Automation Engine
"""

st.code(email_content)
import streamlit as st
import time

st.title("UiPath Automation Workflow")

risk = st.session_state.get(
    "risk",
    "LOW"
)

doctor = st.session_state.get(
    "doctor",
    "Unknown"
)

if risk in [
    "CRITICAL",
    "EMERGENCY"
]:

    with st.spinner(
        "Executing Emergency Workflow..."
    ):
        time.sleep(2)

    st.error(
        "Critical Escalation Triggered"
    )

    st.success(
        "Emergency Email Sent"
    )

    st.success(
        "ICU Team Notified"
    )

    st.success(
        "Incident Report Generated"
    )

    st.success(
        f"Assigned Doctor: {doctor}"
    )

elif risk == "HIGH":

    with st.spinner(
        "Executing Clinical Workflow..."
    ):
        time.sleep(2)

    st.warning(
        "High Risk Escalation"
    )

    st.success(
        "Nurse Notification Sent"
    )

    st.success(
        "Doctor Consultation Triggered"
    )

else:

    st.success(
        "Patient Stable"
    )
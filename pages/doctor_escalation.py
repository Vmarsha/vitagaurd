import streamlit as st

st.title("Clinical Escalation Details")

name = st.session_state.get(
    "name",
    "Unknown"
)

doctor = st.session_state.get(
    "doctor",
    "Unknown"
)

department = st.session_state.get(
    "department",
    "Unknown"
)

contact = st.session_state.get(
    "contact",
    "Unavailable"
)

email = st.session_state.get(
    "email",
    "Unavailable"
)

risk = st.session_state.get(
    "risk",
    "Unknown"
)

st.info(f"""

Patient Name: {name}

Assigned Doctor: {doctor}

Department: {department}

Contact Number: {contact}

Doctor Email: {email}

Risk Category: {risk}

Emergency Response Status: ACTIVE

""")
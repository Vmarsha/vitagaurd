import streamlit as st

st.title("Patient Admission & Vital Entry")

# BASIC DETAILS
col1, col2 = st.columns(2)

with col1:

    name = st.text_input("Patient Name")

    age = st.number_input(
        "Age",
        min_value=1,
        max_value=100,
        value=25
    )

    gender = st.selectbox(
        "Gender",
        ["Male", "Female", "Other"]
    )

with col2:

    patient_id = st.text_input("Patient ID")

    ward = st.selectbox(
        "Ward",
        ["General", "ICU", "Emergency"]
    )

    room = st.text_input("Room Number")

st.markdown("---")

# VITALS
st.subheader("Patient Vital Parameters")

c1, c2, c3 = st.columns(3)

with c1:

    heart = st.slider(
        "Heart Rate",
        40,
        180,
        80
    )

with c2:

    spo2 = st.slider(
        "SpO₂",
        60,
        100,
        98
    )

with c3:

    temp = st.slider(
        "Temperature",
        95.0,
        106.0,
        98.6
    )

c4, c5, c6 = st.columns(3)

with c4:

    resp = st.slider(
        "Respiratory Rate",
        10,
        45,
        18
    )

with c5:

    bp_sys = st.slider(
        "BP Systolic",
        80,
        220,
        120
    )

with c6:

    bp_dia = st.slider(
        "BP Diastolic",
        50,
        140,
        80
    )

# BUTTON
if st.button("Analyze Patient"):

    st.session_state.name = name
    st.session_state.age = age
    st.session_state.gender = gender

    st.session_state.patient_id = patient_id
    st.session_state.ward = ward
    st.session_state.room = room

    st.session_state.heart = heart
    st.session_state.spo2 = spo2
    st.session_state.temp = temp

    st.session_state.resp = resp
    st.session_state.bp_sys = bp_sys
    st.session_state.bp_dia = bp_dia

    st.success("Patient Data Submitted Successfully")
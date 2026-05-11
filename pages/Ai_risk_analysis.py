import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import joblib

st.title("AI Risk Prediction Engine")

# LOAD MODEL
model = joblib.load("model.pkl")

# LOAD DOCTOR DATASET
doctor_df = pd.read_csv(
    "vitaguard_doctor_dataset.csv"
)

# CHECK DATA
if "heart" not in st.session_state:

    st.warning(
        "Please enter patient data first."
    )

    st.stop()

# INPUTS
age = st.session_state.age
heart = st.session_state.heart
spo2 = st.session_state.spo2
temp = st.session_state.temp

resp = st.session_state.resp

bp_sys = st.session_state.bp_sys
bp_dia = st.session_state.bp_dia

# CREATE DATAFRAME
input_data = pd.DataFrame([{

    "age": age,

    "heart_rate": heart,

    "spo2": spo2,

    "temperature": temp,

    "respiratory_rate": resp,

    "blood_pressure_systolic": bp_sys,

    "blood_pressure_diastolic": bp_dia

}])

# PREDICTION
prediction = model.predict(
    input_data
)[0]

# CONDITION LOGIC
if prediction == 0:

    condition = "Normal"

    risk = "LOW"

elif prediction == 1:

    condition = "Cardiac Risk"

    risk = "HIGH"

elif prediction == 2:

    condition = "Respiratory Distress"

    risk = "CRITICAL"

elif prediction == 3:

    condition = "Fever / Infection"

    risk = "HIGH"

else:

    condition = "Critical Multi-Organ Risk"

    risk = "EMERGENCY"

# DOCTOR
doctor_row = doctor_df.sample(1).iloc[0]

doctor = doctor_row["doctor_name"]

department = doctor_row["department"]

contact = doctor_row["contact_number"]

email = doctor_row["email"]

# SAVE
st.session_state.condition = condition
st.session_state.risk = risk

st.session_state.doctor = doctor
st.session_state.department = department

st.session_state.contact = contact
st.session_state.email = email

# METRICS
m1, m2, m3 = st.columns(3)

m1.metric(
    "Detected Condition",
    condition
)

m2.metric(
    "Risk Level",
    risk
)

m3.metric(
    "Assigned Doctor",
    doctor
)

st.markdown("---")

# CHARTS
trend = pd.DataFrame({

    "Time": np.arange(20),

    "Heart Rate": np.random.randint(
        70,
        140,
        20
    ),

    "SpO₂": np.random.randint(
        80,
        100,
        20
    )
})

c1, c2 = st.columns(2)

with c1:

    fig1 = px.line(
        trend,
        x="Time",
        y="Heart Rate",
        title="Heart Rate Trend"
    )

    st.plotly_chart(
        fig1,
        use_container_width=True
    )

with c2:

    fig2 = px.line(
        trend,
        x="Time",
        y="SpO₂",
        title="SpO₂ Trend"
    )

    st.plotly_chart(
        fig2,
        use_container_width=True
    )

st.markdown("---")

# RECOMMENDATION
st.subheader(
    "AI Clinical Recommendation"
)

if risk in [
    "CRITICAL",
    "EMERGENCY"
]:

    st.error(
        "Immediate ICU escalation and emergency intervention required."
    )

elif risk == "HIGH":

    st.warning(
        "Continuous monitoring and specialist consultation recommended."
    )

else:

    st.success(
        "Patient vitals currently stable."
    )
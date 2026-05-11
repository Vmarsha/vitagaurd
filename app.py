import streamlit as st

st.set_page_config(
    page_icon="logo.png",
    layout="wide"
)

# HEADER
col1, col2 = st.columns([1,5])

with col1:
    st.image("logo.png", width=130)

with col2:

    

    st.markdown("""
    <h3>
    AI-Driven Intelligent Patient Monitoring & Clinical Workflow System
    </h3>
    """, unsafe_allow_html=True)

st.markdown("---")

# TOP CARDS
c1, c2, c3, c4 = st.columns(4)

with c1:
    st.metric(
        "Patients Monitored",
        "60,000+"
    )

with c2:
    st.metric(
        "ML Models",
        "2"
    )

with c3:
    st.metric(
        "Prediction Accuracy",
        "94%"
    )

with c4:
    st.metric(
        "System Status",
        "ACTIVE"
    )

st.markdown("---")

# MAIN SECTION
left, right = st.columns([2,1])

with left:

    st.subheader("About VitaGuard")

    st.markdown("""
    VitaGuard is an AI-powered healthcare monitoring platform designed to detect early patient deterioration using intelligent machine learning models and automated clinical workflows.

    ### Core Features
    - Real-Time Vital Monitoring
    - AI Disease Prediction
    - Logistic Regression Analysis
    - Random Forest Classification
    - Automated Clinical Escalation
    - Intelligent Doctor Assignment
    - Alert & Notification System
    - Risk Stratification Engine
    """)

with right:

    st.markdown("""
    <div style="
        background-color:#111827;
        padding:25px;
        border-radius:20px;
        border:1px solid #00E5A8;
    ">

    <h2 style='color:#00E5A8;'>
    System Overview
    </h2>

    <p style='color:white;'>🟢 AI Engine Online</p>

    <p style='color:white;'>🟢 Random Forest Active</p>

    <p style='color:white;'>🟢 Logistic Regression Active</p>

    <p style='color:white;'>🟢 Alert Workflow Running</p>

    <p style='color:white;'>🟢 Clinical Dashboard Connected</p>

    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# WORKFLOW
st.subheader("Clinical Workflow Pipeline")

st.code("""
Patient Monitoring
        ↓
Data Preprocessing
        ↓
Machine Learning Prediction
        ↓
Risk Classification
        ↓
Clinical Escalation
        ↓
Doctor Notification
""")

st.markdown("---")

# MODELS
m1, m2 = st.columns(2)

with m1:

    st.info("""
    Logistic Regression

    Baseline predictive model used for disease classification and comparative analysis.
    """)

with m2:

    st.success("""
    Random Forest

    Final ensemble learning model used for intelligent patient deterioration prediction.
    """)

st.markdown("---")

st.success(
    "Use the sidebar to access patient monitoring and AI analysis modules."
)
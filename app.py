import streamlit as st

st.set_page_config(
    page_icon="logo.png",
    layout="wide"
)

# HEADER
col1, col2 = st.columns([1,5])

with col1:
    st.image("logo.png", width=180)

with col2:

    

    st.markdown("""
    <h4 style='margin-top:0;color:white;'>
    AI-Driven Intelligent Patient Deterioration Monitoring System
    </h4>
    """, unsafe_allow_html=True)

st.markdown("---")

# INFO CARDS
c1, c2, c3 = st.columns(3)

with c1:
    st.info("""
    ### AI Monitoring
    Real-time clinical analytics
    """)

with c2:
    st.success("""
    ### Smart Escalation
    Automated alert workflow
    """)

with c3:
    st.warning("""
    ### ML Prediction
    Intelligent risk detection
    """)

st.markdown("---")

left, right = st.columns([2,1])

with left:

    st.markdown("""
    ## Smart Healthcare Monitoring Platform

    VitaGuard combines:
    - AI-based deterioration prediction
    - Real-time patient monitoring
    - Clinical escalation workflows
    - Automated healthcare analytics
    - Intelligent doctor assignment
    """)

with right:

    st.markdown("""
    <div style="
        background-color:#1C1F26;
        padding:20px;
        border-radius:15px;
        border:1px solid #00E5A8;
    ">

    <h3 style='color:#00E5A8;'>
    System Status
    </h3>

    <p>🟢 Monitoring Active</p>
    <p>🟢 ML Engine Online</p>
    <p>🟢 Alert Workflow Ready</p>
    <p>🟢 Database Connected</p>

    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

st.success("Use sidebar navigation to access VitaGuard modules.")
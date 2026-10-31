import streamlit as st
import numpy as np
import pandas as pd
import torch
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from generate_data import generate_sequence, SCENARIOS, GAS_NAMES
from model import DGA1DCNN
from validator import StandardsValidator
from action_engine import ActionEngine

# ---------------------------------------------------------
# Page Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="Substation AI Digital Twin - DGA Fault Diagnostic Engine",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for Substation Digital Twin Theme
st.markdown("""
<style>
    .metric-card {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
        border-left: 5px solid #007bff;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 10px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 48px;
        font-weight: 600;
        border-radius: 4px 4px 0px 0px;
        padding-left: 16px;
        padding-right: 16px;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Model & Helper Instantiation
# ---------------------------------------------------------
@st.cache_resource
def load_diagnostic_model():
    model = DGA1DCNN(num_classes=len(SCENARIOS))
    try:
        checkpoint = torch.load("models/dga_1dcnn.pth", map_location="cpu")
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        else:
            model.load_state_dict(checkpoint)
        model.eval()
    except Exception as e:
        st.warning(f"Model weights could not be loaded ({e}). Please run `python model.py` to train.")
    return model

model = load_diagnostic_model()
validator = StandardsValidator()
action_engine = ActionEngine()

# Color mapping for all 7 gases
GAS_COLORS = {
    'H2': '#1f77b4',     # Royal Blue
    'CH4': '#ff7f0e',    # Orange
    'C2H6': '#2ca02c',   # Green
    'C2H4': '#9467bd',   # Purple
    'C2H2': '#d62728',   # Red (Critical Arcing Indicator)
    'CO': '#17becf',     # Cyan / Teal
    'CO2': '#8c564b',    # Brown
    'TDCG': '#343a40'    # Dark Charcoal
}

# ---------------------------------------------------------
# Sidebar Controls & Scenario Selection
# ---------------------------------------------------------
st.sidebar.image("https://img.icons8.com/fluency/96/electricity.png", width=64)
st.sidebar.title("⚡ Substation Twin")
st.sidebar.markdown("**Asset:** `TX-400kV-BAY-03`  \n**Rating:** 500 MVA ODAF Auto-Transformer  \n**Location:** 400/220 kV Grid Substation")

st.sidebar.divider()
st.sidebar.subheader("🕹️ Simulation Settings")

sim_mode = st.sidebar.radio(
    "Simulation Mode",
    ["Preset Fault Scenarios", "Manual Telemetry Injection"],
    index=0
)

scenario_keys = list(SCENARIOS.keys())
scenario_labels = [f"{SCENARIOS[k]['code']} - {SCENARIOS[k]['name']}" for k in scenario_keys]

# Initialize session state for selected scenario if not present
if "current_scenario" not in st.session_state:
    st.session_state.current_scenario = scenario_keys[0]

if sim_mode == "Preset Fault Scenarios":
    current_idx = scenario_keys.index(st.session_state.current_scenario) if st.session_state.current_scenario in scenario_keys else 0
    selected_label = st.sidebar.selectbox(
        "Select Fault Scenario to Simulate",
        scenario_labels,
        index=current_idx
    )
    # Update active scenario
    selected_key = scenario_keys[scenario_labels.index(selected_label)]
    st.session_state.current_scenario = selected_key
    st.sidebar.info(SCENARIOS[selected_key]["desc"])
else:
    st.sidebar.markdown("##### 🎛️ Inject Custom Gas ppm Values")
    custom_h2 = st.sidebar.slider("H2 (Hydrogen)", 0.0, 500.0, 35.0, 1.0)
    custom_ch4 = st.sidebar.slider("CH4 (Methane)", 0.0, 500.0, 25.0, 1.0)
    custom_c2h6 = st.sidebar.slider("C2H6 (Ethane)", 0.0, 250.0, 15.0, 1.0)
    custom_c2h4 = st.sidebar.slider("C2H4 (Ethylene)", 0.0, 500.0, 30.0, 1.0)
    custom_c2h2 = st.sidebar.slider("C2H2 (Acetylene)", 0.0, 100.0, 0.5, 0.1)
    custom_co = st.sidebar.slider("CO (Carbon Monoxide)", 0.0, 1500.0, 200.0, 10.0)
    custom_co2 = st.sidebar.slider("CO2 (Carbon Dioxide)", 0.0, 6000.0, 1200.0, 50.0)

st.sidebar.divider()
st.sidebar.subheader("📈 Telemetry Chart Options")

# Gas selection checkboxes
visible_gases = st.sidebar.multiselect(
    "Select Gases to Display in Graph",
    GAS_NAMES + ['TDCG'],
    default=GAS_NAMES
)

y_scale = st.sidebar.radio(
    "Y-Axis Scale",
    ["Linear Scale", "Logarithmic Scale (Recommended for Multi-Gas)"],
    index=0
)

show_ieee_thresholds = st.sidebar.checkbox("Overlay IEEE 90th Threshold Lines", value=False)

# ---------------------------------------------------------
# Generate Telemetry Data
# ---------------------------------------------------------
if sim_mode == "Preset Fault Scenarios":
    seq = generate_sequence(scenario_type=st.session_state.current_scenario, steps=24)
else:
    # Build 24-step sequence drifting up to the user-injected values
    base_gases = np.array([custom_h2*0.2, custom_ch4*0.2, custom_c2h6*0.2, custom_c2h4*0.2, custom_c2h2*0.1, custom_co*0.4, custom_co2*0.6])
    target = np.array([custom_h2, custom_ch4, custom_c2h6, custom_c2h4, custom_c2h2, custom_co, custom_co2])
    seq = []
    for step in range(24):
        alpha = step / 23.0
        current = base_gases * (1 - alpha) + target * alpha
        noise = np.random.normal(0, 0.015, size=7)
        seq.append(np.maximum(0.01, current * (1 + noise)))
    seq = np.array(seq, dtype=np.float32)

latest = seq[-1]
gas_dict = {
    'H2': float(latest[0]),
    'CH4': float(latest[1]),
    'C2H6': float(latest[2]),
    'C2H4': float(latest[3]),
    'C2H2': float(latest[4]),
    'CO': float(latest[5]),
    'CO2': float(latest[6])
}

# ---------------------------------------------------------
# Run Analytics: Standards & AI Model Inference
# ---------------------------------------------------------
# 1. 1D-CNN Inference
seq_tensor = torch.tensor(seq, dtype=torch.float32).unsqueeze(0)
with torch.no_grad():
    model_out = model(seq_tensor)
    probs = torch.softmax(model_out, dim=1).numpy()[0]
    pred_idx = int(np.argmax(probs))
    ai_confidence = float(probs[pred_idx] * 100.0)

scenario_order = list(SCENARIOS.keys())
pred_scenario_key = scenario_order[pred_idx] if pred_idx < len(scenario_order) else "normal"
ai_diagnosis = SCENARIOS[pred_scenario_key]["name"]

# 2. Standards & Duval Triangle Validation
ieee_status, breached_gases = validator.check_ieee_limits(gas_dict)
tdcg_val, tdcg_status = validator.calculate_tdcg(gas_dict)
pct_ch4, pct_c2h4, pct_c2h2, duval_zone = validator.calculate_duval_coordinates(latest[1], latest[3], latest[4])
co_ratio, cellulose_status, paper_risk = validator.check_cellulose_degradation(latest[5], latest[6])

# 3. Action Recommendations
recommendation_key = duval_zone if duval_zone != "Normal" else ("Cellulose / Paper Degradation" if "CRITICAL" in cellulose_status else ("Sensor Drift / Transducer Anomaly" if pred_scenario_key == "sensor_drift" else "Normal"))
rec = action_engine.get_recommendations(recommendation_key)

# ---------------------------------------------------------
# Top Header Banner
# ---------------------------------------------------------
st.title("⚡ Substation Digital Twin: Multi-Gas DGA Fault Diagnostic Engine")
st.caption("AI-Powered Incipient Fault Detection (1D-CNN) & IEEE C57.104 / IEC 60599 / Duval Triangle Expert Analysis")

# ---------------------------------------------------------
# Dashboard Navigation Tabs
# ---------------------------------------------------------
tab_live, tab_duval, tab_matrix = st.tabs([
    "📊 Real-Time Diagnostic Dashboard (All 7 Gases)",
    "🔺 Interactive Duval's Triangle 1 Visualizer",
    "📋 All Possibilities Demo Matrix & 1-Click Tour"
])

# =========================================================
# TAB 1: Real-Time Diagnostic Dashboard
# =========================================================
with tab_live:
    # Key Metric Cards
    m1, m2, m3, m4, m5 = st.columns(5)
    
    is_fault = (duval_zone != "Normal") or ("CRITICAL" in ieee_status) or ("CRITICAL" in cellulose_status) or (pred_scenario_key == "sensor_drift")
    
    with m1:
        if is_fault:
            st.metric("Asset Status", "CRITICAL ALARM", delta="-42% Health Index", delta_color="inverse")
        else:
            st.metric("Asset Status", "HEALTHY", delta="Nominal Envelope")
            
    with m2:
        status_short = "NORMAL" if "NORMAL" in ieee_status else ("CRITICAL" if "CRITICAL" in ieee_status else "CAUTION")
        st.metric("IEEE C57.104", status_short, delta=f"{len(breached_gases)} Breaches" if breached_gases else "Within Limits", delta_color="inverse" if breached_gases else "normal")
        
    with m3:
        st.metric("TDCG Level", f"{tdcg_val:.1f} ppm", delta=tdcg_status.split('(')[0].strip(), delta_color="inverse" if tdcg_val > 720 else "normal")
        
    with m4:
        st.metric("Duval Triangle 1", duval_zone.split(':')[0] if ':' in duval_zone else duval_zone)
        
    with m5:
        st.metric("CO₂/CO Paper Ratio", f"{co_ratio:.2f}", delta=f"Risk: {paper_risk}", delta_color="inverse" if paper_risk == "High" else "normal")
        
    st.divider()

    # Main Visuals: Telemetry Graph & AI Diagnostics
    left_plot, right_diag = st.columns([7, 5])
    
    with left_plot:
        st.subheader("📈 Multi-Gas Telemetry Trend (Past 24 Hours)")
        hours = [f"t-{24-i}h" for i in range(24)]
        
        fig = go.Figure()
        
        # Calculate TDCG across the sequence
        tdcg_seq = seq[:, 0] + seq[:, 1] + seq[:, 2] + seq[:, 3] + seq[:, 4] + seq[:, 5]
        
        # Plot each selected gas
        for g_idx, g_name in enumerate(GAS_NAMES):
            if g_name in visible_gases:
                is_c2h2 = (g_name == "C2H2")
                fig.add_trace(go.Scatter(
                    x=hours,
                    y=seq[:, g_idx],
                    mode='lines+markers' if is_c2h2 else 'lines',
                    name=f"{g_name} (ppm)",
                    line=dict(
                        color=GAS_COLORS[g_name],
                        width=3.5 if is_c2h2 else 2.2,
                        dash='dash' if is_c2h2 else 'solid'
                    ),
                    marker=dict(size=6) if is_c2h2 else None,
                    hovertemplate=f"<b>{g_name}</b>: %{{y:.2f}} ppm<extra></extra>"
                ))
                
        # Optional TDCG trace
        if 'TDCG' in visible_gases:
            fig.add_trace(go.Scatter(
                x=hours,
                y=tdcg_seq,
                mode='lines',
                name="TDCG (Total Combustible)",
                line=dict(color=GAS_COLORS['TDCG'], width=2.5, dash='dot'),
                hovertemplate="<b>TDCG</b>: %{y:.1f} ppm<extra></extra>"
            ))
            
        # Optional IEEE Threshold reference lines
        if show_ieee_thresholds:
            for g_name in visible_gases:
                if g_name in validator.ieee_90th_limits:
                    limit_val = validator.ieee_90th_limits[g_name]
                    fig.add_hline(
                        y=limit_val,
                        line_dash="dot",
                        line_color=GAS_COLORS.get(g_name, "gray"),
                        annotation_text=f"IEEE {g_name} limit ({limit_val})",
                        annotation_position="bottom right"
                    )
                    
        is_log = "Logarithmic" in y_scale
        fig.update_layout(
            height=430,
            margin=dict(l=20, r=20, t=30, b=20),
            yaxis_type="log" if is_log else "linear",
            yaxis_title="Gas Concentration (ppm - log scale)" if is_log else "Gas Concentration (ppm)",
            xaxis_title="Timeline (24-Hour Rolling Buffer)",
            hovermode="x unified",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Telemetry Data Table Summary
        with st.expander("🔍 View Raw Telemetry Readings & IEEE Limits Table"):
            df_table = []
            for g_name in GAS_NAMES:
                val = gas_dict[g_name]
                lim = validator.ieee_90th_limits.get(g_name, 0.0)
                status_txt = "⚠️ BREACH" if val > lim else "✅ NORMAL"
                df_table.append({
                    "Gas": g_name,
                    "Current Concentration (ppm)": round(val, 2),
                    "IEEE C57.104 90th Limit (ppm)": lim,
                    "Ratio to Limit": f"{(val/lim)*100:.1f}%",
                    "Status": status_txt
                })
            st.dataframe(pd.DataFrame(df_table), use_container_width=True, hide_index=True)

    with right_diag:
        st.subheader("🧠 AI & Expert Diagnostics")
        
        # AI Card
        st.markdown(f"""
        <div style="background-color: #f1f3f5; padding: 14px; border-radius: 8px; border-left: 6px solid #007bff; margin-bottom: 12px;">
            <div style="font-size: 0.85rem; color: #6c757d; font-weight: bold;">1D-CNN TEMPORAL PATTERN RECOGNITION</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: #212529;">{ai_diagnosis}</div>
            <div style="font-size: 0.95rem; color: #28a745; font-weight: bold;">Inference Confidence: {ai_confidence:.1f}%</div>
        </div>
        """, unsafe_allow_html=True)
        
        # Probability Bar Chart
        with st.expander("📊 AI Confidence Distribution (All 9 Classes)"):
            prob_df = pd.DataFrame({
                "Scenario": [SCENARIOS[k]["code"] for k in scenario_order],
                "Confidence": probs * 100
            })
            bar_fig = go.Figure(go.Bar(
                x=prob_df["Confidence"],
                y=prob_df["Scenario"],
                orientation='h',
                marker_color=['#007bff' if i == pred_idx else '#adb5bd' for i in range(len(scenario_order))]
            ))
            bar_fig.update_layout(
                height=260,
                margin=dict(l=10, r=10, t=10, b=10),
                xaxis_title="Confidence (%)",
                yaxis_autorange="reversed"
            )
            st.plotly_chart(bar_fig, use_container_width=True)

        # Action Engine Recommendations
        st.markdown(f"##### 🛡️ Substation Mitigation Protocol")
        st.markdown(f"**Severity Level:** `{rec['severity']}`")
        for i, act in enumerate(rec['actions'], 1):
            st.markdown(f"**{i}.** {act}")
            
        # Paper Insulation Diagnosis
        if "CRITICAL" in cellulose_status or "ELEVATED" in cellulose_status:
            st.warning(f"**Paper Insulation Alert:** {cellulose_status}")
        else:
            st.success(f"**Solid Insulation Health:** {cellulose_status}")

# =========================================================
# TAB 2: Interactive Duval Triangle 1 Visualizer
# =========================================================
with tab_duval:
    st.subheader("🔺 Duval Triangle 1 Coordinate Mapping (IEC 60599 / IEEE C57.104)")
    st.markdown("""
    Duval's Triangle 1 is an internationally recognized graphical method that correlates the relative percentages of 
    three critical hydrocarbon gases generated during mineral oil breakdown:
    $$\\%CH_4 + \\%C_2H_4 + \\%C_2H_2 = 100\\%$$
    """)
    
    col_tri, col_info = st.columns([7, 5])
    
    with col_tri:
        # Build Plotly Ternary Diagram
        fig_tri = go.Figure()
        
        # Centroid approximate zone annotations
        zone_centroids = [
            {"name": "PD (Partial Discharge)", "a": 97, "b": 1.5, "c": 1.5, "color": "#17a2b8"},
            {"name": "T1 (<300°C)", "a": 80, "b": 18, "c": 2, "color": "#20c997"},
            {"name": "T2 (300°-700°C)", "a": 60, "b": 38, "c": 2, "color": "#fd7e14"},
            {"name": "T3 (>700°C)", "a": 25, "b": 70, "c": 5, "color": "#e83e8c"},
            {"name": "D1 (Sparking)", "a": 70, "b": 12, "c": 18, "color": "#6f42c1"},
            {"name": "D2 (Arcing)", "a": 25, "b": 35, "c": 40, "color": "#dc3545"}
        ]
        
        for z in zone_centroids:
            fig_tri.add_trace(go.Scatterternary(
                a=[z["a"]],
                b=[z["b"]],
                c=[z["c"]],
                mode='markers+text',
                text=[z["name"].split(' ')[0]],
                textposition='bottom center',
                name=z["name"],
                marker=dict(symbol='circle', size=14, color=z["color"], opacity=0.7)
            ))
            
        # Add the active sample point
        fig_tri.add_trace(go.Scatterternary(
            a=[pct_ch4],
            b=[pct_c2h4],
            c=[pct_c2h2],
            mode='markers+text',
            text=["📍 OPERATING POINT"],
            textposition='top center',
            textfont=dict(size=14, color='black', family='Arial Black'),
            name="Current Oil Telemetry",
            marker=dict(
                symbol='star',
                size=22,
                color='#ff0000',
                line=dict(width=2, color='black')
            )
        ))
        
        fig_tri.update_layout(
            ternary=dict(
                sum=100,
                aaxis=dict(title='%CH4 (Methane)', min=0.01, linewidth=2, ticks='outside'),
                baxis=dict(title='%C2H4 (Ethylene)', min=0.01, linewidth=2, ticks='outside'),
                caxis=dict(title='%C2H2 (Acetylene)', min=0.01, linewidth=2, ticks='outside')
            ),
            height=500,
            margin=dict(l=30, r=30, t=30, b=30),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5)
        )
        st.plotly_chart(fig_tri, use_container_width=True)
        
    with col_info:
        st.markdown("#### Current Coordinate Analysis")
        st.markdown(f"- **%CH₄:** `{pct_ch4:.2f}%`")
        st.markdown(f"- **%C₂H₄:** `{pct_c2h4:.2f}%`")
        st.markdown(f"- **%C₂H₂:** `{pct_c2h2:.2f}%`")
        st.markdown(f"- **Evaluated Duval Zone:** `{duval_zone}`")
        
        st.divider()
        st.markdown("#### Duval Zone Boundary Reference")
        st.markdown("""
        | Zone | Meaning | Primary Gas Mechanism |
        |---|---|---|
        | **PD** | Partial Discharge | Corona ionization in oil bubbles (%CH4 ≥ 98%) |
        | **D1** | Low-Energy Discharge | Sparking, carbonized tracking (%C2H2 ≥ 13%, %C2H4 < 23%) |
        | **D2** | High-Energy Discharge | Power arcing flashover (%C2H2 ≥ 29%) |
        | **T1** | Thermal Fault < 300°C | Core hotspot, loose bolts (%C2H4 < 20%, %C2H2 < 4%) |
        | **T2** | Thermal Fault 300°-700°C | Overheated conductors (20% ≤ %C2H4 < 50%) |
        | **T3** | Thermal Fault > 700°C | Severe oil carbonization (%C2H4 ≥ 50%) |
        """)

# =========================================================
# TAB 3: All Possibilities Demo Matrix & 1-Click Tour
# =========================================================
with tab_matrix:
    st.subheader("📋 Comprehensive Substation Fault Possibilities Matrix")
    st.markdown("""
    This interactive demonstration matrix displays **every possible fault condition** that can occur in gas-monitored substation assets.
    Click **'Load Scenario'** on any row to immediately simulate that telemetry condition, observe the AI diagnosis, and verify standards compliance.
    """)
    
    matrix_data = [
        {
            "key": "normal",
            "name": "Normal Operation (Healthy)",
            "signature": "Low baseline (all < IEEE 90th limits)",
            "duval": "Normal",
            "ieee": "Condition 1 (Normal)",
            "ai": "Normal Operation",
            "action": "Routine 24h continuous telemetry"
        },
        {
            "key": "pd",
            "name": "Partial Discharge (PD)",
            "signature": "H2 spike (150-320 ppm), low CH4, C2H2 ≈ 0",
            "duval": "PD: Partial Discharge",
            "ieee": "Condition 2 (Caution - H2)",
            "ai": "Partial Discharge (PD)",
            "action": "UHF / Acoustic PD scanning, verify bushings"
        },
        {
            "key": "d1",
            "name": "Low-Energy Sparking (D1)",
            "signature": "C2H2 emergence (6-15 ppm), H2 rise, C2H4 low",
            "duval": "D1: Low-Energy Discharge",
            "ieee": "Condition 3 (Critical - C2H2)",
            "ai": "Low-Energy Discharge / Sparking",
            "action": "15-min scan cycle, OLTC inspection"
        },
        {
            "key": "d2",
            "name": "High-Energy Arcing (D2)",
            "signature": "Violent C2H2 surge (>30 ppm), H2, C2H4",
            "duval": "D2: High-Energy Discharge",
            "ieee": "Condition 3 (Critical - C2H2/H2)",
            "ai": "High-Energy Arcing (D2)",
            "action": "Immediate load curtailment, trip interlock"
        },
        {
            "key": "t1",
            "name": "Thermal Fault <300°C (T1)",
            "signature": "CH4 and C2H6 surge, C2H4 < 20%",
            "duval": "T1: Thermal Fault (<300°C)",
            "ieee": "Condition 2 (Caution - CH4/C2H6)",
            "ai": "Thermal Fault <300°C (T1)",
            "action": "Inspect core ground straps and connections"
        },
        {
            "key": "t2",
            "name": "Thermal Fault 300°-700°C (T2)",
            "signature": "C2H4 (60-150 ppm) & C2H6 elevated",
            "duval": "T2: Thermal Fault (300°-700°C)",
            "ieee": "Condition 2/3 (Caution/Critical - C2H4)",
            "ai": "Thermal Fault 300°C-700°C (T2)",
            "action": "Inspect radiator fans/pumps, check winding temp"
        },
        {
            "key": "t3",
            "name": "Thermal Fault >700°C (T3)",
            "signature": "Dominant C2H4 (>200 ppm, >50% Duval)",
            "duval": "T3: Thermal Fault (>700°C)",
            "ieee": "Condition 3 (Critical - C2H4)",
            "ai": "Thermal Fault >700°C (T3)",
            "action": "FLIR thermography, avoid peak overloading"
        },
        {
            "key": "cellulose",
            "name": "Cellulose / Paper Degradation",
            "signature": "Excessive CO (600-1400 ppm), CO2/CO < 3.0",
            "duval": "T1/T2 or Normal",
            "ieee": "Condition 3 (Critical - CO)",
            "ai": "Cellulose / Paper Degradation",
            "action": "Furan (2-FAL) HPLC testing, DP assessment"
        },
        {
            "key": "sensor_drift",
            "name": "Sensor Drift / Transducer Fault",
            "signature": "Isolated erratic H2 jump, 0 hydrocarbon rise",
            "duval": "Normal",
            "ieee": "Condition 2 (Caution - H2)",
            "ai": "Sensor Drift / Transducer Anomaly",
            "action": "Calibrate PAS optical cell, verify zero-span"
        }
    ]
    
    for row in matrix_data:
        c_name, c_sig, c_duval, c_ieee, c_btn = st.columns([3, 3, 2, 2, 2])
        with c_name:
            st.markdown(f"**{row['name']}**")
        with c_sig:
            st.caption(row["signature"])
        with c_duval:
            st.markdown(f"`{row['duval'].split(':')[0]}`")
        with c_ieee:
            st.markdown(f"`{row['ieee'].split(' ')[0]}`")
        with c_btn:
            if st.button(f"Load Scenario", key=f"btn_load_{row['key']}"):
                st.session_state.current_scenario = row["key"]
                st.rerun()
        st.markdown("<hr style='margin: 4px 0px; border-color: #e9ecef;'>", unsafe_allow_html=True)

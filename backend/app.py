import os
import time
import torch
import numpy as np
from typing import List, Dict, Any, Tuple
import gradio as gr

# Ensure backend directory and project root are accessible
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
import sys
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

try:
    from backend.model import DGA1DCNN
except ImportError:
    from model import DGA1DCNN

GAS_NAMES = ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2', 'CO', 'CO2']

SCENARIOS = {
    "normal": {
        "id": 0,
        "name": "Normal Operation (Healthy Baseline)",
        "code": "NORM",
        "desc": "Baseline aging within normal operational limits. No active electrical or thermal discharge."
    },
    "pd": {
        "id": 1,
        "name": "Partial Discharge (PD)",
        "code": "PD",
        "desc": "Low-energy corona discharges in gas voids or paper cavities; dominated by Hydrogen (H2)."
    },
    "d1": {
        "id": 2,
        "name": "Low-Energy Discharge / Sparking (D1)",
        "code": "D1",
        "desc": "Dielectric breakdown, tracking, or pinhole sparking between floating metal parts; emergence of Acetylene (C2H2)."
    },
    "d2": {
        "id": 3,
        "name": "High-Energy Arcing (D2)",
        "code": "D2",
        "desc": "Severe power arc flashover, turn-to-turn short-circuit; violent surge of Acetylene (C2H2) and Hydrogen (H2)."
    },
    "t1": {
        "id": 4,
        "name": "Thermal Fault <300°C (T1)",
        "code": "T1",
        "desc": "Low-temperature localized overheating in core bolts or loose connections; dominated by Methane (CH4) and Ethane (C2H6)."
    },
    "t2": {
        "id": 5,
        "name": "Thermal Fault 300°C-700°C (T2)",
        "code": "T2",
        "desc": "Medium-temperature thermal fault on winding conductors; prominent Ethylene (C2H4) and Ethane (C2H6)."
    },
    "t3": {
        "id": 6,
        "name": "Thermal Fault >700°C (T3)",
        "code": "T3",
        "desc": "High-temperature overheating of core iron laminations and oil carbonization; heavy Ethylene (C2H4 > 50%)."
    },
    "cellulose": {
        "id": 7,
        "name": "Cellulose / Paper Degradation",
        "code": "CELL",
        "desc": "Pyrolysis of solid kraft paper insulation; heavy Carbon Monoxide (CO) surge with abnormal CO2/CO ratio (< 3.0)."
    },
    "sensor_drift": {
        "id": 8,
        "name": "Sensor Drift / Transducer Anomaly",
        "code": "SENS",
        "desc": "Isolated single-channel transducer drift without multi-gas thermodynamic correlation; instrument fault."
    }
}

# ---------------------------------------------------------------------------
# Model Initialization & Weights Loading
# ---------------------------------------------------------------------------
device = torch.device("cpu")
model = None

CLASS_ORDER = [
    "normal",
    "pd",
    "d1",
    "d2",
    "t1",
    "t2",
    "t3",
    "cellulose",
    "sensor_drift"
]

CLASS_COLORS = {
    "NORM": "#10b981",
    "PD": "#eab308",
    "D1": "#f97316",
    "D2": "#e11d48",
    "T1": "#06b6d4",
    "T2": "#fb923c",
    "T3": "#f43f5e",
    "CELL": "#ec4899",
    "SENS": "#64748b",
}

# Locate model weights checkpoint
MODEL_CANDIDATES = [
    os.path.join(ROOT_DIR, "models", "dga_1dcnn.pth"),
    os.path.join(CURRENT_DIR, "models", "dga_1dcnn.pth"),
    os.path.join("models", "dga_1dcnn.pth"),
    os.path.join("..", "models", "dga_1dcnn.pth"),
    "dga_1dcnn.pth",
    os.environ.get("MODEL_PATH", "")
]

model_path = None
for candidate in MODEL_CANDIDATES:
    if candidate and os.path.exists(candidate):
        model_path = candidate
        break

try:
    model = DGA1DCNN(num_gases=7, window_size=24, num_classes=len(SCENARIOS))
    if model_path:
        checkpoint = torch.load(model_path, map_location=device)
        if "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        else:
            model.load_state_dict(checkpoint)
        print(f"[INFO] Successfully loaded PyTorch 1D-CNN weights from: {model_path}")
    else:
        print("[WARN] dga_1dcnn.pth not found. Model initialized with random weights.")
    model.to(device)
    model.eval()
except Exception as exc:
    print(f"[ERROR] Error initializing 1D-CNN model: {exc}")
    model = None


# ---------------------------------------------------------------------------
# Core Inference Function
# ---------------------------------------------------------------------------
def predict_dga_fault(
    h2: float = 15.0,
    ch4: float = 12.0,
    c2h6: float = 8.0,
    c2h4: float = 10.0,
    c2h2: float = 0.1,
    co: float = 150.0,
    co2: float = 850.0
) -> Tuple[Dict[str, float], Dict[str, Any]]:
    """
    Accepts 7 diagnostic gas readings in parts per million (ppm):
    [H2, CH4, C2H6, C2H4, C2H2, CO, CO2]
    
    Returns:
    1. label_output: Dict mapping class names to softmax probabilities (for gr.Label)
    2. json_output: Detailed telemetry breakdown & execution metadata (for gr.JSON / API)
    """
    t0 = time.perf_counter()

    # Form a 24-hour sequence by tile/broadcasting the 7 gases across the time window
    raw_reading = [float(h2), float(ch4), float(c2h6), float(c2h4), float(c2h2), float(co), float(co2)]
    sequence_data = [raw_reading] * 24

    input_tensor = torch.tensor([sequence_data], dtype=torch.float32).to(device)

    if model is not None:
        with torch.no_grad():
            logits = model(input_tensor)
            probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().numpy()
    else:
        # Fallback uniform probability distribution if model failed to load
        probs = np.ones(9) / 9.0

    top_idx = int(np.argmax(probs))
    top_scenario_key = CLASS_ORDER[top_idx]
    top_scenario = SCENARIOS[top_scenario_key]
    top_prob = float(probs[top_idx] * 100.0)

    # 1. Output for gr.Label (dictionary of class name -> probability float)
    label_output = {}
    probabilities_list = []

    for i, key in enumerate(CLASS_ORDER):
        sc = SCENARIOS[key]
        p = float(probs[i])
        p_pct = float(p * 100.0)
        label_output[f"{sc['code']} - {sc['name']}"] = p
        probabilities_list.append({
            "id": i,
            "code": sc["code"],
            "name": sc["name"],
            "probability": round(p_pct, 2),
            "isTop": (i == top_idx),
            "color": CLASS_COLORS.get(sc["code"], "#06b6d4")
        })

    t1 = time.perf_counter()
    exec_ms = round((t1 - t0) * 1000, 2)

    # 2. Output for gr.JSON & REST API consumers
    json_output = {
        "predictedClassId": top_idx,
        "classCode": top_scenario["code"],
        "className": top_scenario["name"],
        "confidence": round(top_prob, 1),
        "probabilities": probabilities_list,
        "executionTimeMs": exec_ms,
        "source": "Hugging Face Spaces (Gradio PyTorch 1D-CNN)",
        "predicted_class_id": top_idx,
        "class_code": top_scenario["code"],
        "class_name": top_scenario["name"]
    }

    return label_output, json_output


# ---------------------------------------------------------------------------
# Gradio Interface Definition
# ---------------------------------------------------------------------------
title = "⚡ Substation Power Transformer DGA Fault Diagnostic Engine"
description = """
**A High-Precision 1D-CNN Deep Learning Fault Classifier for High-Voltage Transformers.**
Enter dissolved gas concentrations (ppm) or use the presets below.
The model analyzes the 7-gas signature to diagnose incipient thermal and electrical faults in real time.
"""

article = """
### Diagnostic Gas Legend:
- **H₂ (Hydrogen):** Corona partial discharge, electrolysis, sparking (< 100 ppm nominal)
- **CH₄ (Methane):** Low-to-medium thermal oil cracking (< 120 ppm nominal)
- **C₂H₆ (Ethane):** Low-temperature oil degradation (< 65 ppm nominal)
- **C₂H₄ (Ethylene):** High-temperature thermal overheating > 300°C (< 50 ppm nominal)
- **C₂H₂ (Acetylene):** High-energy electrical arcing & flashover (**< 1 ppm nominal**)
- **CO (Carbon Monoxide):** Solid Kraft paper insulation pyrolysis (< 350 ppm nominal)
- **CO₂ (Carbon Dioxide):** Paper aging & atmospheric oxidation (< 2500 ppm nominal)
"""

# Benchmark example test cases across the 9 canonical operational states
examples = [
    [15.0, 12.0, 8.0, 10.0, 0.1, 150.0, 850.0],     # NORM - Normal Operation
    [350.0, 65.0, 15.0, 1.0, 0.05, 180.0, 920.0],   # PD - Partial Discharge
    [120.0, 35.0, 12.0, 14.0, 12.5, 200.0, 980.0],  # D1 - Low-Energy Sparking
    [480.0, 85.0, 25.0, 95.0, 48.0, 380.0, 1150.0], # D2 - High-Energy Arcing
    [45.0, 240.0, 95.0, 18.0, 0.2, 210.0, 1020.0],  # T1 - Thermal < 300°C
    [65.0, 180.0, 45.0, 140.0, 1.5, 260.0, 1100.0], # T2 - Thermal 300-700°C
    [90.0, 120.0, 30.0, 280.0, 3.8, 310.0, 1280.0], # T3 - Thermal > 700°C
    [80.0, 45.0, 18.0, 22.0, 0.3, 750.0, 1400.0],   # CELL - Paper Degradation
    [450.0, 12.0, 8.0, 10.0, 0.1, 150.0, 850.0],    # SENS - Sensor Glitch
]

demo = gr.Interface(
    fn=predict_dga_fault,
    inputs=[
        gr.Number(label="Hydrogen (H₂) ppm", value=15.0),
        gr.Number(label="Methane (CH₄) ppm", value=12.0),
        gr.Number(label="Ethane (C₂H₆) ppm", value=8.0),
        gr.Number(label="Ethylene (C₂H₄) ppm", value=10.0),
        gr.Number(label="Acetylene (C₂H₂) ppm", value=0.1),
        gr.Number(label="Carbon Monoxide (CO) ppm", value=150.0),
        gr.Number(label="Carbon Dioxide (CO₂) ppm", value=850.0),
    ],
    outputs=[
        gr.Label(label="Top Predicted Fault Scenario & Confidence", num_top_classes=5),
        gr.JSON(label="Detailed 9-Class Softmax Probability Distribution & Telemetry"),
    ],
    title=title,
    description=description,
    article=article,
    examples=examples,
    api_name="predict"
)

# ---------------------------------------------------------------------------
# Direct REST Route Support on Gradio's underlying FastAPI App
# ---------------------------------------------------------------------------
# Enables standard JSON POST requests from the Vercel React frontend
async def rest_predict(payload: Dict[str, Any]):
    # Extract gases from { "gases": [h2, ...], "sequence": [...] } or raw list
    data = payload.get("data") or payload.get("gases") or payload.get("sequence") or payload
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
        # 2D list: take latest timestep
        reading = data[-1]
    elif isinstance(data, list) and len(data) >= 7:
        reading = data[:7]
    elif isinstance(data, dict):
        reading = [data.get(g, 0.0) for g in GAS_NAMES]
    else:
        reading = [15.0, 12.0, 8.0, 10.0, 0.1, 150.0, 850.0]

    h2, ch4, c2h6, c2h4, c2h2, co, co2 = [float(x) for x in reading[:7]]
    _, json_result = predict_dga_fault(h2, ch4, c2h6, c2h4, c2h2, co, co2)
    return json_result

from fastapi.middleware.cors import CORSMiddleware

demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

demo.app.add_api_route("/predict", rest_predict, methods=["POST"])
demo.app.add_api_route("/health", lambda: {"status": "online", "model": "DGA1DCNN"}, methods=["GET"])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))  # Standard port for Hugging Face Spaces
    demo.launch(server_name="0.0.0.0", server_port=port, share=False)

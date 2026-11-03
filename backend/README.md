# 🧠 Substation Digital Twin — AI & Diagnostics Backend

This folder contains the Python Machine Learning pipeline, physical telemetry generator, IEEE/IEC standards validation rules, and the interactive Gradio diagnostic server.

---

## 📂 Architecture & Module Overview

```text
backend/
├── app.py                      # Interactive Gradio GUI & FastAPI inference endpoint
├── demo_all_possibilities.py   # Comprehensive 9-scenario verification test runner
├── model.py                    # PyTorch 1D-CNN neural network topology & training loop
├── generate_data.py            # Physics-informed 24h 7-gas synthetic telemetry generator
├── validator.py                # IEEE C57.104-2019 & Duval Triangle 1 standards engine
├── action_engine.py            # Automated mitigation action & dispatch protocol engine
├── export_onnx.py              # Model weights export utility (ONNX / Web JSON)
├── requirements.txt            # Python dependencies (PyTorch, Gradio, NumPy, Pandas)
├── api/
│   └── diagnose.py             # Standalone lightweight HTTP diagnostic handler
└── __init__.py                 # Backend package exports
```

---

## 🚀 Execution Guide

### 1. Install Dependencies
```bash
# From repository root:
pip install -r requirements.txt

# Or directly in the backend folder:
pip install -r backend/requirements.txt
```

### 2. Run Comprehensive 9-Scenario Verification Demo
Verifies 1D-CNN predictions and regulatory standards evaluation against all 9 operational states:
```bash
python backend/demo_all_possibilities.py
```

### 3. Launch the Interactive Gradio Diagnostic Dashboard
Starts the local web GUI and REST inference API:
```bash
python backend/app.py
```

### 4. Retrain the PyTorch 1D-CNN Model (Optional)
Generates synthetic kinetic time-series data and trains the 3-layer 1D-CNN model (saving weights to `models/dga_1dcnn.pth`):
```bash
python backend/model.py
```

### 5. Export Model to ONNX
```bash
python backend/export_onnx.py
```

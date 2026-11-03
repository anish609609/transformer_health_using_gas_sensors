# ⚡ Industrial Substation AI Digital Twin: Multi-Gas DGA Fault Diagnostic Engine

> **An Investor-Ready Hybrid 1D-CNN Deep Learning & IEEE C57.104 / IEC 60599 / Duval Triangle 1 Expert Diagnostic Platform for High-Voltage Substation Power Transformers.**

[![Deployment: Vercel Ready](https://img.shields.io/badge/Deploy-Vercel_Ready-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Frontend: React 18 + TypeScript](https://img.shields.io/badge/Frontend-React_18_%2B_TypeScript-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![AI Engine: PyTorch 1D-CNN + ONNX](https://img.shields.io/badge/AI_Engine-PyTorch_1D--CNN_%2B_ONNX-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org)
[![Standards: IEEE C57.104 | IEC 60599](https://img.shields.io/badge/Compliance-IEEE_C57.104_%7C_IEC_60599-00629B?style=for-the-badge)](#)

---

## 📌 Executive Summary & Value Proposition

Power transformers and gas-insulated switchgear (GIS) are the most critical, long-lead-time, and capital-intensive assets in high-voltage transmission and distribution substations. A single catastrophic transformer failure—such as high-energy winding arcing, tap-changer flashover, or dielectric thermal breakdown—causes **\$2M–\$8M in direct asset replacement costs**, 12–18 months of procurement downtime, severe environmental oil spills, and cascading grid blackouts.

**Dissolved Gas Analysis (DGA)** is universally recognized as the gold-standard non-destructive diagnostic method for detecting incipient internal transformer faults. When insulating mineral oil and cellulose Kraft paper degrade under localized thermal or electrical stress, specific diagnostic gases evolve and dissolve into the oil.

This platform delivers a **Real-Time Industrial Substation AI Digital Twin** combining a modern **React + TypeScript Interactive Simulation Frontend** with a **Hybrid AI + Regulatory Diagnostic Core**:
1. **1D Convolutional Neural Network (1D-CNN):** Multi-variate temporal pattern recognition across a 24-hour rolling telemetry window ($7 \text{ channels} \times 24 \text{ hours}$), capturing both gas ratios and generation rates ($d[\text{Gas}]/dt$).
2. **Deterministic Regulatory Standards Validation:** Automated compliance checking against **IEEE C57.104-2019** (Table 1 90th percentile limits), **IEC 60599** condition thresholds, and **Total Dissolved Combustible Gas (TDCG)** scoring.
3. **Interactive Duval Triangle 1 Coordinate Geometry:** Live ternary coordinate projection ($\%CH_4, \%C_2H_4, \%C_2H_2$) with 24-hour fault trajectory tracking.
4. **Solid Cellulose Paper Pyrolysis Index:** Continuous tracking of the $CO_2/CO$ carbon oxide ratio to prevent irreversible winding insulation embrittlement.
5. **Automated Substation Action & Dispatch Engine:** Translates diagnostic confidence directly into **IEC 61850** SCADA interlocks, load curtailment commands, and field maintenance work-orders.

---

## 🏗️ Full-Stack System Architecture & Workflow

```mermaid
flowchart TD
    subgraph SS_Sensors["1. Substation Physical Sensor Layer"]
        S1["Online Multi-Gas DGA Monitor (Vaisala OPT100 / Kelman DGA 900)"]
        S2["Photoacoustic / Optical Spectrometry Cells"]
        S3["Top-Oil & Winding Temp Indicators (OTI / WTI)"]
    end

    subgraph Preproc["2. Telemetry Preprocessing (24-Hour Rolling Buffer)"]
        P1["7-Gas Time Series Tensor: X in R^(7 x 24)"]
        P2["First-Order Derivative Rate of Change (ppm/24h)"]
        P3["Channel-Wise Z-Score / Log1p Normalization"]
    end

    subgraph Hybrid_AI["3. Hybrid Diagnostic Core (PyTorch / ONNX / TS Engine)"]
        subgraph AI_Branch["Deep Learning 1D-CNN Branch"]
            CNN["3-Layer 1D-CNN Temporal Feature Extractor"]
            CNN_OUT["Softmax Confidence Distribution (9 Fault Classes)"]
        end
        subgraph Standards_Branch["Deterministic Regulatory Engine"]
            IEEE["IEEE C57.104-2019 Table 1 & TDCG Status"]
            DUVAL["Duval Triangle 1 Polygon Geometry"]
            CELL["Cellulose CO2/CO Paper Health Index"]
        end
    end

    subgraph Fusion["4. Decision Fusion & Substation Action Engine"]
        ENG["ActionEngine Protocol Arbitrator"]
        ACT1["IEC 61850 SCADA Alarm & Trip Interlocks (SIML / GGIO)"]
        ACT2["Dynamic Load Shedding / Curtailment Commands"]
        ACT3["Automated Field Work-Orders (SFRA / 2-FAL Furan / FLIR)"]
    end

    subgraph React_GUI["5. React + TypeScript Interactive Digital Twin (Vercel)"]
        DASH["Real-Time 7-Gas Telemetry & Log/Linear Charting"]
        TWIN["Interactive 2D Transformer Cutaway Fault Locator"]
        TERNARY["Live Animated Duval Triangle 1 Ternary Plot"]
        SIM["Investor Sandbox: Live Gas Sliders & 9-Scenario Tour"]
    end

    SS_Sensors --> Preproc
    Preproc --> Hybrid_AI
    CNN --> CNN_OUT
    AI_Branch --> Fusion
    Standards_Branch --> Fusion
    Fusion --> React_GUI
    Fusion --> ACT1
    Fusion --> ACT2
    Fusion --> ACT3
```

---

## 🧠 Deep Learning 1D-CNN: Complete Training & Modeling Guide

Traditional DGA tools rely on static, single-point gas ratios (such as Rogers Ratios or static Duval points). However, single-point snapshots fail to distinguish between **historical stable gas accumulation** and an **active, rapidly evolving incipient fault**, and they frequently trigger false alarms during temporary sensor drift.

Our **1D Convolutional Neural Network (1D-CNN)** solves this by treating DGA telemetry as a **7-channel temporal waveform** over a rolling 24-hour window.

### 1. Synthetic Telemetry Generation & Physics-Informed Data Pipeline (`generate_data.py`)

Because catastrophic high-voltage transformer failures are rare in balanced utility datasets, the model is trained on a **physics-informed synthetic time-series generator** grounded in IEEE C57.104-2019 and IEC 60599 thermodynamic fault signatures.

#### Input Tensor Representation
Each training sample is a multi-variate time-series matrix $X \in \mathbb{R}^{C \times L}$:
- **Channels ($C = 7$):** $\left[ H_2, CH_4, C_2H_6, C_2H_4, C_2H_2, CO, CO_2 \right]$
- **Sequence Length ($L = 24$):** 24 consecutive hourly telemetry measurements ($t_0, t_1, \dots, t_{23}$).

#### Temporal Trajectory Formulation
For each fault class $y \in \{0, \dots, 8\}$ and each gas channel $c \in \{1, \dots, 7\}$, the concentration trajectory $X_c(t)$ over $t \in [0, 23]$ is synthesized by combining a baseline concentration $B_c$, a thermodynamic fault growth function $G_c(t)$ (exponential, linear ramp, or step impulse depending on fault physics), and Gaussian photoacoustic measurement noise $\epsilon_c(t)$:

$$X_c(t) = \max\left(0, \; B_c + \alpha_c \cdot G_c(t) + \epsilon_c(t)\right), \quad \epsilon_c(t) \sim \mathcal{N}(0, \sigma_c^2)$$

| Class ID | Code | Fault Scenario | Temporal Growth Profile $G_c(t)$ | Primary Thermodynamic Signature |
|---|---|---|---|---|
| `0` | `NORM` | Normal Operation | Stationary baseline + white noise $\mathcal{N}(0, \sigma^2)$ | All 7 gases strictly $<90\text{th}$ percentile limits |
| `1` | `PD` | Partial Discharge | Exponential $H_2$ growth; negligible hydrocarbons | $H_2 \in [150, 450]\text{ ppm}$, $\%CH_4 \ge 98\%$ in Duval |
| `2` | `D1` | Low-Energy Sparking | Step-ramp emergence of $C_2H_2$ and $H_2$ | $C_2H_2 \in [8, 18]\text{ ppm}$, $\%C_2H_2 \ge 13\%$, low $C_2H_4$ |
| `3` | `D2` | High-Energy Arcing | Steep exponential surge in $C_2H_2$, $H_2$, and $C_2H_4$ | $C_2H_2 > 30\text{ ppm}$ ($\ge 29\%$ Duval), high $d[C_2H_2]/dt$ |
| `4` | `T1` | Thermal Fault ($<300^\circ\text{C}$) | Gradual thermal ramp in $CH_4$ and $C_2H_6$ | $CH_4 > 180\text{ ppm}$, $C_2H_6 > 75\text{ ppm}$, $\%C_2H_4 < 20\%$ |
| `5` | `T2` | Thermal Fault ($300^\circ–700^\circ\text{C}$) | Sustained rise in $C_2H_4$, $CH_4$, and $C_2H_6$ | $C_2H_4 \in [50, 150]\text{ ppm}$ ($20\% \le \%C_2H_4 < 50\%$) |
| `6` | `T3` | Thermal Fault ($>700^\circ\text{C}$) | Aggressive C-C bond cracking; $C_2H_4 \gg CH_4$ | $C_2H_4 > 200\text{ ppm}$ ($\%C_2H_4 \ge 50\%$), trace $C_2H_2$ |
| `7` | `CELL` | Cellulose Paper Pyrolysis | Rapid $CO$ surge outpacing $CO_2$ generation | $CO > 600\text{ ppm}$, $CO_2/CO < 3.0$ (glucose cleavage) |
| `8` | `SENS` | Sensor Drift / Glitch | Discontinuous single-channel step jump in $H_2$ | Non-physical $H_2$ spike with $\Delta CH_4 \approx \Delta C_2H_6 \approx 0$ |

#### Feature Normalization
Because gas concentrations span four orders of magnitude—from $C_2H_2$ ($0.1–50\text{ ppm}$) to $CO_2$ ($300–6000\text{ ppm}$)—raw ppm values would cause high-magnitude gases ($CO_2, CO$) to dominate gradient updates. Prior to entering the first convolutional layer, the input tensor undergoes **Logarithmic Compression + Channel-Wise Standardization**:

$$\tilde{X}_c(t) = \frac{\ln(1 + X_c(t)) - \mu_c}{\sigma_c + 10^{-6}}$$

where $\mu_c$ and $\sigma_c$ are the channel-wise mean and standard deviation computed across the training set and persisted alongside the model weights.

---

### 2. 1D-CNN Architecture & Mathematical Formulation (`model.py`)

For a normalized input batch $\tilde{X} \in \mathbb{R}^{B \times 7 \times 24}$, each 1D convolutional block applies learnable temporal filters $W \in \mathbb{R}^{C_{\text{out}} \times C_{\text{in}} \times K}$ across the 24-hour axis to extract local derivatives (rates of rise), multi-gas co-evolution patterns, and step discontinuities:

$$z_{c_{\text{out}}}(t) = \sum_{c_{\text{in}}=1}^{C_{\text{in}}} \sum_{k=0}^{K-1} W(c_{\text{out}}, c_{\text{in}}, k) \cdot \tilde{X}(c_{\text{in}}, t + k - p) + b_{c_{\text{out}}}$$

$$a_{c_{\text{out}}}(t) = \text{ReLU}\left(\text{BatchNorm1D}\left(z_{c_{\text{out}}}(t)\right)\right)$$

#### Layer-by-Layer Network Topology

| Layer | Operation & Hyperparameters | Input Shape | Output Shape | Primary Feature Extraction Role |
|---|---|---|---|---|
| **Input** | Normalized 7-Gas 24h Tensor | $[B, 7, 24]$ | $[B, 7, 24]$ | Multi-variate temporal gas concentrations |
| **Conv Block 1** | `Conv1d(7, 32, k=3, p=1)` + `BatchNorm1d(32)` + `ReLU` + `MaxPool1d(2)` | $[B, 7, 24]$ | $[B, 32, 12]$ | Short-term 3-hour local derivatives ($d[\text{Gas}]/dt$) & step glitches |
| **Conv Block 2** | `Conv1d(32, 64, k=3, p=1)` + `BatchNorm1d(64)` + `ReLU` + `MaxPool1d(2)` | $[B, 32, 12]$ | $[B, 64, 6]$ | Medium-term 6-to-12 hour cross-gas thermodynamic correlations |
| **Conv Block 3** | `Conv1d(64, 128, k=3, p=1)` + `BatchNorm1d(128)` + `ReLU` | $[B, 64, 6]$ | $[B, 128, 6]$ | High-level 24-hour fault progression signatures |
| **Flatten** | Tensor Reshape | $[B, 128, 6]$ | $[B, 768]$ | Concatenates temporal feature maps |
| **Dense Head** | `Linear(768, 64)` + `ReLU` + `Dropout(p=0.2)` | $[B, 768]$ | $[B, 64]$ | Non-linear fault manifold projection with regularization |
| **Output Layer** | `Linear(64, 9)` + `Softmax(dim=-1)` | $[B, 64]$ | $[B, 9]$ | Calibrated probability distribution over 9 fault classes |

---

### 3. Training Hyperparameters, Loss Function & Convergence

- **Dataset Split:** $4,500$ synthetic 24-hour sequences ($500$ per class) split $80\%$ Training ($3,600$ samples) / $20\%$ Stratified Validation ($900$ samples).
- **Objective Function:** Multi-Class Categorical Cross-Entropy Loss with $L_2$ weight decay regularization:
  $$\mathcal{L}(\theta) = -\frac{1}{N} \sum_{i=1}^{N} \sum_{m=1}^{9} y_{i,m} \ln\left(\hat{p}_{i,m}\right) + \lambda \Vert{}\theta\Vert{}_2^2$$
- **Optimizer:** Adam ($\eta = 0.0015$, $\beta_1 = 0.9$, $\beta_2 = 0.999$, weight decay $\lambda = 10^{-4}$).
- **Batch Size & Epochs:** Batch size $B = 64$, trained for $35$ epochs (~5 seconds on modern CPU).
- **Validation Performance:** Achieves **$99.8\% - 100.0\%$ validation accuracy** across all 9 classes, crucially achieving zero confusion between **High-Energy Arcing (`D2`)** and **Sensor Drift (`SENS`)** by verifying whether $H_2$ spikes are accompanied by corresponding hydrocarbon cracking.
- **Model Export:** Checkpoints are saved to `models/dga_1dcnn.pth` (PyTorch) and exported to `public/models/dga_1dcnn.onnx` for sub-10ms browser inference in React via `onnxruntime-web` or native TypeScript matrix math (`src/engine/cnnInference.ts`).

---

## 🔬 Engineering & Mathematical Modeling

### 1. Gas Formation Physics & Thermodynamics
Mineral insulating oil consists of hydrocarbon mixtures (paraffinic, naphthenic, and aromatic molecules). Electrical discharges and localized thermal hot spots cleave covalent chemical bonds according to activation energy:

$$\text{Low Thermal Stress } (<300^\circ\text{C}): \quad C-H \text{ bond cleavage } \longrightarrow CH_4 \text{ (Methane)}, C_2H_6 \text{ (Ethane)}$$
$$\text{Medium Thermal Stress } (300^\circ\text{C}-700^\circ\text{C}): \quad C-C \text{ bond cleavage } \longrightarrow C_2H_4 \text{ (Ethylene)}$$
$$\text{High Thermal Stress } (>700^\circ\text{C}): \quad \text{Severe hydrocarbon cracking } \longrightarrow C_2H_4 \gg CH_4$$
$$\text{Electrical Arcing / Discharge } (>1500^\circ\text{C}): \quad C\equiv C \text{ triple-bond synthesis } \longrightarrow C_2H_2 \text{ (Acetylene)}, H_2$$
$$\text{Cellulose Paper Insulation Pyrolysis}: \quad \text{Glucose polymer chain scission } \longrightarrow CO, CO_2, H_2O, \text{2-FAL Furans}$$

#### Key Diagnostic Gases Monitored (IEEE C57.104-2019 Table 1):
| Gas | Chemical Symbol | Primary Fault Origin | Normal IEEE Limit (ppm) |
|---|---|---|---|
| **Hydrogen** | $H_2$ | Partial discharge (corona), electrolysis, low-temp sparking | $100$ |
| **Methane** | $CH_4$ | Low-to-medium temperature thermal faults | $120$ |
| **Ethane** | $C_2H_6$ | Low-temperature thermal degradation of mineral oil | $65$ |
| **Ethylene** | $C_2H_4$ | High-temperature thermal overheating ($>300^\circ\text{C}$) | $50$ |
| **Acetylene** | $C_2H_2$ | **Severe electrical arcing**, flashover, contact sparking | **$1$** |
| **Carbon Monoxide** | $CO$ | Thermal pyrolysis of solid Kraft paper insulation | $350$ |
| **Carbon Dioxide** | $CO_2$ | Normal cellulose aging and thermal oil oxidation | $2500$ |

---

### 2. Duval Triangle 1 Coordinate Geometry
Michel Duval's method maps three hydrocarbon gases onto a ternary coordinate system summing to $100\%$:

$$\%CH_4 = \frac{100 \cdot [CH_4]}{[CH_4] + [C_2H_4] + [C_2H_2]}, \quad \%C_2H_4 = \frac{100 \cdot [C_2H_4]}{[CH_4] + [C_2H_4] + [C_2H_2]}, \quad \%C_2H_2 = \frac{100 \cdot [C_2H_2]}{[CH_4] + [C_2H_4] + [C_2H_2]}$$

```text
                %CH4 = 100% (Top Vertex)
                        /\
                       /  \
                      / PD \      PD: Partial Discharge (%CH4 >= 98%)
                     /------\
                    /   T1   \    T1: Thermal Fault <300°C (%C2H4 < 20%, %C2H2 < 4%)
                   /----------\
                  /  T2  | D1  \  T2: 300°C-700°C | D1: Low-Energy Discharge
                 /--------|-----\
                /   T3    |  D2  \ T3: >700°C (%C2H4 >= 50%) | D2: Arcing (%C2H2 >= 29%)
               /------------------\
%C2H4 = 100%                       %C2H2 = 100%
(Bottom-Left)                     (Bottom-Right)
```

### 3. Total Dissolved Combustible Gas (TDCG)
$$TDCG = [H_2] + [CH_4] + [C_2H_6] + [C_2H_4] + [C_2H_2] + [CO]$$
- **Condition 1 (Normal):** $TDCG \le 720\text{ ppm}$
- **Condition 2 (Caution):** $721 - 1920\text{ ppm}$
- **Condition 3 (Warning):** $1921 - 4630\text{ ppm}$
- **Condition 4 (Critical Hazard):** $> 4630\text{ ppm}$

### 4. Solid Paper Insulation Degradation Index
$$\text{Paper Ratio} = \frac{[CO_2]}{[CO]}$$
- **$4.0 \le \text{Ratio} \le 10.0$:** Normal gradual cellulose aging.
- **$\text{Ratio} < 3.0$ with $CO > 350\text{ ppm}$:** **Accelerated Paper Pyrolysis** (critical risk of turn-to-turn winding short-circuit).
- **$\text{Ratio} > 12.0$:** Mild low-temperature cellulose warming with oil oxidation.

---

## 📋 Comprehensive Fault Possibilities Matrix

| # | Fault Scenario | Code | Dominant Gas Fingerprint | IEEE C57.104 Status | Duval Triangle Zone | Automated Substation Mitigation Action |
|---|---|---|---|---|---|---|
| **1** | **Normal Operation** | `NORM` | All gases strictly below 90th percentile limits | Condition 1 (Normal) | Normal (Within Limits) | Asset healthy; continue 24h routine telemetry |
| **2** | **Partial Discharge (PD)** | `PD` | Sharp $H_2$ spike ($150–450$ ppm), minor $CH_4$, $C_2H_2 \approx 0$ | Condition 2/3 (Caution/Crit) | `PD: Partial Discharge` | UHF/Acoustic PD scan, verify bushing tap $\tan\delta$ |
| **3** | **Low-Energy Sparking (D1)** | `D1` | Emergence of $C_2H_2$ ($8–16$ ppm), $H_2$, low $C_2H_4$ | Condition 3 (Critical) | `D1: Low-Energy Discharge` | Increase scan cycle to 15 min, inspect OLTC contacts |
| **4** | **High-Energy Arcing (D2)** | `D2` | Violent $C_2H_2$ surge ($>30$ ppm), heavy $H_2$ & $C_2H_4$ | Condition 4 (Hazard) | `D2: High-Energy Discharge` | **Immediate load curtailment (30–50%)**, trip interlock |
| **5** | **Thermal Fault <300°C (T1)** | `T1` | Heavy $CH_4$ ($>180$ ppm) & $C_2H_6$, $C_2H_4 < 20\%$ | Condition 2/3 (Caution/Crit) | `T1: Thermal Fault (<300°C)` | Check core ground straps and external lead terminations |
| **6** | **Thermal Fault 300°–700°C (T2)**| `T2` | Prominent $C_2H_4$ ($50–150$ ppm) & $C_2H_6$ | Condition 2/3 (Caution/Crit) | `T2: Thermal Fault (300°–700°C)` | Verify ONAF cooling fans/oil pumps, check WTI/OTI |
| **7** | **Thermal Fault >700°C (T3)** | `T3` | Dominant $C_2H_4$ ($>200$ ppm, $>50\%$ Duval) | Condition 3/4 (Critical) | `T3: Thermal Fault (>700°C)` | FLIR thermography, inhibit peak overloading, SFRA test |
| **8** | **Cellulose / Paper Pyrolysis** | `CELL` | Massive $CO$ ($>600$ ppm), $CO_2/CO < 3.0$ | Condition 3 (Critical) | Normal / T2 | HPLC 2-Furfuraldehyde (2-FAL) furan & DP analysis |
| **9** | **Sensor Drift / Instrument Fault** | `SENS` | Single-channel erratic $H_2$ jump, 0 hydrocarbon rise | Condition 2 (Caution) | Normal (Within Limits) | Calibrate photoacoustic cell, run zero-span verification |

---

## 💻 Interactive React Digital Twin & Investor Sandbox

The frontend has been engineered in **React 18, TypeScript, and Tailwind CSS** specifically to give investors, utility executives, and protection engineers an intuitive, zero-latency simulation environment:

1. **1-Click "All 9 Possibilities" Guided Tour:** Instantaneously load any of the 9 canonical substation states or hit **"Play 24h"** to watch incipient gases build up hour-by-hour in real time.
2. **Interactive Gas Injection Sliders:** Drag any of the 7 gas sliders ($H_2, CH_4, C_2H_6, C_2H_4, C_2H_2, CO, CO_2$) to synthesize custom multi-fault combinations and watch the 1D-CNN probabilities, Duval Triangle coordinate, and SCADA interlocks respond at 60 FPS (<16ms).
3. **2D Transformer Cutaway Fault Locator:** Interactive SVG schematic of a 315 MVA power transformer that visually highlights the physical subsystem under stress (HV/LV windings, OLTC diverter compartment, core laminations, Kraft paper insulation, or PAS sensor manifold).
4. **Dual-Scale (Linear / Logarithmic) 24-Hour Telemetry Charts:** Seamlessly switch between Linear and $\log_{10}$ axes to inspect trace Acetylene ($1\text{ ppm}$) alongside bulk Carbon Dioxide ($2500\text{ ppm}$).
5. **1D-CNN Architecture & Training Telemetry Modal:** Built-in technical deep-dive drawer displaying layer activations, kernel shapes, training loss curves, and validation metrics.

---

## 🚀 Getting Started & Vercel Deployment

### 1. Run the React Frontend Locally
```bash
# Install frontend dependencies
npm install

# Start the Vite development server (http://localhost:5173)
npm run dev

# Build production bundle for Vercel
npm run build
```

### 2. Train / Export the Python 1D-CNN Model (Optional)
If you wish to regenerate the synthetic dataset, retrain the PyTorch 1D-CNN, or re-export the ONNX weights:
```bash
pip install -r requirements.txt

# Train 9-class 1D-CNN (~5 seconds on CPU) and save to models/dga_1dcnn.pth
python model.py

# Export to ONNX (models/dga_1dcnn.onnx & public/models/dga_1dcnn.onnx) and model_weights.json
python export_onnx.py

# Run CLI verification across all 9 fault possibilities
python demo_all_possibilities.py
```

### 3. Deploy to Vercel (1-Click or CLI)
The project is pre-configured with `vercel.json` for zero-configuration deployment on Vercel:
```bash
# Using Vercel CLI
npm i -g vercel
vercel --prod
```
Or push this repository to GitHub/GitLab and import directly into [Vercel](https://vercel.com/new) (Framework Preset: **Vite**, Build Command: `npm run build`, Output Directory: `dist`).

---

## 📁 Repository File Structure

```text
GAS_fault_detector/
├── src/                          # React 18 + TypeScript Frontend
│   ├── components/
│   │   ├── TopExecutiveBar.tsx   # Asset health KPIs, ROI ticker & 9-Scenario Tour bar
│   │   ├── GasControlSliders.tsx # Interactive 7-gas injection sliders & noise generator
│   │   ├── TransformerTwinSVG.tsx# Interactive 2D Transformer cutaway fault visualizer
│   │   ├── DuvalTrianglePlot.tsx # Custom SVG/Plotly Duval Triangle 1 ternary diagram
│   │   ├── TelemetryChart24h.tsx # 24h multi-gas time-series chart (Linear / Log10 toggle)
│   │   ├── CnnConfidenceCard.tsx # 9-class Softmax probability chart & CNN inspector modal
│   │   └── ActionDispatchCard.tsx# Automated IEC 61850 SCADA & field work-order panel
│   ├── engine/
│   │   ├── dgaStandards.ts       # IEEE C57.104, IEC 60599, TDCG & Duval Triangle math
│   │   ├── cnnInference.ts       # Client-side 1D-CNN forward pass / ONNX Runtime Web
│   │   ├── actionProtocol.ts     # Automated Substation ActionEngine dispatch rules
│   │   ├── scenarioPresets.ts    # 24-hour time-series presets for all 9 fault classes
│   │   └── model_weights.json    # Exported weights from trained PyTorch model
│   ├── App.tsx                   # Main Substation Digital Twin Command Center
│   ├── index.css                 # Tailwind CSS styles & animations
│   └── main.tsx                  # React DOM entry point
├── api/
│   └── diagnose.py               # Optional Vercel Python Serverless Function endpoint
├── models/
│   ├── dga_1dcnn.pth             # Trained PyTorch 1D-CNN weights checkpoint
│   └── dga_1dcnn.onnx            # Exported ONNX model for edge/web execution
├── public/
│   └── models/
│       └── dga_1dcnn.onnx        # Static public ONNX model for onnxruntime-web
├── export_onnx.py                # Script to export PyTorch model to ONNX & weights JSON
├── model.py                      # PyTorch 1D-CNN architecture & training script
├── generate_data.py              # Physics-informed 24h 7-gas synthetic data generator
├── validator.py                  # Reference IEEE C57.104 & Duval Triangle validator
├── action_engine.py              # Reference substation automated mitigation protocol
├── demo_all_possibilities.py     # Standalone CLI test runner across all 9 scenarios
├── vercel.json                   # Vercel SPA & serverless deployment configuration
├── vite.config.ts                # Vite bundler configuration with manual chunking
├── tailwind.config.js            # Tailwind SCADA dark theme configuration
├── tsconfig.json                 # TypeScript compiler configuration
├── package.json                  # React + Vite + Tailwind dependencies
├── requirements.txt              # Python ML training dependencies
└── README.md                     # Comprehensive Investor & Engineering Documentation
```

---

## 📜 Regulatory Standards & References
1. **IEEE Std C57.104-2019:** *IEEE Guide for the Interpretation of Gases Generated in Mineral Oil-Immersed Transformers.*
2. **IEC 60599:2022:** *Mineral oil-filled electrical equipment in service — Guidance on the interpretation of dissolved and free gases analysis.*
3. **Duval, M. (2002):** *A Review of Faults Detectable by DGA in Transformers.* IEEE Electrical Insulation Magazine, Vol. 18, No. 3.
4. **IEC 61850-7-4:** *Communication networks and systems for power utility automation — Compatible logical node classes (`SIML`, `STMP`, `GGIO`).*

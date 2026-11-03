import numpy as np
import pandas as pd

# Diagnostic gas order: [H2, CH4, C2H6, C2H4, C2H2, CO, CO2]
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

def generate_sequence(scenario_type="normal", steps=24, seed=None):
    """
    Generates a realistic 24-step (hourly) time-series for 7 diagnostic gases:
    Index:  0     1     2      3      4     5    6
    Gas:   [H2,  CH4,  C2H6,  C2H4,  C2H2,  CO,  CO2]
    Units: ppm (parts per million)
    """
    if seed is not None:
        np.random.seed(seed)
        
    # Baseline normal operational gas concentrations (in ppm)
    base_gases = np.array([15.0, 12.0, 8.0, 10.0, 0.1, 150.0, 850.0])
    data = []

    # Fault onset hour (typically after 8 hours of stable baseline observation)
    onset_step = 8

    for t in range(steps):
        noise = np.random.normal(0, 0.02, size=7)
        current = base_gases.copy()
        
        # Slight baseline aging drift
        current += t * np.array([0.04, 0.03, 0.02, 0.03, 0.001, 0.3, 1.2])
        
        if t >= onset_step:
            dt = t - onset_step + 1
            growth = dt ** 1.35
            
            if scenario_type == "normal":
                # Healthy transformer: strictly normal baseline drift
                pass
                
            elif scenario_type == "pd":
                # Partial Discharge: Corona ionization creates massive H2, moderate CH4, zero C2H2, zero C2H4 growth
                current[0] += growth * 15.0   # H2 spikes to 250-450 ppm
                current[1] += growth * 3.0    # CH4 rises to 50-70 ppm
                current[3] = max(0.5, current[3] * 0.15) # C2H4 negligible in PD
                current[4] = 0.05             # C2H2 negligible
                
            elif scenario_type == "d1":
                # Low-Energy Discharge (Sparking): Emergence of Acetylene with moderate H2
                # %C2H2 in [13%, 25%], %C2H4 < 23%
                current[0] += growth * 7.0    # H2
                current[1] += growth * 1.8    # CH4
                current[3] += growth * 0.4    # C2H4 kept low
                current[4] += growth * 0.8    # C2H2 clear presence (8-16 ppm)
                
            elif scenario_type == "d2":
                # High-Energy Arcing: Severe arc flashover creates massive C2H2 and H2
                # %C2H2 >= 29%
                current[0] += growth * 18.0   # H2 heavy surge
                current[1] += growth * 2.5    # CH4
                current[3] += growth * 3.5    # C2H4
                current[4] += growth * 5.5    # C2H2 massive spike (>40 ppm)
                current[5] += growth * 3.0    # CO
                
            elif scenario_type == "t1":
                # Thermal Fault < 300°C: Localized hot spot, dominant CH4 and C2H6
                # %C2H4 < 20%, %C2H2 < 4%
                current[1] += growth * 12.0   # CH4 strong surge (>180 ppm)
                current[2] += growth * 9.0    # C2H6 strong surge (>120 ppm)
                current[3] += growth * 0.8    # C2H4 stays low (< 20%)
                current[4] = 0.1              # C2H2 negligible (< 4%)
                
            elif scenario_type == "t2":
                # Thermal Fault 300°C - 700°C: Conductor overheating
                # 20% <= %C2H4 < 50%, %C2H2 < 4%
                current[1] += growth * 5.0    # CH4
                current[2] += growth * 4.0    # C2H6
                current[3] += growth * 5.0    # C2H4 prominent
                current[4] = 0.2              # C2H2 minimal (< 4%)
                
            elif scenario_type == "t3":
                # Thermal Fault > 700°C: Severe core overheating, heavy C2H4 (> 50%)
                current[0] += growth * 3.0    # H2
                current[1] += growth * 4.0    # CH4
                current[2] += growth * 2.0    # C2H6
                current[3] += growth * 18.0   # C2H4 massive surge (> 50% Duval sum)
                current[4] += growth * 0.25   # C2H2 trace (< 15%)
                
            elif scenario_type == "cellulose":
                # Paper / Cellulose Pyrolysis: Massive CO and CO2 surge, CO2/CO drops < 3.0
                current[0] += growth * 1.5    # H2
                current[5] += growth * 55.0   # CO massive surge (600 - 1200 ppm)
                current[6] += growth * 90.0   # CO2 surge (~2200 ppm)
                
            elif scenario_type == "sensor_drift":
                # Erroneous sensor spike: only H2 drifts abnormally with high sensor jitter, others normal
                current[0] += growth * 14.0 + np.random.normal(0, 8.0)
                
        noisy_sample = np.maximum(0.01, current * (1 + noise))
        data.append(noisy_sample)

    return np.array(data, dtype=np.float32)

def build_dataset(samples_per_class=150, window_size=24):
    """
    Builds a balanced multi-class dataset for 1D-CNN training:
    9 distinct operational and fault scenarios.
    """
    X, y = [], []
    for sc_key, sc_info in SCENARIOS.items():
        label = sc_info["id"]
        for _ in range(samples_per_class):
            seq = generate_sequence(scenario_type=sc_key, steps=window_size)
            X.append(seq)
            y.append(label)
            
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int64)
    
    indices = np.random.permutation(len(X))
    return X[indices], y[indices]

if __name__ == "__main__":
    X, y = build_dataset()
    print(f"Dataset generated! X shape: {X.shape}, y shape: {y.shape}")

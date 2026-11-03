class ActionEngine:
    """
    Substation Automated Action and Mitigation Protocol Engine.
    Maps AI diagnosis and standard DGA classifications to immediate
    substation operational commands, electrical dispatch actions,
    and field maintenance orders.
    """
    def __init__(self):
        self.rules = {
            "D2: High-Energy Discharge (Arcing)": {
                "severity": "CRITICAL (Priority 1 - Immediate Intervention)",
                "color": "#dc3545",
                "actions": [
                    "URGENT: Initiate automated load transfer or curtailment by 30-50% to prevent explosive tank rupture.",
                    "Dispatch emergency substation maintenance crew to inspect Buchholz relay gas accumulation and pressure relief valve (PRV).",
                    "Isolate unit if differential protection or sudden pressure relays register concurrent anomalies.",
                    "Extract an oil sample within 4 hours for laboratory gas chromatography and breakdown voltage (BDV) testing.",
                    "Schedule Sweep Frequency Response Analysis (SFRA) and winding resistance measurements to verify structural integrity."
                ]
            },
            "D1: Low-Energy Discharge (Sparking)": {
                "severity": "HIGH (Priority 2 - Active Degradation)",
                "color": "#fd7e14",
                "actions": [
                    "Increase online DGA telemetry polling frequency to 15-minute cycles.",
                    "Perform acoustic / UHF partial discharge triangulation to localize sparking source in tank/bushing.",
                    "Inspect On-Load Tap Changer (OLTC) diverter switch contacts and potential static electrification in oil circulation.",
                    "Prepare backup mobile substation or switchgear redundancy in case of progressive insulation deterioration."
                ]
            },
            "PD: Partial Discharge": {
                "severity": "MEDIUM-HIGH (Priority 3 - Incipient Electrical Fault)",
                "color": "#ffc107",
                "actions": [
                    "Verify bushing tap capacitance and power factor (tan delta) measurements.",
                    "Perform UHF / acoustic emission partial discharge scan across tank perimeter.",
                    "Verify oil moisture levels and gas blanket nitrogen pressure.",
                    "Schedule gas extraction and vacuum degasification if bubble formation or cavitation is suspected."
                ]
            },
            "T3: Thermal Fault (>700°C)": {
                "severity": "CRITICAL (Priority 1 - Severe Overheating)",
                "color": "#dc3545",
                "actions": [
                    "Inspect forced-oil cooling pumps (OFAF/ODAF) and radiator fan motor relays for failure.",
                    "Reduce peak operating load immediately; avoid cyclic overloading during high ambient temperatures.",
                    "Perform forward-looking infrared (FLIR) thermography on high-voltage bushings, terminations, and tank surfaces.",
                    "Check magnetic shunts and core grounding current for circulating loops."
                ]
            },
            "T2: Thermal Fault (300°C - 700°C)": {
                "severity": "HIGH (Priority 2 - Conductor Overheating)",
                "color": "#fd7e14",
                "actions": [
                    "Verify ambient temperature vs winding temperature indicator (WTI) and top-oil indicator (OTI) calibration.",
                    "Inspect radiator banks for silt blockage or oil flow restriction.",
                    "Engage auxiliary cooling banks manually via SCADA control overrides.",
                    "Trend rate of C2H4 generation over next 24-48 hours."
                ]
            },
            "T1: Thermal Fault (<300°C)": {
                "severity": "MEDIUM (Priority 4 - Low-Temperature Hotspot)",
                "color": "#17a2b8",
                "actions": [
                    "Check external lead bolted connections and current transformer (CT) terminals.",
                    "Verify tightness of core grounding strap and inspect for accidental multiple grounding points.",
                    "Continue regular 6-hour automated DGA telemetry surveillance.",
                    "Log thermal profile against ambient substation weather parameters."
                ]
            },
            "Cellulose / Paper Degradation": {
                "severity": "HIGH (Priority 2 - Irreversible Solid Insulation Loss)",
                "color": "#e83e8c",
                "actions": [
                    "Perform High-Performance Liquid Chromatography (HPLC) for 2-Furfuraldehyde (2-FAL) furan analysis.",
                    "Estimate remaining Degree of Polymerization (DP) of winding paper insulation (critical if DP < 250).",
                    "Conduct dissolved water-in-oil titration (Karl Fischer ASTM D1533) to check paper moisture saturation.",
                    "Plan offline dry-out or online molecular sieve oil dehydration treatment."
                ]
            },
            "Sensor Drift / Transducer Anomaly": {
                "severity": "ADVISORY (Priority 5 - Instrument Verification)",
                "color": "#6c757d",
                "actions": [
                    "Instrument validation alert: single-channel gas anomaly without physical multi-gas thermodynamic correlation.",
                    "Inspect photoacoustic spectroscopy (PAS) cell optical filters or electrochemical sensor membrane for drift.",
                    "Perform zero-point and span calibration on the online DGA monitor manifold.",
                    "Compare online telemetry readings against manual syringe oil sample analyzed via laboratory GC."
                ]
            },
            "Normal": {
                "severity": "LOW (Normal Operation - Asset Healthy)",
                "color": "#28a745",
                "actions": [
                    "Transformer asset is operating within nominal IEEE/IEC thermal and dielectric envelopes.",
                    "Maintain standard continuous 24-hour telemetry logging.",
                    "Next routine scheduled oil sampling per annual preventative maintenance matrix."
                ]
            }
        }

    def get_recommendations(self, diagnostic_key):
        """
        Retrieves action plan based on Duval zone, AI class, or diagnostic key.
        """
        # Exact match lookup
        if diagnostic_key in self.rules:
            return self.rules[diagnostic_key]
            
        # Partial match lookup
        for key, val in self.rules.items():
            if key.split(":")[0].strip() in diagnostic_key:
                return val
            if "Arcing" in diagnostic_key and "Arcing" in key:
                return val
            if "Thermal" in diagnostic_key and "Thermal" in key:
                return val
            if "Cellulose" in diagnostic_key and "Cellulose" in key:
                return val
            if "Sensor" in diagnostic_key and "Sensor" in key:
                return val
                
        return self.rules["Normal"]

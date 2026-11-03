class StandardsValidator:
    """
    Expert Standards Validation Engine based on:
    - IEEE C57.104-2019 (Guide for the Interpretation of Gases Generated in Mineral Oil-Immersed Transformers)
    - IEC 60599 (Mineral oil-filled electrical equipment in service - Guidance on the interpretation of dissolved and free gases analysis)
    - Duval Triangle 1 Diagnostic Coordinates
    """
    def __init__(self):
        # IEEE C57.104-2019 Table 1 90th percentile threshold limits in ppm (parts per million)
        self.ieee_90th_limits = {
            'H2': 100.0,
            'CH4': 120.0,
            'C2H6': 65.0,
            'C2H4': 50.0,
            'C2H2': 1.0,
            'CO': 350.0,
            'CO2': 2500.0
        }
        
        # IEEE C57.104 Table 1 Condition 3 (Critical / Alarm) thresholds
        self.ieee_condition3_limits = {
            'H2': 300.0,
            'CH4': 400.0,
            'C2H6': 150.0,
            'C2H4': 150.0,
            'C2H2': 3.0,
            'CO': 800.0,
            'CO2': 5000.0
        }

    def check_ieee_limits(self, gas_dict):
        """
        Determines IEEE C57.104 condition state (Condition 1: Normal, Condition 2: Caution, Condition 3: Critical)
        and lists any breached gases.
        """
        breached_c3 = [gas for gas, val in gas_dict.items() if val > self.ieee_condition3_limits.get(gas, float('inf'))]
        breached_c2 = [gas for gas, val in gas_dict.items() if val > self.ieee_90th_limits.get(gas, float('inf'))]
        
        if breached_c3:
            return "Condition 3: CRITICAL (Immediate Action)", breached_c3
        elif breached_c2:
            return "Condition 2: CAUTION (Resample & Investigate)", breached_c2
        else:
            return "Condition 1: NORMAL (Healthy Operation)", []

    def calculate_tdcg(self, gas_dict):
        """
        Calculates Total Dissolved Combustible Gas (TDCG):
        TDCG = H2 + CH4 + C2H6 + C2H4 + C2H2 + CO
        """
        combustibles = ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2', 'CO']
        tdcg_val = sum(gas_dict.get(g, 0.0) for g in combustibles)
        
        if tdcg_val <= 720:
            status = "Normal (≤720 ppm)"
        elif tdcg_val <= 1920:
            status = "Caution (721 - 1920 ppm)"
        elif tdcg_val <= 4630:
            status = "Warning (1921 - 4630 ppm)"
        else:
            status = "Hazard / Critical (>4630 ppm)"
            
        return tdcg_val, status

    def calculate_duval_coordinates(self, ch4, c2h4, c2h2, is_fault_active=None):
        """
        Computes Duval Triangle 1 coordinates:
        %CH4, %C2H4, %C2H2 normalized to sum to 100%.
        Per IEC 60599 / Michel Duval, Duval's Triangle applies when gases exceed normal limits.
        """
        total = ch4 + c2h4 + c2h2
        if total <= 1e-4:
            return 33.33, 33.33, 33.33, "Normal"
            
        pct_ch4  = (ch4 / total) * 100.0
        pct_c2h4 = (c2h4 / total) * 100.0
        pct_c2h2 = (c2h2 / total) * 100.0
        
        # In engineering standard practice: if total hydrocarbons are strictly at nominal baseline
        # and acetylene is negligible (<0.4 ppm) with ch4 < 25 and c2h4 < 20, the asset is normal.
        if (ch4 <= 20.0 and c2h4 <= 20.0 and c2h2 <= 0.4) and (is_fault_active is False or is_fault_active is None and total < 35.0):
            return pct_ch4, pct_c2h4, pct_c2h2, "Normal"

        zone = self._classify_duval(pct_ch4, pct_c2h4, pct_c2h2)
        return pct_ch4, pct_c2h4, pct_c2h2, zone

    def calculate_duval_zone(self, ch4, c2h4, c2h2, is_fault_active=None):
        _, _, _, zone = self.calculate_duval_coordinates(ch4, c2h4, c2h2, is_fault_active=is_fault_active)
        return zone

    def _classify_duval(self, pct_ch4, pct_c2h4, pct_c2h2):
        # Duval Triangle 1 standard zoning:
        # PD: %CH4 >= 98%
        if pct_ch4 >= 98.0:
            return "PD: Partial Discharge"
        # D2: %C2H2 >= 29% OR (%C2H2 >= 13% and %C2H4 >= 23%)
        elif pct_c2h2 >= 29.0:
            return "D2: High-Energy Discharge (Arcing)"
        elif pct_c2h2 >= 13.0 and pct_c2h4 >= 23.0:
            return "D2: High-Energy Discharge (Arcing)"
        # D1: %C2H2 in [13%, 29%) and %C2H4 < 23%, or %C2H2 in [4%, 13%) and %C2H4 < 20%
        elif pct_c2h2 >= 13.0 and pct_c2h4 < 23.0:
            return "D1: Low-Energy Discharge (Sparking)"
        elif pct_c2h2 >= 4.0 and pct_c2h4 < 20.0:
            return "D1: Low-Energy Discharge (Sparking)"
        # T3: %C2H4 >= 50%
        elif pct_c2h4 >= 50.0:
            return "T3: Thermal Fault (>700°C)"
        # T2: 20% <= %C2H4 < 50% and %C2H2 < 4%
        elif pct_c2h4 >= 20.0 and pct_c2h4 < 50.0 and pct_c2h2 < 4.0:
            return "T2: Thermal Fault (300°C - 700°C)"
        # T1: %C2H4 < 20% and %C2H2 < 4%
        elif pct_c2h4 < 20.0 and pct_c2h2 < 4.0:
            return "T1: Thermal Fault (<300°C)"
        else:
            return "DT: Thermal & Electrical Mix"

    def check_cellulose_degradation(self, co, co2):
        """
        Evaluates solid kraft paper insulation health using CO2/CO ratio.
        Healthy paper: 4.0 <= CO2/CO <= 10.0.
        Severe paper pyrolysis: CO2/CO < 3.0 with high CO (>350 ppm).
        """
        if co <= 1e-3:
            ratio = 100.0
        else:
            ratio = co2 / co
            
        if ratio < 3.0 and co > 350.0:
            status = "CRITICAL: Accelerated Paper Insulation Pyrolysis (Risk of Dielectric Breakdown)"
            risk = "High"
        elif ratio < 4.0:
            status = "ELEVATED: Kraft Paper Degradation Underway"
            risk = "Moderate"
        elif ratio > 12.0 and co2 > 2500.0:
            status = "CAUTION: Low-temperature paper heating / Excessive Oil Oxidation"
            risk = "Moderate"
        else:
            status = "NORMAL: Solid Paper Insulation Aging within Expected Life Curve"
            risk = "Low"
            
        return ratio, status, risk

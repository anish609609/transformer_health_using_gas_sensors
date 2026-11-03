/**
 * Expert Standards Validation Engine based on:
 * - IEEE C57.104-2019 (Guide for Interpretation of Gases in Mineral Oil-Immersed Transformers)
 * - IEC 60599 (Interpretation of Dissolved and Free Gases Analysis)
 * - Duval Triangle 1 Diagnostic Coordinate Geometry
 */

export interface GasReadings {
  H2: number;
  CH4: number;
  C2H6: number;
  C2H4: number;
  C2H2: number;
  CO: number;
  CO2: number;
}

export type GasKey = keyof GasReadings;

export const GAS_NAMES: GasKey[] = ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2', 'CO', 'CO2'];

export const GAS_METADATA: Record<GasKey, { name: string; chemical: string; limit: number; desc: string; color: string }> = {
  H2: { name: 'Hydrogen', chemical: 'H₂', limit: 100, desc: 'Corona discharge, electrolysis, sparking', color: '#38bdf8' },
  CH4: { name: 'Methane', chemical: 'CH₄', limit: 120, desc: 'Low-to-medium thermal fault (<300°C)', color: '#fb923c' },
  C2H6: { name: 'Ethane', chemical: 'C₂H₆', limit: 65, desc: 'Low-temperature oil decomposition', color: '#4ade80' },
  C2H4: { name: 'Ethylene', chemical: 'C₂H₄', limit: 50, desc: 'High-temperature thermal fault (>300°C)', color: '#c084fc' },
  C2H2: { name: 'Acetylene', chemical: 'C₂H₂', limit: 1, desc: 'Severe electrical arcing & flashover', color: '#f43f5e' },
  CO: { name: 'Carbon Monoxide', chemical: 'CO', limit: 350, desc: 'Cellulose paper insulation pyrolysis', color: '#2dd4bf' },
  CO2: { name: 'Carbon Dioxide', chemical: 'CO₂', limit: 2500, desc: 'Paper aging & atmospheric oxidation', color: '#a78bfa' },
};

export const IEEE_90TH_LIMITS: GasReadings = {
  H2: 100.0,
  CH4: 120.0,
  C2H6: 65.0,
  C2H4: 50.0,
  C2H2: 1.0,
  CO: 350.0,
  CO2: 2500.0,
};

export const IEEE_CONDITION3_LIMITS: GasReadings = {
  H2: 300.0,
  CH4: 400.0,
  C2H6: 150.0,
  C2H4: 150.0,
  C2H2: 3.0,
  CO: 800.0,
  CO2: 5000.0,
};

export interface IEEEValidationResult {
  condition: 'Condition 1' | 'Condition 2' | 'Condition 3' | 'Condition 4';
  statusText: string;
  breachedGases: GasKey[];
  severity: 'normal' | 'caution' | 'warning' | 'critical';
}

export function checkIEEELimits(gasDict: GasReadings): IEEEValidationResult {
  const breachedC3: GasKey[] = [];
  const breachedC2: GasKey[] = [];

  for (const gas of GAS_NAMES) {
    const val = gasDict[gas] ?? 0;
    if (val > IEEE_CONDITION3_LIMITS[gas]) {
      breachedC3.push(gas);
    } else if (val > IEEE_90TH_LIMITS[gas]) {
      breachedC2.push(gas);
    }
  }

  // Check if Acetylene is severely elevated or TDCG is high
  const tdcg = calculateTDCG(gasDict).tdcg;

  if (gasDict.C2H2 >= 30.0 || tdcg > 4630) {
    return {
      condition: 'Condition 4',
      statusText: 'Condition 4: HAZARD (Imminent Dielectric Breakdown)',
      breachedGases: [...new Set([...breachedC3, ...breachedC2])],
      severity: 'critical',
    };
  }

  if (breachedC3.length > 0) {
    return {
      condition: 'Condition 3',
      statusText: 'Condition 3: CRITICAL (Immediate Load Mitigation Required)',
      breachedGases: [...new Set([...breachedC3, ...breachedC2])],
      severity: 'critical',
    };
  }

  if (breachedC2.length > 0) {
    return {
      condition: 'Condition 2',
      statusText: 'Condition 2: CAUTION (Resample & Investigate)',
      breachedGases: breachedC2,
      severity: 'caution',
    };
  }

  return {
    condition: 'Condition 1',
    statusText: 'Condition 1: NORMAL (Nominal Operational Envelope)',
    breachedGases: [],
    severity: 'normal',
  };
}

export function calculateTDCG(gasDict: GasReadings): { tdcg: number; status: string; condition: number } {
  const tdcg = (gasDict.H2 || 0) +
    (gasDict.CH4 || 0) +
    (gasDict.C2H6 || 0) +
    (gasDict.C2H4 || 0) +
    (gasDict.C2H2 || 0) +
    (gasDict.CO || 0);

  if (tdcg <= 720) {
    return { tdcg, status: 'Normal (≤ 720 ppm)', condition: 1 };
  } else if (tdcg <= 1920) {
    return { tdcg, status: 'Caution (721 – 1920 ppm)', condition: 2 };
  } else if (tdcg <= 4630) {
    return { tdcg, status: 'Warning (1921 – 4630 ppm)', condition: 3 };
  } else {
    return { tdcg, status: 'Hazard / Critical (> 4630 ppm)', condition: 4 };
  }
}

export interface DuvalCoordinates {
  pctCH4: number;
  pctC2H4: number;
  pctC2H2: number;
  zone: string;
  zoneCode: 'PD' | 'T1' | 'T2' | 'T3' | 'D1' | 'D2' | 'DT' | 'Normal';
  isNominal: boolean;
}

export function calculateDuvalCoordinates(ch4: number, c2h4: number, c2h2: number): DuvalCoordinates {
  const total = ch4 + c2h4 + c2h2;
  if (total <= 1e-4) {
    return { pctCH4: 33.33, pctC2H4: 33.33, pctC2H2: 33.33, zone: 'Normal (Within Baseline Limits)', zoneCode: 'Normal', isNominal: true };
  }

  const pctCH4 = (ch4 / total) * 100.0;
  const pctC2H4 = (c2h4 / total) * 100.0;
  const pctC2H2 = (c2h2 / total) * 100.0;

  // In IEEE / IEC practice, if total combustible hydrocarbon sum is nominal baseline (<35 ppm) and acetylene <= 0.4 ppm
  const isNominal = ch4 <= 20.0 && c2h4 <= 20.0 && c2h2 <= 0.4 && total < 35.0;
  if (isNominal) {
    return { pctCH4, pctC2H4, pctC2H2, zone: 'Normal (Within Baseline Limits)', zoneCode: 'Normal', isNominal: true };
  }

  // Duval Triangle 1 standard zoning:
  if (pctCH4 >= 98.0) {
    return { pctCH4, pctC2H4, pctC2H2, zone: 'PD: Partial Discharge', zoneCode: 'PD', isNominal: false };
  } else if (pctC2H2 >= 29.0 || (pctC2H2 >= 13.0 && pctC2H4 >= 23.0)) {
    return { pctCH4, pctC2H4, pctC2H2, zone: 'D2: High-Energy Discharge (Arcing)', zoneCode: 'D2', isNominal: false };
  } else if ((pctC2H2 >= 13.0 && pctC2H4 < 23.0) || (pctC2H2 >= 4.0 && pctC2H4 < 20.0)) {
    return { pctCH4, pctC2H4, pctC2H2, zone: 'D1: Low-Energy Discharge (Sparking)', zoneCode: 'D1', isNominal: false };
  } else if (pctC2H4 >= 50.0) {
    return { pctCH4, pctC2H4, pctC2H2, zone: 'T3: Thermal Fault (>700°C)', zoneCode: 'T3', isNominal: false };
  } else if (pctC2H4 >= 20.0 && pctC2H4 < 50.0 && pctC2H2 < 4.0) {
    return { pctCH4, pctC2H4, pctC2H2, zone: 'T2: Thermal Fault (300°C – 700°C)', zoneCode: 'T2', isNominal: false };
  } else if (pctC2H4 < 20.0 && pctC2H2 < 4.0) {
    return { pctCH4, pctC2H4, pctC2H2, zone: 'T1: Thermal Fault (<300°C)', zoneCode: 'T1', isNominal: false };
  } else {
    return { pctCH4, pctC2H4, pctC2H2, zone: 'DT: Thermal & Electrical Mix', zoneCode: 'DT', isNominal: false };
  }
}

export function checkCelluloseDegradation(co: number, co2: number): { ratio: number; status: string; risk: 'Low' | 'Moderate' | 'High' } {
  const safeCO = Math.max(0.001, co);
  const ratio = co2 / safeCO;

  if (ratio < 3.0 && co > 350.0) {
    return {
      ratio,
      status: 'CRITICAL: Accelerated Paper Insulation Pyrolysis (Risk of Dielectric Breakdown)',
      risk: 'High',
    };
  } else if (ratio < 4.0) {
    return {
      ratio,
      status: 'ELEVATED: Kraft Paper Degradation Underway',
      risk: 'Moderate',
    };
  } else if (ratio > 12.0 && co2 > 2500.0) {
    return {
      ratio,
      status: 'CAUTION: Low-temperature paper heating / Excessive Oil Oxidation',
      risk: 'Moderate',
    };
  } else {
    return {
      ratio,
      status: 'NORMAL: Solid Paper Insulation Aging within Expected Life Curve',
      risk: 'Low',
    };
  }
}

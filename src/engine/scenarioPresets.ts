import { GasReadings, GasKey, GAS_NAMES } from './dgaStandards';

export interface ScenarioInfo {
  id: number;
  key: string;
  code: string;
  name: string;
  shortDesc: string;
  physicalCause: string;
  dominantGas: string;
  expectedDuval: string;
  expectedIEEE: string;
  badgeColor: string;
}

export const SCENARIO_PRESETS: Record<string, ScenarioInfo> = {
  normal: {
    id: 0,
    key: 'normal',
    code: 'NORM',
    name: 'Normal Operation',
    shortDesc: 'Healthy baseline aging, zero electrical or thermal discharges',
    physicalCause: 'Natural slow aging of transformer oil and solid insulation under balanced grid loading.',
    dominantGas: 'Low baseline (all gases < IEEE limits)',
    expectedDuval: 'Normal',
    expectedIEEE: 'Condition 1 (Normal)',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  pd: {
    id: 1,
    key: 'pd',
    code: 'PD',
    name: 'Partial Discharge',
    shortDesc: 'Low-energy corona discharges in gas voids or paper cavities',
    physicalCause: 'Ionization in micro gas bubbles within oil or cavities in oil-impregnated paper under high electric field.',
    dominantGas: 'Hydrogen (H₂) surge (150–450 ppm)',
    expectedDuval: 'PD: Partial Discharge',
    expectedIEEE: 'Condition 2/3 (Caution/Critical)',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  },
  d1: {
    id: 2,
    key: 'd1',
    code: 'D1',
    name: 'Low-Energy Sparking',
    shortDesc: 'Dielectric breakdown, tracking, and pinhole sparking',
    physicalCause: 'Sparking between floating metal parts, defective lead shields, or carbonized paper tracking.',
    dominantGas: 'Acetylene (C₂H₂) emergence (8–16 ppm)',
    expectedDuval: 'D1: Low-Energy Discharge',
    expectedIEEE: 'Condition 3 (Critical)',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  },
  d2: {
    id: 3,
    key: 'd2',
    code: 'D2',
    name: 'High-Energy Arcing',
    shortDesc: 'Catastrophic power arc flashover, turn-to-turn short-circuit',
    physicalCause: 'Heavy power arc between winding turns or phase-to-ground flashover (>1500°C arc core).',
    dominantGas: 'Violent Acetylene (C₂H₂ > 30 ppm) & H₂ surge',
    expectedDuval: 'D2: High-Energy Discharge',
    expectedIEEE: 'Condition 4 (Hazard)',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  t1: {
    id: 4,
    key: 't1',
    code: 'T1',
    name: 'Thermal Fault <300°C',
    shortDesc: 'Low-temperature localized overheating in core bolts or contacts',
    physicalCause: 'Loose connection bolts, stray eddy current loops in core clamps or tank walls at mild temperatures.',
    dominantGas: 'Methane (CH₄ > 180 ppm) & Ethane (C₂H₆)',
    expectedDuval: 'T1: Thermal Fault (<300°C)',
    expectedIEEE: 'Condition 2/3 (Caution/Critical)',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  },
  t2: {
    id: 5,
    key: 't2',
    code: 'T2',
    name: 'Thermal Fault 300°–700°C',
    shortDesc: 'Medium-temperature conductor & winding insulation overheating',
    physicalCause: 'Overheating of winding conductors due to blocked cooling radiators, pump failure, or sustained overloading.',
    dominantGas: 'Ethylene (C₂H₄ 50–150 ppm) & Ethane (C₂H₆)',
    expectedDuval: 'T2: Thermal Fault (300°–700°C)',
    expectedIEEE: 'Condition 2/3 (Caution/Critical)',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  },
  t3: {
    id: 6,
    key: 't3',
    code: 'T3',
    name: 'Thermal Fault >700°C',
    shortDesc: 'High-temperature iron core lamination heating & oil cracking',
    physicalCause: 'Circulating currents in core laminations, shorted core packets, or severe oil carbonization.',
    dominantGas: 'Dominant Ethylene (C₂H₄ > 200 ppm, >50% Duval)',
    expectedDuval: 'T3: Thermal Fault (>700°C)',
    expectedIEEE: 'Condition 3/4 (Critical/Hazard)',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  cellulose: {
    id: 7,
    key: 'cellulose',
    code: 'CELL',
    name: 'Cellulose / Paper Degradation',
    shortDesc: 'Pyrolysis of solid Kraft paper insulation around winding turns',
    physicalCause: 'Accelerated thermal decomposition of cellulose Kraft paper, degrading mechanical Degree of Polymerization (DP).',
    dominantGas: 'Massive Carbon Monoxide (CO > 600 ppm) with CO₂/CO < 3.0',
    expectedDuval: 'Normal / T2',
    expectedIEEE: 'Condition 3 (Critical)',
    badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
  },
  sensor_drift: {
    id: 8,
    key: 'sensor_drift',
    code: 'SENS',
    name: 'Sensor Drift / Transducer Fault',
    shortDesc: 'Isolated single-channel transducer drift without multi-gas correlation',
    physicalCause: 'Optical filter degradation, dirty measurement cell, or calibration drift in the online DGA monitor.',
    dominantGas: 'Isolated erratic H₂ jump with 0 hydrocarbon rise',
    expectedDuval: 'Normal',
    expectedIEEE: 'Condition 2 (Caution)',
    badgeColor: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  },
};

export interface TelemetryPoint extends GasReadings {
  hourIndex: number; // 0 to 23
  hourLabel: string; // "t-23h", "t-22h", ..., "t-0h (Now)"
  tdcg: number;
}

/**
 * Generates an exact 24-hour time-series trajectory matching generate_data.py
 */
export function generateSequence(scenarioKey: string, steps = 24, addNoise = true): TelemetryPoint[] {
  const baseGases: Record<GasKey, number> = {
    H2: 15.0,
    CH4: 12.0,
    C2H6: 8.0,
    C2H4: 10.0,
    C2H2: 0.1,
    CO: 150.0,
    CO2: 850.0,
  };

  const onsetStep = 8;
  const data: TelemetryPoint[] = [];

  for (let t = 0; t < steps; t++) {
    const current: GasReadings = {
      H2: baseGases.H2 + t * 0.04,
      CH4: baseGases.CH4 + t * 0.03,
      C2H6: baseGases.C2H6 + t * 0.02,
      C2H4: baseGases.C2H4 + t * 0.03,
      C2H2: baseGases.C2H2 + t * 0.001,
      CO: baseGases.CO + t * 0.3,
      CO2: baseGases.CO2 + t * 1.2,
    };

    if (t >= onsetStep) {
      const dt = t - onsetStep + 1;
      const growth = Math.pow(dt, 1.35);

      switch (scenarioKey) {
        case 'pd':
          current.H2 += growth * 15.0;
          current.CH4 += growth * 3.0;
          current.C2H4 = Math.max(0.5, current.C2H4 * 0.15);
          current.C2H2 = 0.05;
          break;

        case 'd1':
          current.H2 += growth * 7.0;
          current.CH4 += growth * 1.8;
          current.C2H4 += growth * 0.4;
          current.C2H2 += growth * 0.8;
          break;

        case 'd2':
          current.H2 += growth * 18.0;
          current.CH4 += growth * 2.5;
          current.C2H4 += growth * 3.5;
          current.C2H2 += growth * 5.5;
          current.CO += growth * 3.0;
          break;

        case 't1':
          current.CH4 += growth * 12.0;
          current.C2H6 += growth * 9.0;
          current.C2H4 += growth * 0.8;
          current.C2H2 = 0.1;
          break;

        case 't2':
          current.CH4 += growth * 5.0;
          current.C2H6 += growth * 4.0;
          current.C2H4 += growth * 5.0;
          current.C2H2 = 0.2;
          break;

        case 't3':
          current.H2 += growth * 3.0;
          current.CH4 += growth * 4.0;
          current.C2H6 += growth * 2.0;
          current.C2H4 += growth * 18.0;
          current.C2H2 += growth * 0.25;
          break;

        case 'cellulose':
          current.H2 += growth * 1.5;
          current.CO += growth * 55.0;
          current.CO2 += growth * 90.0;
          break;

        case 'sensor_drift':
          current.H2 += growth * 14.0 + (addNoise ? (Math.random() - 0.5) * 16.0 : 0);
          break;

        case 'normal':
        default:
          break;
      }
    }

    // Apply realistic noise
    const noisy: GasReadings = { ...current };
    if (addNoise) {
      for (const gas of GAS_NAMES) {
        const noiseFactor = 1.0 + (Math.random() - 0.5) * 0.04;
        noisy[gas] = Math.max(0.01, Number((current[gas] * noiseFactor).toFixed(2)));
      }
    }

    const tdcg = Number((noisy.H2 + noisy.CH4 + noisy.C2H6 + noisy.C2H4 + noisy.C2H2 + noisy.CO).toFixed(1));
    const hFromNow = steps - 1 - t;
    const hourLabel = hFromNow === 0 ? 't-0h (Now)' : `t-${hFromNow}h`;

    data.push({
      ...noisy,
      hourIndex: t,
      hourLabel,
      tdcg,
    });
  }

  return data;
}

/**
 * Builds a dynamic 24-hour sequence drifting up to the target gas values
 */
export function generateCustomSequence(targetGases: GasReadings, steps = 24, addNoise = true): TelemetryPoint[] {
  const baseGases: GasReadings = {
    H2: targetGases.H2 * 0.2,
    CH4: targetGases.CH4 * 0.2,
    C2H6: targetGases.C2H6 * 0.2,
    C2H4: targetGases.C2H4 * 0.2,
    C2H2: targetGases.C2H2 * 0.1,
    CO: targetGases.CO * 0.4,
    CO2: targetGases.CO2 * 0.6,
  };

  const data: TelemetryPoint[] = [];

  for (let t = 0; t < steps; t++) {
    const alpha = t / (steps - 1);
    const current: GasReadings = { ...baseGases };

    for (const gas of GAS_NAMES) {
      const val = baseGases[gas] * (1 - alpha) + targetGases[gas] * alpha;
      const noise = addNoise ? 1.0 + (Math.random() - 0.5) * 0.03 : 1.0;
      current[gas] = Math.max(0.01, Number((val * noise).toFixed(2)));
    }

    const tdcg = Number((current.H2 + current.CH4 + current.C2H6 + current.C2H4 + current.C2H2 + current.CO).toFixed(1));
    const hFromNow = steps - 1 - t;
    const hourLabel = hFromNow === 0 ? 't-0h (Now)' : `t-${hFromNow}h`;

    data.push({
      ...current,
      hourIndex: t,
      hourLabel,
      tdcg,
    });
  }

  return data;
}

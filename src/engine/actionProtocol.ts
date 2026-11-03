/**
 * Substation Automated Action and Mitigation Protocol Engine.
 * Maps AI diagnosis and standard DGA classifications to immediate
 * substation operational commands, electrical dispatch actions,
 * and field maintenance orders.
 */

export interface ActionProtocol {
  severity: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical' | 'advisory';
  color: string;
  scadaCommands: string[];
  fieldTesting: string[];
  operationalActions: string[];
  affectedSubsystem: 'windings' | 'oltc' | 'bushings' | 'core' | 'paper' | 'cooling' | 'sensor' | 'nominal';
  subsystemLabel: string;
}

export const ACTION_RULES: Record<string, ActionProtocol> = {
  'D2: High-Energy Discharge (Arcing)': {
    severity: 'CRITICAL (Priority 1 — Immediate Intervention)',
    severityLevel: 'critical',
    color: '#e11d48', // rose-600
    affectedSubsystem: 'windings',
    subsystemLabel: 'High-Voltage Windings & Turn-to-Turn Dielectric',
    scadaCommands: [
      'SCADA command: GGIO.TripInterlock (Armed for automated trip)',
      'SCADA command: SIML.CriticalAlarm (Dispatched to Energy Management System)',
      'Substation command: Inhibit OLTC motorized tap switching immediately',
      'Grid Command: Auto-shed / transfer 35%–50% transformer active load',
    ],
    fieldTesting: [
      'Extract urgent oil sample within 4h for Laboratory Gas Chromatography (GC)',
      'Sweep Frequency Response Analysis (SFRA) to check winding deformation',
      'Breakdown Voltage (BDV) ASTM D877 dielectric oil test',
    ],
    operationalActions: [
      'URGENT: Initiate automated load transfer or curtailment by 35%–50% to prevent explosive tank rupture.',
      'Dispatch emergency substation crew to inspect Buchholz gas relay accumulation and pressure relief valve (PRV).',
      'Conduct an immediate infrared thermography check on HV bushing terminations and tank neutral grounding.',
    ],
  },

  'D1: Low-Energy Discharge (Sparking)': {
    severity: 'HIGH (Priority 2 — Active Electrical Degradation)',
    severityLevel: 'high',
    color: '#f97316', // orange-500
    affectedSubsystem: 'oltc',
    subsystemLabel: 'On-Load Tap Changer (OLTC) Diverter & Leads',
    scadaCommands: [
      'SCADA command: SIML.HighAlarm (Telemetry poll escalated to 15-min cycles)',
      'Substation command: Restrict OLTC operations to manual supervision only',
      'SCADA command: Enable acoustic partial discharge telemetry channel',
    ],
    fieldTesting: [
      'Perform UHF / Acoustic emission partial discharge triangulation scan',
      'Inspect OLTC diverter switch contacts and transition resistors',
      'Measure oil dielectric dissipation factor (tan delta) and resistivity',
    ],
    operationalActions: [
      'Increase online DGA telemetry polling frequency to 15-minute cycles.',
      'Prepare backup mobile substation or switchgear redundancy in case of progressive breakdown.',
      'Inspect On-Load Tap Changer (OLTC) diverter switch contacts for carbon tracking.',
    ],
  },

  'PD: Partial Discharge': {
    severity: 'MEDIUM-HIGH (Priority 3 — Incipient Electrical Void)',
    severityLevel: 'medium',
    color: '#eab308', // yellow-500
    affectedSubsystem: 'bushings',
    subsystemLabel: 'HV Bushings & Oil-Impregnated Insulation Voids',
    scadaCommands: [
      'SCADA command: SIML.Warning (Trigger continuous H2 monitoring)',
      'SCADA command: Log bushing tap sensor capacitance and power factor',
    ],
    fieldTesting: [
      'Bushing C1/C2 capacitance & power factor (tan delta) testing',
      'UHF partial discharge acoustic scan across perimeter of tank',
      'Karl Fischer titration (ASTM D1533) for dissolved water content',
    ],
    operationalActions: [
      'Verify bushing tap capacitance and power factor (tan delta) measurements.',
      'Perform UHF / acoustic emission partial discharge scan across tank perimeter.',
      'Schedule vacuum oil degasification if micro-bubble formation is suspected.',
    ],
  },

  'T3: Thermal Fault (>700°C)': {
    severity: 'CRITICAL (Priority 1 — Severe Overheating)',
    severityLevel: 'critical',
    color: '#e11d48', // rose-600
    affectedSubsystem: 'core',
    subsystemLabel: 'Magnetic Core Laminations & Tank Shunts',
    scadaCommands: [
      'SCADA command: Force-engage all auxiliary cooling banks (Fans & Pumps)',
      'SCADA command: Inhibit cyclic overload dispatch on Energy Management System',
      'SCADA command: GGIO.OverheatAlarm (Top-Oil / Winding Temp supervision)',
    ],
    fieldTesting: [
      'Forward-Looking Infrared (FLIR) thermography on tank walls & bushings',
      'Core grounding strap current measurement (check for circulating loops)',
      'Dissolved gas rate-of-generation trending every 6 hours',
    ],
    operationalActions: [
      'Inspect forced-oil cooling pumps (OFAF/ODAF) and radiator fan motor relays for mechanical failure.',
      'Reduce peak operating load immediately; avoid cyclic overloading during high ambient temperatures.',
      'Perform forward-looking infrared (FLIR) thermography on high-voltage bushings, terminations, and tank surfaces.',
    ],
  },

  'T2: Thermal Fault (300°C – 700°C)': {
    severity: 'HIGH (Priority 2 — Conductor Overheating)',
    severityLevel: 'high',
    color: '#f97316', // orange-500
    affectedSubsystem: 'cooling',
    subsystemLabel: 'Winding Conductor & Forced-Cooling Radiator Banks',
    scadaCommands: [
      'SCADA command: Start auxiliary cooling radiator fan banks manually',
      'SCADA command: SIML.ElevatedThermalTrend alert',
    ],
    fieldTesting: [
      'Verify calibration of WTI (Winding Temp) and OTI (Oil Temp) probes',
      'Inspect radiator banks for sludge blockage or restricted oil valves',
    ],
    operationalActions: [
      'Verify ambient temperature vs winding temperature indicator (WTI) and top-oil indicator (OTI) calibration.',
      'Inspect radiator banks for silt blockage or oil flow restriction.',
      'Engage auxiliary cooling banks manually via SCADA control overrides.',
    ],
  },

  'T1: Thermal Fault (<300°C)': {
    severity: 'MEDIUM (Priority 4 — Low-Temperature Hotspot)',
    severityLevel: 'medium',
    color: '#06b6d4', // cyan-500
    affectedSubsystem: 'core',
    subsystemLabel: 'Core Ground Straps & Bolted Connections',
    scadaCommands: [
      'SCADA command: SIML.ThermalWatch advisory',
      'SCADA command: Log hourly telemetry correlation with load profile',
    ],
    fieldTesting: [
      'Check core grounding strap resistance and verify single-point ground',
      'Inspect external bolted terminals and CT secondary connections',
    ],
    operationalActions: [
      'Check external lead bolted connections and current transformer (CT) terminals.',
      'Verify tightness of core grounding strap and inspect for accidental multiple grounding points.',
      'Continue regular automated DGA telemetry surveillance.',
    ],
  },

  'Cellulose / Paper Degradation': {
    severity: 'HIGH (Priority 2 — Irreversible Solid Insulation Loss)',
    severityLevel: 'high',
    color: '#ec4899', // pink-500
    affectedSubsystem: 'paper',
    subsystemLabel: 'Kraft Paper Layer Winding Turn Insulation',
    scadaCommands: [
      'SCADA command: SIML.CellulosePyrolysisAlarm',
      'SCADA command: Calculate aging rate factor based on IEC 60076-7',
    ],
    fieldTesting: [
      'High-Performance Liquid Chromatography (HPLC) for 2-Furfuraldehyde (2-FAL)',
      'Estimate Remaining Degree of Polymerization (DP) (Critical if DP < 250)',
      'Karl Fischer titration (ASTM D1533) to measure paper moisture %',
    ],
    operationalActions: [
      'Perform High-Performance Liquid Chromatography (HPLC) for 2-Furfuraldehyde (2-FAL) furan analysis.',
      'Estimate remaining Degree of Polymerization (DP) of winding paper insulation (critical if DP < 250).',
      'Plan offline dry-out or online molecular sieve oil dehydration treatment.',
    ],
  },

  'Sensor Drift / Transducer Anomaly': {
    severity: 'ADVISORY (Priority 5 — Instrument Verification Alert)',
    severityLevel: 'advisory',
    color: '#64748b', // slate-500
    affectedSubsystem: 'sensor',
    subsystemLabel: 'Photoacoustic Spectroscopy (PAS) Sensor Manifold',
    scadaCommands: [
      'SCADA command: SIML.TransducerIntegrityFault (Self-diagnostics)',
      'SCADA command: Flag telemetry channel as unvalidated / drifting',
    ],
    fieldTesting: [
      'Photoacoustic spectroscopy (PAS) optical filter calibration',
      'Perform zero-point and span calibration on gas extraction chamber',
      'Take syringe oil sample for laboratory gas chromatography comparison',
    ],
    operationalActions: [
      'Instrument validation alert: single-channel gas anomaly without physical multi-gas thermodynamic correlation.',
      'Inspect photoacoustic spectroscopy (PAS) cell optical filters or electrochemical sensor membrane for drift.',
      'Compare online telemetry readings against manual syringe oil sample analyzed via laboratory GC.',
    ],
  },

  'Normal': {
    severity: 'LOW (Nominal Operation — Asset Operating Safely)',
    severityLevel: 'low',
    color: '#10b981', // emerald-500
    affectedSubsystem: 'nominal',
    subsystemLabel: 'All Transformer Subsystems Within Health Envelope',
    scadaCommands: [
      'SCADA status: SIML.Normal (All channels healthy)',
      'Telemetry logging: Standard 24-hour continuous buffer',
    ],
    fieldTesting: [
      'Annual routine oil dielectric breakdown & moisture test',
      'Semi-annual thermography scan of substation switchyard',
    ],
    operationalActions: [
      'Transformer asset is operating within nominal IEEE/IEC thermal and dielectric envelopes.',
      'Maintain standard continuous 24-hour telemetry logging.',
      'Next routine scheduled oil sampling per annual preventative maintenance matrix.',
    ],
  },
};

export function getActionProtocol(diagnosticKey: string): ActionProtocol {
  if (ACTION_RULES[diagnosticKey]) {
    return ACTION_RULES[diagnosticKey];
  }

  for (const [key, val] of Object.entries(ACTION_RULES)) {
    if (diagnosticKey.includes(key.split(':')[0].trim())) {
      return val;
    }
    if (diagnosticKey.includes('Arcing') && key.includes('Arcing')) return val;
    if (diagnosticKey.includes('Thermal') && key.includes('Thermal')) return val;
    if (diagnosticKey.includes('Cellulose') && key.includes('Cellulose')) return val;
    if (diagnosticKey.includes('Sensor') && key.includes('Sensor')) return val;
  }

  return ACTION_RULES['Normal'];
}

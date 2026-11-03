import React, { useState, useEffect, useMemo } from 'react';
import { TopExecutiveBar } from './components/TopExecutiveBar';
import { GasControlSliders } from './components/GasControlSliders';
import { TransformerTwinSVG } from './components/TransformerTwinSVG';
import { DuvalTrianglePlot } from './components/DuvalTrianglePlot';
import { TelemetryChart24h } from './components/TelemetryChart24h';
import { CnnConfidenceCard } from './components/CnnConfidenceCard';
import { ActionDispatchCard } from './components/ActionDispatchCard';

import {
  GasReadings,
  GasKey,
  GAS_NAMES,
  checkIEEELimits,
  calculateTDCG,
  calculateDuvalCoordinates,
  checkCelluloseDegradation,
} from './engine/dgaStandards';
import {
  generateSequence,
  generateCustomSequence,
  TelemetryPoint,
} from './engine/scenarioPresets';
import { predict1DCNN, DiagnosticInference } from './engine/cnnInference';
import { getActionProtocol } from './engine/actionProtocol';

export const App: React.FC = () => {
  // --- Simulation & Scenario State ---
  const [currentScenario, setCurrentScenario] = useState<string>('normal');
  const [playbackHour, setPlaybackHour] = useState<number>(23); // 0 to 23 (23 = Now)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [noiseEnabled, setNoiseEnabled] = useState<boolean>(true);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Full 24-hour sequence buffer
  const [fullSequence, setFullSequence] = useState<TelemetryPoint[]>(() =>
    generateSequence('normal', 24, true)
  );

  // Current gas readings at active playback point
  const currentGases: GasReadings = useMemo(() => {
    const pt = fullSequence[playbackHour] || fullSequence[fullSequence.length - 1];
    return {
      H2: pt.H2,
      CH4: pt.CH4,
      C2H6: pt.C2H6,
      C2H4: pt.C2H4,
      C2H2: pt.C2H2,
      CO: pt.CO,
      CO2: pt.CO2,
    };
  }, [fullSequence, playbackHour]);

  // Rates of change (ppm/24h) between t=0 and t=23
  const ratesOfChange: Record<GasKey, number> = useMemo(() => {
    const first = fullSequence[0];
    const last = fullSequence[playbackHour] || fullSequence[fullSequence.length - 1];
    const rates = {} as Record<GasKey, number>;
    for (const gas of GAS_NAMES) {
      rates[gas] = Number((last[gas] - first[gas]).toFixed(1));
    }
    return rates;
  }, [fullSequence, playbackHour]);

  // --- Real-Time Analytics & Decision Fusion (< 16ms) ---
  // 1. AI 1D-CNN Inference
  const cnnInference: DiagnosticInference = useMemo(() => {
    // Slice up to playback hour and pad to 24 if needed
    const seqSlice: GasReadings[] = [];
    for (let i = 0; i < 24; i++) {
      const idx = Math.min(i, playbackHour);
      seqSlice.push(fullSequence[idx]);
    }
    return predict1DCNN(seqSlice);
  }, [fullSequence, playbackHour]);

  // 2. Standards Validation
  const ieeeStatus = useMemo(() => checkIEEELimits(currentGases), [currentGases]);
  const tdcgResult = useMemo(() => calculateTDCG(currentGases), [currentGases]);
  const duvalCoords = useMemo(
    () => calculateDuvalCoordinates(currentGases.CH4, currentGases.C2H4, currentGases.C2H2),
    [currentGases]
  );
  const celluloseResult = useMemo(
    () => checkCelluloseDegradation(currentGases.CO, currentGases.CO2),
    [currentGases]
  );

  // 3. Action Protocol Arbitrator
  const actionProtocol = useMemo(() => {
    const diagnosticKey =
      duvalCoords.zoneCode !== 'Normal'
        ? duvalCoords.zone
        : celluloseResult.status.includes('CRITICAL')
        ? 'Cellulose / Paper Degradation'
        : cnnInference.classCode === 'SENS'
        ? 'Sensor Drift / Transducer Anomaly'
        : 'Normal';
    return getActionProtocol(diagnosticKey);
  }, [duvalCoords, celluloseResult, cnnInference]);

  // 4. Asset Composite Health Index (0 - 100%)
  const assetHealthPct = useMemo(() => {
    let health = 100;
    if (ieeeStatus.condition === 'Condition 2') health -= 20;
    if (ieeeStatus.condition === 'Condition 3') health -= 45;
    if (ieeeStatus.condition === 'Condition 4') health -= 65;
    if (currentGases.C2H2 >= 1.0) health -= 20;
    if (celluloseResult.risk === 'High') health -= 25;
    if (tdcgResult.condition >= 3) health -= 15;
    return Math.max(12, Math.min(100, health));
  }, [ieeeStatus, currentGases.C2H2, celluloseResult.risk, tdcgResult.condition]);

  // --- Handlers & Scenario Switching ---
  const handleSelectScenario = (key: string) => {
    setCurrentScenario(key);
    setIsCustomMode(false);
    setPlaybackHour(23); // Jump to current hour
    setIsPlaying(false);
    const newSeq = generateSequence(key, 24, noiseEnabled);
    setFullSequence(newSeq);
  };

  const handleCustomGasChange = (gas: GasKey, value: number) => {
    setIsCustomMode(true);
    setIsPlaying(false);
    const updatedTarget: GasReadings = {
      ...currentGases,
      [gas]: value,
    };
    const newSeq = generateCustomSequence(updatedTarget, 24, noiseEnabled);
    setFullSequence(newSeq);
    setPlaybackHour(23);
  };

  const handleResetNominal = () => {
    handleSelectScenario('normal');
  };

  const handleToggleNoise = () => {
    setNoiseEnabled(!noiseEnabled);
    if (!isCustomMode) {
      setFullSequence(generateSequence(currentScenario, 24, !noiseEnabled));
    }
  };

  // --- 24-Hour Telemetry Playback Engine ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackHour((prev) => {
          if (prev >= 23) {
            setIsPlaying(false);
            return 23;
          }
          return prev + 1;
        });
      }, 450); // Advance 1 hour every 450ms
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (playbackHour >= 23) {
      setPlaybackHour(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleResetTimeline = () => {
    setIsPlaying(false);
    setPlaybackHour(23);
  };

  return (
    <div className="min-h-screen bg-scada-bg text-slate-100 flex flex-col font-sans">
      {/* Zone A: Top Executive & Asset Telemetry Bar */}
      <TopExecutiveBar
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onReset={handleResetTimeline}
        playbackHour={playbackHour}
        ieeeStatus={ieeeStatus}
        tdcg={tdcgResult.tdcg}
        celluloseRatio={celluloseResult.ratio}
        paperRisk={celluloseResult.risk}
        activeZoneCode={duvalCoords.zoneCode}
        assetHealthPct={assetHealthPct}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Zone B: Left Gas Injection & Telemetry Control Sidebar */}
        <GasControlSliders
          currentGases={currentGases}
          ratesOfChange={ratesOfChange}
          onChangeGas={handleCustomGasChange}
          onResetNominal={handleResetNominal}
          noiseEnabled={noiseEnabled}
          onToggleNoise={handleToggleNoise}
          isSimulatingFault={!isCustomMode && currentScenario !== 'normal'}
        />

        {/* Center & Right Visual Workspace (Zones C & D) */}
        <main className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto max-w-[1920px]">
          {/* Top Visual Grid: Transformer Cutaway + Duval Triangle 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Zone C.1: 2D Transformer Cutaway Schematic */}
            <TransformerTwinSVG
              actionProtocol={actionProtocol}
              aiClassCode={cnnInference.classCode}
              duvalZoneCode={duvalCoords.zoneCode}
              isArcing={cnnInference.classCode === 'D2' || currentGases.C2H2 >= 5.0}
              isOverheating={cnnInference.classCode.startsWith('T') || currentGases.C2H4 >= 70}
            />

            {/* Zone C.3: Interactive Duval Triangle 1 Ternary Plot */}
            <DuvalTrianglePlot
              currentDuval={duvalCoords}
              trajectory={fullSequence.slice(0, playbackHour + 1)}
            />
          </div>

          {/* Middle: Zone C.2: 24-Hour Multi-Gas Time-Series Telemetry Waveform */}
          <TelemetryChart24h
            telemetryData={fullSequence.slice(0, playbackHour + 1)}
          />

          {/* Bottom Grid: Zone D: Hybrid AI + Regulatory Decision Fusion */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Zone D.1: 1D-CNN Inference & 9-Class Probability Bar Chart */}
            <CnnConfidenceCard inference={cnnInference} />

            {/* Zone D.2: Automated Substation Action Engine & Regulatory Standards */}
            <ActionDispatchCard
              actionProtocol={actionProtocol}
              ieeeStatus={ieeeStatus}
              duvalCoords={duvalCoords}
              celluloseStatus={celluloseResult.status}
              celluloseRisk={celluloseResult.risk}
              celluloseRatio={celluloseResult.ratio}
            />
          </div>

          {/* Substation Footer */}
          <footer className="text-center text-xs font-mono text-slate-500 py-4 border-t border-slate-900 mt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              ⚡ <strong>Substation Digital Twin v2.0</strong> &bull; IEEE C57.104-2019 / IEC 60599 &bull; PyTorch 1D-CNN AI Core
            </div>
            <div className="text-slate-600">
              Zero-Latency Client-Side Engine &bull; Ready for Vercel Deployment
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;

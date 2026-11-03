import React, { useState, useEffect, useMemo } from 'react';
import { TopExecutiveBar } from './components/TopExecutiveBar';
import { GasControlSliders } from './components/GasControlSliders';
import { DuvalTrianglePlot } from './components/DuvalTrianglePlot';
import { TelemetryChart24h } from './components/TelemetryChart24h';
import { CnnConfidenceCard } from './components/CnnConfidenceCard';
import { ActionDispatchCard } from './components/ActionDispatchCard';

import {
  GasReadings,
  GasKey,
  GAS_NAMES,
  calculateTDCG,
  calculateDuvalCoordinates,
  checkCelluloseDegradation,
} from './engine/dgaStandards';
import {
  generateSequence,
  generateCustomSequence,
  TelemetryPoint,
} from './engine/scenarioPresets';
import { predict1DCNN, predictFallbackInference, DiagnosticInference } from './engine/cnnInference';
import { getActionProtocol } from './engine/actionProtocol';

export const App: React.FC = () => {
  // --- Simulation & Scenario State ---
  const [currentScenario, setCurrentScenario] = useState<string>('normal');
  const [playbackHour, setPlaybackHour] = useState<number>(23); // 0 to 23 (23 = Now)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [noiseEnabled, setNoiseEnabled] = useState<boolean>(false);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // --- Theme State (Defaults to Dark Mode, remembers preference) ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {
      // ignore in environments without localStorage
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Full 24-hour sequence buffer
  const [fullSequence, setFullSequence] = useState<TelemetryPoint[]>(() =>
    generateSequence('normal', 24, false)
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
  // 1. AI 1D-CNN Inference (Decoupled Hugging Face Space Gradio API with instant local fallback)
  const [cnnInference, setCnnInference] = useState<DiagnosticInference>(() =>
    predictFallbackInference(fullSequence.slice(0, 24))
  );

  useEffect(() => {
    let isMounted = true;
    const seqSlice: GasReadings[] = [];
    for (let i = 0; i < 24; i++) {
      const idx = Math.min(i, playbackHour);
      seqSlice.push(fullSequence[idx]);
    }

    // Instantly update with local heuristic for 60 FPS slider reactivity
    const heuristic = predictFallbackInference(seqSlice);
    setCnnInference(heuristic);

    // Concurrently fetch deep learning inference from Hugging Face Space Gradio API
    predict1DCNN(seqSlice)
      .then((res) => {
        if (isMounted) {
          setCnnInference(res);
        }
      })
      .catch((err) => {
        console.warn('HF Gradio API query error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [fullSequence, playbackHour]);

  // 2. Standards Validation
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

  // --- Handlers & Scenario Switching ---
  const handleSelectScenario = (key: string) => {
    setCurrentScenario(key);
    setIsCustomMode(false);
    setPlaybackHour(23);
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
      }, 450);
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
      {/* Top Header & Scenario Selector (Clean, Minimal, No Blinking) */}
      <TopExecutiveBar
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onReset={handleResetTimeline}
        playbackHour={playbackHour}
        tdcg={tdcgResult.tdcg}
        celluloseRatio={celluloseResult.ratio}
        paperRisk={celluloseResult.risk}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Gas Injection & Telemetry Control Sidebar */}
        <GasControlSliders
          currentGases={currentGases}
          ratesOfChange={ratesOfChange}
          onChangeGas={handleCustomGasChange}
          onResetNominal={handleResetNominal}
          noiseEnabled={noiseEnabled}
          onToggleNoise={handleToggleNoise}
          isSimulatingFault={!isCustomMode && currentScenario !== 'normal'}
        />

        {/* User-Centric 2x2 Dashboard Grid beside Sidebar */}
        <main className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto max-w-[1920px]">
          {/* 2x2 Matrix:
              [1, 1] Gas Charts                | [1, 2] AI Engine Suggested Actions
              [2, 1] 1D-CNN Probability Chart  | [2, 2] Duval Triangle 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 items-stretch">
            {/* Cell (1, 1): 24-Hour Multi-Gas Telemetry Chart */}
            <div className="flex flex-col min-h-0">
              <TelemetryChart24h
                telemetryData={fullSequence.slice(0, playbackHour + 1)}
              />
            </div>

            {/* Cell (1, 2): Suggested Actions & Mitigations */}
            <div className="flex flex-col min-h-0">
              <ActionDispatchCard
                actionProtocol={actionProtocol}
              />
            </div>

            {/* Cell (2, 1): 1D-CNN Deep Learning Probability Chart */}
            <div className="flex flex-col min-h-0">
              <CnnConfidenceCard inference={cnnInference} />
            </div>

            {/* Cell (2, 2): Duval Triangle 1 Diagnostics */}
            <div className="flex flex-col min-h-0">
              <DuvalTrianglePlot currentDuval={duvalCoords} />
            </div>
          </div>

          {/* Substation Footer */}
          <footer className="text-center text-[11px] font-mono text-slate-500 py-1 border-t border-slate-200 dark:border-slate-900 mt-0.5 flex flex-col sm:flex-row items-center justify-center">
            <div>
              ⚡ <strong>Substation Digital Twin v2.0</strong> &bull; IEEE C57.104-2019 / IEC 60599 &bull; 1D-CNN Diagnostic Engine
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;

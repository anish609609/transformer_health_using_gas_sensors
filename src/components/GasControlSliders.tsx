import React from 'react';
import { Sliders, RefreshCw, Radio, Sparkles, AlertCircle } from 'lucide-react';
import { GasReadings, GasKey, GAS_NAMES, GAS_METADATA } from '../engine/dgaStandards';

interface GasControlSlidersProps {
  currentGases: GasReadings;
  ratesOfChange: Record<GasKey, number>; // ppm/24h
  onChangeGas: (gas: GasKey, value: number) => void;
  onResetNominal: () => void;
  noiseEnabled: boolean;
  onToggleNoise: () => void;
  isSimulatingFault: boolean;
}

const GAS_SLIDER_RANGES: Record<GasKey, { min: number; max: number; step: number }> = {
  H2: { min: 0, max: 2000, step: 5 },
  CH4: { min: 0, max: 1500, step: 5 },
  C2H6: { min: 0, max: 1000, step: 2 },
  C2H4: { min: 0, max: 1500, step: 5 },
  C2H2: { min: 0, max: 500, step: 0.2 },
  CO: { min: 0, max: 2000, step: 10 },
  CO2: { min: 0, max: 10000, step: 50 },
};

export const GasControlSliders: React.FC<GasControlSlidersProps> = ({
  currentGases,
  ratesOfChange,
  onChangeGas,
  onResetNominal,
  noiseEnabled,
  onToggleNoise,
  isSimulatingFault,
}) => {
  return (
    <aside className="w-full lg:w-80 xl:w-88 shrink-0 bg-scada-panel/90 border-r border-scada-border p-3 flex flex-col gap-2.5 overflow-y-auto">
      {/* Header & Quick Action Buttons */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Telemetry Gas Injection
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleNoise}
            title={noiseEnabled ? 'Sensor Noise: Enabled' : 'Sensor Noise: Disabled'}
            className={`p-1.5 rounded text-xs transition border flex items-center gap-1 font-mono ${
              noiseEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span className="text-[10px]">Noise</span>
          </button>

          <button
            onClick={onResetNominal}
            title="Reset All Gas Concentrations to Nominal Baseline"
            className="p-1.5 rounded text-xs transition bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center gap-1 font-mono"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="text-[10px]">Reset</span>
          </button>
        </div>
      </div>

      {isSimulatingFault && (
        <div className="px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Preset scenario active. Modifying sliders overrides telemetry with custom injection.</span>
        </div>
      )}

      {/* 7 Gas Control Sliders */}
      <div className="flex flex-col gap-2">
        {GAS_NAMES.map((gasKey: GasKey) => {
          const meta = GAS_METADATA[gasKey];
          const range = GAS_SLIDER_RANGES[gasKey];
          const val = currentGases[gasKey] ?? 0;
          const rate = ratesOfChange[gasKey] ?? 0;
          const isBreached = val > meta.limit;
          const isCriticalC2H2 = gasKey === 'C2H2' && val >= 1.0;

          // Percentage of slider range for visual fill
          const pctFill = Math.min(100, Math.max(0, (val / range.max) * 100));

          return (
            <div
              key={gasKey}
              className={`p-2 rounded-lg border transition-all ${
                isCriticalC2H2
                  ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-500/50'
                  : isBreached
                  ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/15 dark:border-amber-500/40'
                  : 'bg-white border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Gas Label & Value Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {meta.chemical}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {meta.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Rate of Change badge */}
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      rate > 5
                        ? 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-950/50'
                        : rate > 1
                        ? 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/50'
                        : 'text-slate-500 dark:text-slate-500'
                    }`}
                    title="24-hour rate of generation"
                  >
                    {rate >= 0 ? `+${rate.toFixed(1)}` : rate.toFixed(1)}/24h
                  </span>

                  {/* Current ppm value */}
                  <span
                    className={`font-mono text-xs font-bold ${
                      isCriticalC2H2
                        ? 'text-rose-600 dark:text-rose-400'
                        : isBreached
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-cyan-600 dark:text-cyan-400'
                    }`}
                  >
                    {val.toFixed(gasKey === 'C2H2' ? 1 : 0)}{' '}
                    <span className="text-[10px] text-slate-500 font-normal">ppm</span>
                  </span>
                </div>
              </div>

              {/* Slider Input with Custom Track */}
              <div className="relative flex items-center my-1">
                <input
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={val}
                  onChange={(e) => onChangeGas(gasKey, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition"
                  style={{
                    background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${pctFill}%, var(--slider-track, #1e293b) ${pctFill}%, var(--slider-track, #1e293b) 100%)`,
                  }}
                />
              </div>

              {/* Threshold Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                <div className="flex items-center gap-1">
                  <span>IEEE 90th:</span>
                  <span className={isBreached ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
                    {meta.limit} ppm
                  </span>
                </div>

                {isBreached && (
                  <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                    <AlertCircle className="w-2.5 h-2.5" />
                    +{(((val - meta.limit) / meta.limit) * 100).toFixed(0)}% OVER
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

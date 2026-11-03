import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  DollarSign, 
  Flame, 
  Zap, 
  FileText 
} from 'lucide-react';
import { SCENARIO_PRESETS, ScenarioInfo } from '../engine/scenarioPresets';
import { IEEEValidationResult } from '../engine/dgaStandards';

interface TopExecutiveBarProps {
  currentScenario: string;
  onSelectScenario: (scenarioKey: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  playbackHour: number; // 0 to 23
  ieeeStatus: IEEEValidationResult;
  tdcg: number;
  celluloseRatio: number;
  paperRisk: 'Low' | 'Moderate' | 'High';
  activeZoneCode: string;
  assetHealthPct: number;
}

export const TopExecutiveBar: React.FC<TopExecutiveBarProps> = ({
  currentScenario,
  onSelectScenario,
  isPlaying,
  onTogglePlay,
  onReset,
  playbackHour,
  ieeeStatus,
  tdcg,
  celluloseRatio,
  paperRisk,
  activeZoneCode,
  assetHealthPct,
}) => {
  const scenariosList = Object.values(SCENARIO_PRESETS);

  // Condition Badge styling
  const conditionColorMap = {
    'Condition 1': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    'Condition 2': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    'Condition 3': 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    'Condition 4': 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
  };

  return (
    <header className="border-b border-scada-border bg-scada-bg/95 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      {/* Top Asset & Live Ticker Row */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-3 border-b border-slate-800/80">
        
        {/* Asset Identity & IEC 61850 Link */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Zap className="w-6 h-6 animate-pulse text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-wider font-mono text-white flex items-center gap-2">
                TX-400kV-BAY-04
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  315 MVA ONAF
                </span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                IEC 61850 SIML ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              400/220 kV Bulk Transmission Grid Substation &bull; Photoacoustic Spectroscopy (PAS) Telemetry
            </p>
          </div>
        </div>

        {/* Executive ROI & Risk Ticker Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Asset Value Protected */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <div className="p-1 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Asset Protected</div>
              <div className="text-xs sm:text-sm font-bold text-white font-mono">$4,500,000</div>
            </div>
          </div>

          {/* Asset Health Index */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <div className={`p-1 rounded border ${assetHealthPct > 70 ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400' : 'bg-rose-950 border-rose-500/40 text-rose-400'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Health Index</div>
              <div className={`text-xs sm:text-sm font-bold font-mono ${assetHealthPct > 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {assetHealthPct}% {assetHealthPct > 70 ? 'NORMAL' : 'ALARM'}
              </div>
            </div>
          </div>

          {/* IEEE C57.104 Condition */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <div className="p-1 rounded bg-amber-950 border border-amber-500/40 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">IEEE &bull; Duval</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[11px] font-bold font-mono px-1.5 py-0.2 rounded border ${conditionColorMap[ieeeStatus.condition]}`}>
                  {ieeeStatus.condition.split(' ')[1] || ieeeStatus.condition}
                </span>
                <span className="text-[11px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                  {activeZoneCode}
                </span>
              </div>
            </div>
          </div>

          {/* TDCG Score */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <div className="p-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">TDCG Combustible</div>
              <div className="text-xs sm:text-sm font-bold text-cyan-300 font-mono">
                {tdcg.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">ppm</span>
              </div>
            </div>
          </div>

          {/* Cellulose Paper Ratio */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <div className="p-1 rounded bg-pink-950 border border-pink-500/40 text-pink-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">CO₂/CO Paper</div>
              <div className={`text-xs sm:text-sm font-bold font-mono ${paperRisk === 'High' ? 'text-rose-400' : (paperRisk === 'Moderate' ? 'text-amber-400' : 'text-slate-200')}`}>
                {celluloseRatio.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">({paperRisk})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Investor Guided Tour & 24h Playback Bar */}
      <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Preset Selector Buttons (All 9 Possibilities) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-slate-800">
          <span className="text-xs font-mono uppercase font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Scenarios:
          </span>

          {scenariosList.map((sc: ScenarioInfo) => {
            const isSelected = currentScenario === sc.key;
            return (
              <button
                key={sc.key}
                onClick={() => onSelectScenario(sc.key)}
                title={`${sc.name} — ${sc.shortDesc}`}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                <span className="font-bold">{sc.code}</span>
                <span className="hidden xl:inline text-[11px] text-slate-400">{sc.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* 24-Hour Telemetry Animation Controller */}
        <div className="flex items-center gap-2 shrink-0 bg-slate-900/90 border border-slate-800/80 rounded-lg px-2.5 py-1">
          <span className="text-xs font-mono text-slate-400">
            Timeline: <span className="text-cyan-400 font-bold font-mono">{playbackHour === 23 ? 't-0h (Now)' : `t-${23 - playbackHour}h`}</span>
          </span>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={onTogglePlay}
              className={`p-1.5 rounded-md font-mono text-xs flex items-center gap-1 transition ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
              title={isPlaying ? 'Pause 24h Telemetry Stream' : 'Play Live 24h Fault Evolution'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span className="text-[11px] font-bold">{isPlaying ? 'Pause' : 'Play 24h'}</span>
            </button>

            <button
              onClick={onReset}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Reset Timeline to t-0h"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

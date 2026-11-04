import React, { useState } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Zap, 
  FileText,
  Sun,
  Moon,
  Globe,
  Mic
} from 'lucide-react';
import { SCENARIO_PRESETS, ScenarioInfo } from '../engine/scenarioPresets';
import { StandardsReferenceModal } from './StandardsReferenceModal';

interface TopExecutiveBarProps {
  currentScenario: string;
  onSelectScenario: (scenarioKey: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  playbackHour: number; // 0 to 23
  tdcg: number;
  celluloseRatio: number;
  paperRisk: 'Low' | 'Moderate' | 'High';
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  ieeeStatus?: any;
  activeZoneCode?: string;
  onOpenVoiceBot?: () => void;
  hasSarvamKey?: boolean;
}

export const TopExecutiveBar: React.FC<TopExecutiveBarProps> = ({
  currentScenario,
  onSelectScenario,
  isPlaying,
  onTogglePlay,
  onReset,
  playbackHour,
  tdcg,
  celluloseRatio,
  paperRisk,
  isDarkMode = true,
  onToggleTheme,
  onOpenVoiceBot,
  hasSarvamKey = false,
}) => {
  const scenariosList = Object.values(SCENARIO_PRESETS);

  // Standards Reference Learning Modal state
  const [standardsModalOpen, setStandardsModalOpen] = useState<boolean>(false);
  const [initialStandardsTab, setInitialStandardsTab] = useState<'ieee' | 'iec'>('ieee');

  const handleOpenStandards = (tab: 'ieee' | 'iec') => {
    setInitialStandardsTab(tab);
    setStandardsModalOpen(true);
  };

  return (
    <header className="border-b border-scada-border bg-scada-bg sticky top-0 z-40 px-4 py-2.5">
      {/* Top Asset & Metrics Row */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        
        {/* Asset Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 dark:bg-slate-900 dark:border-slate-700 dark:text-cyan-400">
            <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-wider font-mono text-slate-900 dark:text-white flex items-center gap-2">
                TX-400kV-BAY-04
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  315 MVA ONAF
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Substation Digital Twin &bull; Dissolved Gas Analysis Fault Detector
            </p>
          </div>
        </div>

        {/* DGA Standards & Regulatory Learning Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sarvam AI Voice Bot Trigger */}
          <button
            onClick={onOpenVoiceBot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-amber-500/10 border-cyan-400/50 hover:border-cyan-400 hover:text-cyan-700 text-slate-800 dark:text-cyan-300 dark:hover:text-cyan-200 cursor-pointer shadow-sm relative group"
            title="Open Substation AI Voice Bot (Sarvam AI Multilingual Voice)"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[11px]">Sarvam Voice Bot</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasSarvamKey ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
              title={hasSarvamKey ? 'Sarvam Token Connected' : 'Requires Sarvam Token'}
            />
          </button>

          <button
            onClick={() => handleOpenStandards('ieee')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition bg-white border-slate-200 hover:border-cyan-400 hover:text-cyan-700 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/90 dark:border-slate-800 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
            title="Open IEEE C57.104 Gas Thresholds & Standards Guide"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-semibold text-[11px]">IEEE C57.104 &amp; Thresholds</span>
          </button>

          <button
            onClick={() => handleOpenStandards('iec')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition bg-white border-slate-200 hover:border-cyan-400 hover:text-cyan-700 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/90 dark:border-slate-800 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
            title="Open IEC 60599 Ratios & IEC 61850 Substation Architecture Guide"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-semibold text-[11px]">IEC 60599 &amp; IEC 61850</span>
          </button>
        </div>

        {/* Ticker Badges (Minimal, Clean) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* TDCG Score */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <Flame className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">TDCG Combustible</div>
              <div className="text-xs sm:text-sm font-bold text-cyan-700 dark:text-cyan-300 font-mono">
                {tdcg.toFixed(0)} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">ppm</span>
              </div>
            </div>
          </div>

          {/* Cellulose Paper Ratio */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <FileText className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">CO₂/CO Paper</div>
              <div className={`text-xs sm:text-sm font-bold font-mono ${paperRisk === 'High' ? 'text-rose-600 dark:text-rose-400' : (paperRisk === 'Moderate' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200')}`}>
                {celluloseRatio.toFixed(1)} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">({paperRisk})</span>
              </div>
            </div>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all font-mono text-xs bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50 dark:bg-slate-900/90 dark:border-slate-800 dark:hover:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light and Dark Mode"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-200 text-[11px]">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-600" />
                <span className="font-bold text-slate-800 text-[11px]">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Selector Bar & 24h Playback Controls */}
      <div className="mt-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Preset Selector Buttons (All 9 Possibilities) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          <span className="text-xs font-mono uppercase font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
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
                    ? 'bg-cyan-100 text-cyan-800 border-cyan-400 font-bold dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-600 dark:bg-cyan-400' : 'bg-slate-400 dark:bg-slate-600'}`} />
                <span>{sc.code}</span>
                <span className="hidden xl:inline text-[11px] text-slate-500 dark:text-slate-400">{sc.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* 24-Hour Telemetry Animation Controller */}
        <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 rounded-lg px-2.5 py-1 shadow-sm">
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
            Timeline: <span className="text-cyan-700 dark:text-cyan-400 font-bold font-mono">{playbackHour === 23 ? 't-0h (Now)' : `t-${23 - playbackHour}h`}</span>
          </span>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              onClick={onTogglePlay}
              className={`p-1.5 rounded-md font-mono text-xs flex items-center gap-1 transition ${
                isPlaying
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40'
                  : 'bg-cyan-100 text-cyan-800 border border-cyan-300 hover:bg-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 dark:hover:bg-cyan-500/30'
              }`}
              title={isPlaying ? 'Pause 24h Telemetry Stream' : 'Play Live 24h Fault Evolution'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span className="text-[11px] font-bold">{isPlaying ? 'Pause' : 'Play 24h'}</span>
            </button>

            <button
              onClick={onReset}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
              title="Reset Timeline to t-0h"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DGA Standards & Regulatory Learning Reference Modal */}
      <StandardsReferenceModal
        isOpen={standardsModalOpen}
        onClose={() => setStandardsModalOpen(false)}
        initialTab={initialStandardsTab}
      />
    </header>
  );
};

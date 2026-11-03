import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  Wrench, 
  Zap, 
  Download, 
  CheckCircle2, 
  Activity,
  Check
} from 'lucide-react';
import { ActionProtocol } from '../engine/actionProtocol';
import { IEEEValidationResult, DuvalCoordinates } from '../engine/dgaStandards';

interface ActionDispatchCardProps {
  actionProtocol: ActionProtocol;
  ieeeStatus: IEEEValidationResult;
  duvalCoords: DuvalCoordinates;
  celluloseStatus: string;
  celluloseRisk: 'Low' | 'Moderate' | 'High';
  celluloseRatio: number;
}

export const ActionDispatchCard: React.FC<ActionDispatchCardProps> = ({
  actionProtocol,
  ieeeStatus,
  duvalCoords,
  celluloseRisk,
  celluloseRatio,
}) => {
  // Interactive action states
  const [loadShedActive, setLoadShedActive] = useState(false);
  const [crewDispatched, setCrewDispatched] = useState(false);
  const [scadaInterlockArmed, setScadaInterlockArmed] = useState(false);
  const [sfraOrdered, setSfraOrdered] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleToggleLoadShed = () => {
    const next = !loadShedActive;
    setLoadShedActive(next);
    triggerFeedback(next ? '⚡ IEC 61850: 40% Load Curtailment Dispatched to Bay #04' : 'Load Curtailment Normalized');
  };

  const handleToggleCrew = () => {
    const next = !crewDispatched;
    setCrewDispatched(next);
    triggerFeedback(next ? '👷 Rapid Response Substation Crew Dispatched to Bay #04' : 'Crew Dispatch Standby');
  };

  const handleToggleInterlock = () => {
    const next = !scadaInterlockArmed;
    setScadaInterlockArmed(next);
    triggerFeedback(next ? '🔒 SCADA GGIO.TripInterlock Armed & Locked' : 'SCADA Interlock Disarmed');
  };

  const handleToggleSFRA = () => {
    const next = !sfraOrdered;
    setSfraOrdered(next);
    triggerFeedback(next ? '📋 Work-Order WO-TX400-882 (SFRA / HPLC) Logged to SAP PM' : 'Work-Order Cancelled');
  };

  const handleExportSample = () => {
    // Generate simulated laboratory GC oil sample CSV
    const csvContent = `data:text/csv;charset=utf-8,Timestamp,Transformer,IEEE_Condition,Duval_Zone,Cellulose_Ratio\n${new Date().toISOString()},TX-400kV-BAY-04,${ieeeStatus.condition},${duvalCoords.zoneCode},${celluloseRatio.toFixed(2)}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DGA_Sample_Bay04_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerFeedback('📥 Lab GC Sample Telemetry Exported (CSV)');
  };

  // Primary directive text derived from protocol
  const primaryDirective = actionProtocol.operationalActions[0] || 'Nominal Substation Baseline Monitoring';

  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-3 shadow-lg flex flex-col gap-2.5">
      {/* Main Single-Row Industrial Dispatch Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left: Severity Badge & Primary Directive */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Severity Icon Badge */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${actionProtocol.color}15`,
              borderColor: `${actionProtocol.color}40`,
              color: actionProtocol.color,
            }}
          >
            <ShieldAlert className="w-4 h-4" />
          </div>

          {/* Directive Text & Badges */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border shrink-0"
                style={{
                  backgroundColor: `${actionProtocol.color}20`,
                  color: actionProtocol.color,
                  borderColor: `${actionProtocol.color}50`,
                }}
              >
                {actionProtocol.severity.split(' ')[0]}
              </span>

              <span className="text-xs sm:text-sm font-bold text-white truncate font-sans">
                {primaryDirective}
              </span>
            </div>

            {/* Quick Status Chips */}
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-400 flex-wrap">
              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                IEEE: <strong className="text-white">{ieeeStatus.condition.split(' ')[1]}</strong>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Duval: <strong className="text-cyan-300">{duvalCoords.zoneCode}</strong>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                CO₂/CO: <strong className={celluloseRisk === 'High' ? 'text-rose-400' : 'text-slate-300'}>{celluloseRatio.toFixed(1)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Action & Dispatch Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {/* Primary Action Button (Load Curtailment / Emergency Isolation) */}
          <button
            onClick={handleToggleLoadShed}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm ${
              loadShedActive
                ? 'bg-rose-500 text-white border border-rose-400'
                : actionProtocol.severity.includes('CRITICAL') || actionProtocol.severity.includes('WARNING')
                ? 'bg-rose-600/80 hover:bg-rose-500 text-white border border-rose-500/80'
                : 'bg-cyan-600/80 hover:bg-cyan-500 text-white border border-cyan-500/80'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{loadShedActive ? 'Load Shedding Active (40%)' : 'Initiate Load Shedding'}</span>
          </button>

          {/* Dispatch Crew Button */}
          <button
            onClick={handleToggleCrew}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border ${
              crewDispatched
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {crewDispatched ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Wrench className="w-3.5 h-3.5 text-amber-400" />}
            <span>{crewDispatched ? 'Crew Dispatched' : 'Dispatch Crew'}</span>
          </button>

          {/* Trigger SCADA Interlock */}
          <button
            onClick={handleToggleInterlock}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border ${
              scadaInterlockArmed
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {scadaInterlockArmed ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Terminal className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{scadaInterlockArmed ? 'Interlock Armed' : 'SCADA Interlock'}</span>
          </button>

          {/* Order SFRA / HPLC */}
          <button
            onClick={handleToggleSFRA}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border ${
              sfraOrdered
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {sfraOrdered ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Activity className="w-3.5 h-3.5 text-purple-400" />}
            <span>{sfraOrdered ? 'WO Created' : 'SFRA Test'}</span>
          </button>

          {/* Export Lab Sample CSV */}
          <button
            onClick={handleExportSample}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono transition bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-cyan-300 flex items-center gap-1.5"
            title="Download Gas Concentration Sample for Oil Lab Validation (CSV)"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export GC</span>
          </button>
        </div>
      </div>

      {/* Tactile Action Feedback Banner (Only visible when user clicks an action) */}
      {actionFeedback && (
        <div className="px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}
    </div>
  );
};

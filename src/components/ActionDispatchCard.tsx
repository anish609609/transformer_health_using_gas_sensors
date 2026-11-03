import React from 'react';
import { Terminal, Wrench, AlertTriangle, Cpu } from 'lucide-react';
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
  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-3.5 flex flex-col justify-between shadow-lg h-full">
      {/* 1. Header with Diagnostic Priority & Subsystem Badge */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
              AI Engine &bull; Suggested Actions &amp; Mitigation
            </h3>
          </div>

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
        </div>

        {/* Affected Subsystem Identifier */}
        <div className="mt-2 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
          <span className="text-slate-400">Target Subsystem:</span>
          <span className="font-bold text-white truncate ml-2">
            {actionProtocol.subsystemLabel}
          </span>
        </div>
      </div>

      {/* 2. Primary Operational Directives Suggested by AI */}
      <div className="my-2 bg-slate-900/70 border border-slate-800/80 rounded-lg p-2.5">
        <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Immediate AI Operational Mitigation Commands:</span>
        </div>

        <ul className="space-y-1 text-xs text-slate-200 font-sans">
          {actionProtocol.operationalActions.slice(0, 2).map((action, idx) => (
            <li key={idx} className="flex items-start gap-1.5 leading-snug">
              <span className="text-cyan-400 font-mono font-bold shrink-0">{idx + 1}.</span>
              <span className="text-[11.5px] text-slate-200">{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. 2-Column Split: SCADA Automated Interlocks & Field Testing Orders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
        {/* Left: IEC 61850 SCADA Interlocks */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Terminal className="w-3 h-3 shrink-0" />
            <span>SCADA Interlocks</span>
          </div>
          <ul className="space-y-1 text-[10.5px] text-slate-300">
            {actionProtocol.scadaCommands.slice(0, 2).map((cmd, idx) => (
              <li key={idx} className="flex items-center gap-1.5 truncate text-slate-300" title={cmd}>
                <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                <span className="truncate">{cmd.replace('SCADA command: ', '').replace('Substation command: ', '')}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Field Testing & Maintenance Orders */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Wrench className="w-3 h-3 shrink-0" />
            <span>Field Work-Orders</span>
          </div>
          <ul className="space-y-1 text-[10.5px] text-slate-300">
            {actionProtocol.fieldTesting.slice(0, 2).map((test, idx) => (
              <li key={idx} className="flex items-center gap-1.5 truncate text-slate-300" title={test}>
                <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                <span className="truncate">{test}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. Regulatory Status Footer Bar */}
      <div className="mt-2 pt-2 border-t border-slate-800/90 flex items-center justify-between text-[10px] font-mono text-slate-400 flex-wrap gap-1">
        <span>IEEE C57.104: <strong className="text-white">{ieeeStatus.condition}</strong></span>
        <span>Duval: <strong className="text-cyan-300">{duvalCoords.zoneCode}</strong></span>
        <span>Paper Health: <strong className={celluloseRisk === 'High' ? 'text-rose-400' : 'text-slate-200'}>Ratio {celluloseRatio.toFixed(1)} ({celluloseRisk})</strong></span>
      </div>
    </div>
  );
};

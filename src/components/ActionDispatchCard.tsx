import React from 'react';
import { ShieldAlert, Terminal, Wrench, AlertTriangle, FileText } from 'lucide-react';
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
  celluloseStatus,
  celluloseRisk,
  celluloseRatio,
}) => {
  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Substation Automated Action Engine &bull; IEC 61850 Protocols
          </h3>
        </div>

        <span
          className="text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border"
          style={{
            backgroundColor: `${actionProtocol.color}20`,
            color: actionProtocol.color,
            borderColor: `${actionProtocol.color}50`,
          }}
        >
          {actionProtocol.severity.split(' ')[0]}
        </span>
      </div>

      {/* Immediate Operational Mitigation Directives */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-lg p-3">
        <div className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Immediate Substation Operational Commands
        </div>
        <ul className="space-y-1.5 text-xs text-slate-200 font-sans">
          {actionProtocol.operationalActions.map((action, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-400 font-mono font-bold shrink-0">{idx + 1}.</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Grid: SCADA Automated Interlocks & Field Maintenance Work-Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left: IEC 61850 SCADA Interlocks */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            IEC 61850 SCADA Control Interlocks
          </div>
          <ul className="space-y-1 text-xs font-mono text-slate-300">
            {actionProtocol.scadaCommands.map((cmd, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-[11px] bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="truncate">{cmd}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Field Testing & Maintenance Work-Orders */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" />
            Field Testing &amp; Diagnostic Work-Orders
          </div>
          <ul className="space-y-1 text-xs font-mono text-slate-300">
            {actionProtocol.fieldTesting.map((test, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-[11px] bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="truncate">{test}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Deterministic Standards Card: IEEE C57.104 & Cellulose Paper Health */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col gap-2 font-mono text-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          Deterministic Regulatory Status Summary
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          {/* IEEE C57.104 */}
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">IEEE C57.104-2019</div>
            <div className="font-bold text-white mt-0.5">{ieeeStatus.condition}</div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {ieeeStatus.breachedGases.length > 0 ? `Breached: ${ieeeStatus.breachedGases.join(', ')}` : 'All Within 90th Limits'}
            </div>
          </div>

          {/* Duval Triangle 1 Zone */}
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Duval Triangle 1</div>
            <div className="font-bold text-white mt-0.5">{duvalCoords.zoneCode}</div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">{duvalCoords.zone}</div>
          </div>

          {/* Solid Paper Health */}
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Paper Pyrolysis (CO₂/CO)</div>
            <div className={`font-bold mt-0.5 ${celluloseRisk === 'High' ? 'text-rose-400' : (celluloseRisk === 'Moderate' ? 'text-amber-400' : 'text-emerald-400')}`}>
              Ratio: {celluloseRatio.toFixed(2)} ({celluloseRisk} Risk)
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">{celluloseStatus.split(':')[0]}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

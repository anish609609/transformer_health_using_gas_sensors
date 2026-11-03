import React from 'react';
import { Wrench, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ActionProtocol } from '../engine/actionProtocol';

interface ActionDispatchCardProps {
  actionProtocol: ActionProtocol;
}

export const ActionDispatchCard: React.FC<ActionDispatchCardProps> = ({
  actionProtocol,
}) => {
  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-lg h-full">
      {/* 1. Header: Suggested Actions & Mitigations */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Suggested Actions &amp; Mitigations
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

      {/* 2. Operational Mitigation Actions (Individual Isolated Boxes) */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Operational Mitigation Actions</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {actionProtocol.operationalActions.slice(0, 3).map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-[11px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-[11.5px] text-slate-200 font-sans leading-relaxed">
                {action}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Field Testing & Diagnostic Orders (Individual Isolated Boxes) */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Field Testing &amp; Diagnostic Orders</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {actionProtocol.fieldTesting.slice(0, 3).map((test, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                <Wrench className="w-2.5 h-2.5 text-amber-400" />
              </span>
              <p className="text-[11px] text-slate-300 font-mono leading-snug truncate">
                {test}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

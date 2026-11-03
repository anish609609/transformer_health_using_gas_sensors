import React from 'react';
import { Wrench, AlertTriangle } from 'lucide-react';
import { ActionProtocol } from '../engine/actionProtocol';

interface ActionDispatchCardProps {
  actionProtocol: ActionProtocol;
}

export const ActionDispatchCard: React.FC<ActionDispatchCardProps> = ({
  actionProtocol,
}) => {
  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-3.5 flex flex-col justify-between shadow-lg h-full">
      {/* 1. Header: Suggested Actions & Mitigations */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-cyan-400" />
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

      {/* 2. Suggestions & Mitigation Actions */}
      <div className="my-2 bg-slate-900/80 border border-slate-800/90 rounded-lg p-2.5 flex-1 flex flex-col justify-center">
        <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Operational Mitigation Actions</span>
        </div>

        <ul className="space-y-1.5 text-xs text-slate-200 font-sans">
          {actionProtocol.operationalActions.map((action, idx) => (
            <li key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-cyan-400 font-mono font-bold shrink-0">{idx + 1}.</span>
              <span className="text-[11.5px] text-slate-200">{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. Field Orders */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2.5 flex-1 flex flex-col justify-center">
        <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          <span>Field Testing &amp; Diagnostic Orders</span>
        </div>

        <ul className="space-y-1.5 text-xs font-mono text-slate-300">
          {actionProtocol.fieldTesting.map((test, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-300 leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <span>{test}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

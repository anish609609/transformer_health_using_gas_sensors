import React, { useState } from 'react';
import { Cpu, Info, X, Activity } from 'lucide-react';
import { DiagnosticInference, CnnClassProbability } from '../engine/cnnInference';

interface CnnConfidenceCardProps {
  inference: DiagnosticInference;
}

export const CnnConfidenceCard: React.FC<CnnConfidenceCardProps> = ({
  inference,
}) => {
  const [showInspectorModal, setShowInspectorModal] = useState(false);

  return (
    <>
      <div className="bg-scada-card border border-scada-border rounded-xl p-3.5 flex flex-col gap-2.5 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
              1D-CNN AI Diagnostics &bull; 9-Class Softmax
            </h3>
          </div>

          <button
            onClick={() => setShowInspectorModal(true)}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-slate-700 transition flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            Inspect Architecture
          </button>
        </div>

        {/* Consolidated Top Prediction Row */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
              {inference.classCode}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate font-sans">
              {inference.className}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 font-mono">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block leading-tight">Confidence</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400 leading-tight">
                {inference.confidence.toFixed(1)}%
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
              {inference.executionTimeMs}ms
            </span>
          </div>
        </div>

        {/* Streamlined 2-Column 9-Class Probability Bar Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
          {inference.probabilities.map((item: CnnClassProbability) => (
            <div key={item.id} className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className={`w-9 shrink-0 font-bold ${item.isTop ? 'text-white' : 'text-slate-400'}`}>
                {item.code}
              </span>

              {/* Progress Bar Container */}
              <div className="flex-1 h-2.5 bg-slate-900 rounded border border-slate-800 overflow-hidden relative">
                <div
                  className="h-full rounded transition-all duration-300"
                  style={{
                    width: `${Math.max(1, item.probability)}%`,
                    backgroundColor: item.color,
                    opacity: item.isTop ? 1 : 0.45,
                  }}
                />
              </div>

              <span className={`w-10 text-right shrink-0 text-[10px] font-bold ${item.isTop ? 'text-cyan-300' : 'text-slate-500'}`}>
                {item.probability.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Model Inspector Modal */}
      {showInspectorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-scada-panel border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4 font-mono text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wider uppercase">
                  1D-CNN Architecture &amp; Training Specifications
                </h3>
              </div>
              <button
                onClick={() => setShowInspectorModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Input Tensor</div>
                <div className="text-sm font-bold text-white mt-0.5">[1, 7, 24]</div>
                <div className="text-[9px] text-slate-500">7 Gases &times; 24h</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Parameters</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">~66,441</div>
                <div className="text-[9px] text-slate-500">Trainable Weights</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Val Accuracy</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">100.0%</div>
                <div className="text-[9px] text-slate-500">Stratified Test</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Latency</div>
                <div className="text-sm font-bold text-white mt-0.5">&lt; 0.2 ms</div>
                <div className="text-[9px] text-slate-500">Native TS Engine</div>
              </div>
            </div>

            {/* Topology Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
              <h4 className="text-xs font-bold text-cyan-300 uppercase mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Layer-by-Layer Forward Pass Topology
              </h4>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Layer 1: Conv1D (7 &rarr; 32, k=3, p=1)</span>
                  <span className="text-slate-200">BatchNorm1D &rarr; ReLU &rarr; MaxPool1D(2) &rarr; [32, 12]</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Layer 2: Conv1D (32 &rarr; 64, k=3, p=1)</span>
                  <span className="text-slate-200">BatchNorm1D &rarr; ReLU &rarr; MaxPool1D(2) &rarr; [64, 6]</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Layer 3: Conv1D (64 &rarr; 128, k=3, p=1)</span>
                  <span className="text-slate-200">BatchNorm1D &rarr; ReLU &rarr; [128, 6]</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Pooling: AdaptiveAvgPool1d(1)</span>
                  <span className="text-slate-200">Squeeze &rarr; Linear(128, 9) &rarr; Softmax &rarr; [9]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

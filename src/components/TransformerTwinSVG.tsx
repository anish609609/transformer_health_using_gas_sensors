import React, { useState } from 'react';
import { Layers, Activity, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { ActionProtocol } from '../engine/actionProtocol';

interface TransformerTwinSVGProps {
  actionProtocol: ActionProtocol;
  aiClassCode: string;
  duvalZoneCode: string;
  isArcing: boolean;
  isOverheating: boolean;
}

export const TransformerTwinSVG: React.FC<TransformerTwinSVGProps> = ({
  actionProtocol,
  aiClassCode,
  isArcing,
  isOverheating,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const activeSubsystem = actionProtocol.affectedSubsystem;

  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-lg">
      {/* Schematic Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            2D Transformer Subsystem Cutaway &bull; Physical Fault Locator
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: actionProtocol.color }}
            />
            Target: <span className="text-cyan-300 font-mono font-bold">[{aiClassCode}]</span> <span className="text-white font-bold">{actionProtocol.subsystemLabel.split(' ')[0]}</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas Schematic */}
      <div className="relative w-full aspect-[16/9] max-h-[300px] flex items-center justify-center bg-slate-950/80 rounded-lg border border-slate-800/90 p-2 overflow-hidden">
        <svg
          viewBox="0 0 800 450"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="oilGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#083344" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#021a24" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="coreGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="windingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Glowing Fault Filters */}
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="thermalGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Substation Ground Plane */}
          <line x1="50" y1="420" x2="750" y2="420" stroke="#334155" strokeWidth="3" strokeDasharray="6 4" />
          <text x="700" y="440" fill="#64748b" fontSize="11" fontFamily="monospace">GND</text>

          {/* 1. Main Tank Hull */}
          <rect
            x="200"
            y="130"
            width="400"
            height="270"
            rx="12"
            fill="url(#oilGradient)"
            stroke={activeSubsystem === 'nominal' ? '#10b981' : '#334155'}
            strokeWidth="3"
            className="transition-colors duration-500"
          />
          <text x="215" y="152" fill="#64748b" fontSize="11" fontFamily="monospace">MAIN TANK OIL (42,000L)</text>

          {/* 2. Magnetic Core Laminations */}
          <g
            className="cursor-pointer transition-all duration-300"
            onClick={() => setSelectedComponent('Magnetic Core')}
          >
            {/* Core Limbs */}
            <rect
              x="260"
              y="160"
              width="60"
              height="210"
              rx="4"
              fill="url(#coreGradient)"
              stroke={activeSubsystem === 'core' ? '#f43f5e' : '#475569'}
              strokeWidth={activeSubsystem === 'core' ? '4' : '1.5'}
              filter={activeSubsystem === 'core' ? 'url(#thermalGlow)' : undefined}
            />
            <rect
              x="480"
              y="160"
              width="60"
              height="210"
              rx="4"
              fill="url(#coreGradient)"
              stroke={activeSubsystem === 'core' ? '#f43f5e' : '#475569'}
              strokeWidth={activeSubsystem === 'core' ? '4' : '1.5'}
              filter={activeSubsystem === 'core' ? 'url(#thermalGlow)' : undefined}
            />
            {/* Top & Bottom Yoke */}
            <rect x="250" y="160" width="300" height="35" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="250" y="335" width="300" height="35" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <text x="365" y="182" fill="#94a3b8" fontSize="11" fontFamily="monospace">SILICON STEEL CORE</text>
          </g>

          {/* 3. High-Voltage / Low-Voltage Windings & Kraft Paper */}
          <g
            className="cursor-pointer transition-all duration-300"
            onClick={() => setSelectedComponent('Copper Windings')}
          >
            {/* Left Winding Phase A/B */}
            <rect
              x="330"
              y="200"
              width="65"
              height="130"
              rx="6"
              fill="url(#windingGradient)"
              stroke={
                activeSubsystem === 'windings'
                  ? '#f43f5e'
                  : activeSubsystem === 'paper'
                  ? '#ec4899'
                  : '#b45309'
              }
              strokeWidth={activeSubsystem === 'windings' || activeSubsystem === 'paper' ? '4' : '1.5'}
              filter={activeSubsystem === 'windings' ? 'url(#arcGlow)' : undefined}
            />
            {/* Right Winding Phase B/C */}
            <rect
              x="405"
              y="200"
              width="65"
              height="130"
              rx="6"
              fill="url(#windingGradient)"
              stroke={
                activeSubsystem === 'windings'
                  ? '#f43f5e'
                  : activeSubsystem === 'paper'
                  ? '#ec4899'
                  : '#b45309'
              }
              strokeWidth={activeSubsystem === 'windings' || activeSubsystem === 'paper' ? '4' : '1.5'}
              filter={activeSubsystem === 'windings' ? 'url(#arcGlow)' : undefined}
            />
            {/* Winding Turns Detail Lines */}
            <line x1="335" y1="230" x2="390" y2="230" stroke="#78350f" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="335" y1="260" x2="390" y2="260" stroke="#78350f" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="335" y1="290" x2="390" y2="290" stroke="#78350f" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="410" y1="230" x2="465" y2="230" stroke="#78350f" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="410" y1="260" x2="465" y2="260" stroke="#78350f" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="410" y1="290" x2="465" y2="290" stroke="#78350f" strokeWidth="2" strokeDasharray="3 3" />
            <text x="350" y="348" fill="#f59e0b" fontSize="10" fontFamily="monospace">HV/LV WINDINGS</text>
          </g>

          {/* 4. On-Load Tap Changer (OLTC) Diverter Switch Compartment */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('OLTC Tap Changer')}
          >
            <rect
              x="530"
              y="200"
              width="55"
              height="130"
              rx="5"
              fill="#0f172a"
              stroke={activeSubsystem === 'oltc' ? '#f97316' : '#334155'}
              strokeWidth={activeSubsystem === 'oltc' ? '3.5' : '1.5'}
              filter={activeSubsystem === 'oltc' ? 'url(#arcGlow)' : undefined}
            />
            <circle cx="557" cy="240" r="10" fill="#334155" stroke="#f97316" strokeWidth="1" />
            <circle cx="557" cy="285" r="10" fill="#334155" stroke="#f97316" strokeWidth="1" />
            <text x="540" y="345" fill="#f97316" fontSize="9" fontFamily="monospace">OLTC</text>
          </g>

          {/* 5. High-Voltage Bushings (Phase A, B, C) */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('HV Bushings')}
          >
            {/* Bushing A */}
            <path
              d="M 270 130 L 255 40 L 285 40 Z"
              fill="#475569"
              stroke={activeSubsystem === 'bushings' ? '#eab308' : '#334155'}
              strokeWidth={activeSubsystem === 'bushings' ? '3' : '1.5'}
              filter={activeSubsystem === 'bushings' ? 'url(#arcGlow)' : undefined}
            />
            <circle cx="270" cy="35" r="7" fill="#dc2626" />

            {/* Bushing B */}
            <path
              d="M 400 130 L 385 30 L 415 30 Z"
              fill="#475569"
              stroke={activeSubsystem === 'bushings' ? '#eab308' : '#334155'}
              strokeWidth={activeSubsystem === 'bushings' ? '3' : '1.5'}
              filter={activeSubsystem === 'bushings' ? 'url(#arcGlow)' : undefined}
            />
            <circle cx="400" cy="25" r="7" fill="#eab308" />

            {/* Bushing C */}
            <path
              d="M 530 130 L 515 40 L 545 40 Z"
              fill="#475569"
              stroke={activeSubsystem === 'bushings' ? '#eab308' : '#334155'}
              strokeWidth={activeSubsystem === 'bushings' ? '3' : '1.5'}
              filter={activeSubsystem === 'bushings' ? 'url(#arcGlow)' : undefined}
            />
            <circle cx="530" cy="35" r="7" fill="#2563eb" />

            <text x="350" y="20" fill="#94a3b8" fontSize="10" fontFamily="monospace">400kV BUSHINGS (A-B-C)</text>
          </g>

          {/* 6. Cooling Radiators & Fans (Left Side) */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('Cooling Radiator')}
          >
            <rect
              x="120"
              y="180"
              width="60"
              height="180"
              rx="4"
              fill="#090d16"
              stroke={activeSubsystem === 'cooling' ? '#f97316' : '#334155'}
              strokeWidth={activeSubsystem === 'cooling' ? '3' : '1.5'}
            />
            <line x1="180" y1="210" x2="200" y2="210" stroke="#334155" strokeWidth="6" />
            <line x1="180" y1="330" x2="200" y2="330" stroke="#334155" strokeWidth="6" />
            <circle cx="150" cy="240" r="14" fill="#1e293b" stroke="#06b6d4" strokeWidth="1" />
            <circle cx="150" cy="300" r="14" fill="#1e293b" stroke="#06b6d4" strokeWidth="1" />
            <text x="125" y="375" fill="#64748b" fontSize="9" fontFamily="monospace">RADIATOR</text>
          </g>

          {/* 7. Conservator Tank & Buchholz Pipe */}
          <rect x="220" y="60" width="120" height="40" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <path d="M 280 100 L 280 130" stroke="#475569" strokeWidth="7" fill="none" />
          {/* Buchholz Relay */}
          <circle cx="280" cy="115" r="9" fill="#0891b2" stroke="#22d3ee" strokeWidth="1.5" />
          <text x="235" y="85" fill="#94a3b8" fontSize="9" fontFamily="monospace">CONSERVATOR</text>

          {/* 8. Online DGA Sensor Manifold (Bottom Right) */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('PAS DGA Monitor')}
          >
            <line x1="580" y1="380" x2="640" y2="380" stroke="#06b6d4" strokeWidth="4" />
            <rect
              x="640"
              y="330"
              width="80"
              height="75"
              rx="6"
              fill="#042f2e"
              stroke={activeSubsystem === 'sensor' ? '#22d3ee' : '#0d9488'}
              strokeWidth={activeSubsystem === 'sensor' ? '3' : '1.5'}
              filter={activeSubsystem === 'sensor' ? 'url(#arcGlow)' : undefined}
            />
            <circle cx="680" cy="360" r="10" fill="#021c1e" stroke="#22d3ee" strokeWidth="1.5" className="animate-pulse" />
            <text x="648" y="392" fill="#5eead4" fontSize="9" fontFamily="monospace">PAS DGA</text>
          </g>

          {/* Dynamic Arcing / Sparking Effect Overlay */}
          {isArcing && (
            <g className="animate-pulse" filter="url(#arcGlow)">
              <polygon
                points="360,230 380,245 365,255 390,275 375,255 385,245"
                fill="#ffffff"
                stroke="#f43f5e"
                strokeWidth="2"
              />
              <circle cx="375" cy="255" r="24" fill="#f43f5e" opacity="0.3" />
            </g>
          )}

          {/* Dynamic Thermal Hotspot Glow */}
          {isOverheating && (
            <circle cx="435" cy="265" r="35" fill="#f97316" opacity="0.4" filter="url(#thermalGlow)" className="animate-ping" />
          )}
        </svg>

        {/* Live Subsystem Alert Callout Pill */}
        <div className="absolute bottom-2 left-2 bg-slate-900/95 border border-slate-700/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-md">
          {activeSubsystem !== 'nominal' ? (
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div className="text-left">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Fault Localization</div>
            <div className="text-xs font-bold text-white font-mono">
              {actionProtocol.subsystemLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Component Details Card on Click */}
      {selectedComponent && (
        <div className="text-xs bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Inspected Module: <strong className="text-white">{selectedComponent}</strong> &bull; Operating Status:
              <span className="text-cyan-400 ml-1 font-mono">Telemetry Synchronized</span>
            </span>
          </div>
          <button
            onClick={() => setSelectedComponent(null)}
            className="text-slate-500 hover:text-white font-mono text-[11px]"
          >
            [Close]
          </button>
        </div>
      )}
    </div>
  );
};

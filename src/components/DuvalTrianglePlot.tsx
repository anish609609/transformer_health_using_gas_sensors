import React, { useState } from 'react';
import { Triangle, Eye } from 'lucide-react';
import { DuvalCoordinates } from '../engine/dgaStandards';
import { TelemetryPoint } from '../engine/scenarioPresets';

interface DuvalTrianglePlotProps {
  currentDuval: DuvalCoordinates;
  trajectory: TelemetryPoint[];
}

export const DuvalTrianglePlot: React.FC<DuvalTrianglePlotProps> = ({
  currentDuval,
  trajectory,
}) => {
  const [showZones, setShowZones] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);

  // Triangle SVG Canvas Geometry
  const topV = { x: 400, y: 45 };     // %CH4 = 100%
  const leftV = { x: 140, y: 415 };   // %C2H4 = 100%
  const rightV = { x: 660, y: 415 };  // %C2H2 = 100%

  // Barycentric coordinate projection: (a=%CH4, b=%C2H4, c=%C2H2)
  const project = (ch4: number, c2h4: number, c2h2: number) => {
    const total = ch4 + c2h4 + c2h2;
    if (total <= 0) return { x: 400, y: 270 };
    const wa = ch4 / total;
    const wb = c2h4 / total;
    const wc = c2h2 / total;
    return {
      x: wa * topV.x + wb * leftV.x + wc * rightV.x,
      y: wa * topV.y + wb * leftV.y + wc * rightV.y,
    };
  };

  const toSvgPoints = (coords: Array<[number, number, number]>) => {
    return coords.map(([a, b, c]) => {
      const pt = project(a, b, c);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');
  };

  // Duval Triangle 1 Zones Definition
  const DUVAL_ZONES = [
    {
      code: 'PD',
      name: 'PD: Partial Discharge',
      desc: 'Corona in gas voids (%CH₄ ≥ 98%)',
      color: '#0284c7', // sky-600
      points: toSvgPoints([[100, 0, 0], [98, 2, 0], [98, 0, 2]]),
    },
    {
      code: 'T1',
      name: 'T1: Thermal Fault <300°C',
      desc: 'Core bolts, localized hot spot (%C₂H₄ < 20%, %C₂H₂ < 4%)',
      color: '#0d9488', // teal-600
      points: toSvgPoints([[98, 2, 0], [80, 20, 0], [76, 20, 4], [96, 0, 4], [98, 0, 2]]),
    },
    {
      code: 'T2',
      name: 'T2: Thermal Fault 300°–700°C',
      desc: 'Winding conductor overheating (20% ≤ %C₂H₄ < 50%, %C₂H₂ < 4%)',
      color: '#d97706', // amber-600
      points: toSvgPoints([[80, 20, 0], [50, 50, 0], [46, 50, 4], [76, 20, 4]]),
    },
    {
      code: 'T3',
      name: 'T3: Thermal Fault >700°C',
      desc: 'Core iron & oil carbonization (%C₂H₄ ≥ 50%, %C₂H₂ < 15%)',
      color: '#dc2626', // red-600
      points: toSvgPoints([[50, 50, 0], [0, 100, 0], [0, 85, 15], [35, 50, 15], [46, 50, 4]]),
    },
    {
      code: 'DT',
      name: 'DT: Thermal & Electrical Mix',
      desc: 'Overheating with sparking mix',
      color: '#9333ea', // purple-600
      points: toSvgPoints([[76, 20, 4], [46, 50, 4], [35, 50, 15], [48, 23, 29], [64, 23, 13]]),
    },
    {
      code: 'D1',
      name: 'D1: Low-Energy Discharge',
      desc: 'Sparking, tracking (%C₂H₂ ≥ 13%, %C₂H₄ < 23%)',
      color: '#ea580c', // orange-600
      points: toSvgPoints([[87, 0, 13], [64, 23, 13], [48, 23, 29], [71, 0, 29]]),
    },
    {
      code: 'D2',
      name: 'D2: High-Energy Arcing',
      desc: 'Flashover power arcing (%C₂H₂ ≥ 29% or mix)',
      color: '#be123c', // rose-700
      points: toSvgPoints([[71, 0, 29], [48, 23, 29], [35, 50, 15], [0, 85, 15], [0, 0, 100]]),
    },
  ];

  // Current projected point
  const currentPt = project(currentDuval.pctCH4, currentDuval.pctC2H4, currentDuval.pctC2H2);

  // 24-hour historical trajectory points
  const trajectoryPts = trajectory.map((pt) => project(pt.CH4, pt.C2H4, pt.C2H2));

  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-4 flex flex-col gap-3 shadow-lg relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Triangle className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Duval Triangle 1 &bull; IEC 60599 Ternary Projection
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTrajectory(!showTrajectory)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition flex items-center gap-1 ${
              showTrajectory ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Eye className="w-3 h-3" />
            24h Trail
          </button>

          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition flex items-center gap-1 ${
              showZones ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            Zones
          </button>
        </div>
      </div>

      {/* Ternary SVG Canvas */}
      <div className="relative w-full aspect-[4/3] max-h-[340px] flex items-center justify-center bg-slate-950/90 rounded-lg border border-slate-800/90 p-2 overflow-hidden">
        <svg
          viewBox="0 0 800 460"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="markerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="50%" stopColor="#0891b2" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Outer Equilateral Triangle Boundary */}
          <polygon
            points={`${topV.x},${topV.y} ${leftV.x},${leftV.y} ${rightV.x},${rightV.y}`}
            fill="#090d16"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Grid lines inside triangle */}
          {[20, 40, 60, 80].map((pct) => {
            const pCH4_left = project(pct, 100 - pct, 0);
            const pCH4_right = project(pct, 0, 100 - pct);
            return (
              <line
                key={`grid-${pct}`}
                x1={pCH4_left.x}
                y1={pCH4_left.y}
                x2={pCH4_right.x}
                y2={pCH4_right.y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            );
          })}

          {/* Duval Triangle Polygon Zones */}
          {showZones &&
            DUVAL_ZONES.map((zone) => {
              const isCurrentZone = currentDuval.zoneCode === zone.code;
              return (
                <polygon
                  key={zone.code}
                  points={zone.points}
                  fill={zone.color}
                  fillOpacity={isCurrentZone ? 0.45 : 0.22}
                  stroke={zone.color}
                  strokeWidth={isCurrentZone ? 2.5 : 1}
                  className="transition-all duration-300 hover:fill-opacity-50 cursor-pointer"
                >
                  <title>{`${zone.name}: ${zone.desc}`}</title>
                </polygon>
              );
            })}

          {/* 24-Hour Historical Trajectory Path */}
          {showTrajectory && trajectoryPts.length > 1 && (
            <g>
              <polyline
                points={trajectoryPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity="0.8"
              />
              {trajectoryPts.map((p, idx) => (
                <circle
                  key={`trail-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r={idx === trajectoryPts.length - 1 ? 3 : 1.5}
                  fill={idx === 0 ? '#64748b' : '#38bdf8'}
                  opacity={0.6 + (idx / trajectoryPts.length) * 0.4}
                />
              ))}
            </g>
          )}

          {/* Current Operating Point Marker */}
          <circle
            cx={currentPt.x}
            cy={currentPt.y}
            r="16"
            fill="url(#markerGlow)"
            className="animate-ping"
          />
          <circle
            cx={currentPt.x}
            cy={currentPt.y}
            r="6"
            fill="#ffffff"
            stroke="#06b6d4"
            strokeWidth="2.5"
          />
          <circle
            cx={currentPt.x}
            cy={currentPt.y}
            r="2"
            fill="#020617"
          />

          {/* Current Operating Point Tooltip Callout */}
          <g transform={`translate(${Math.min(580, Math.max(160, currentPt.x - 60))}, ${Math.max(20, currentPt.y - 35)})`}>
            <rect x="0" y="0" width="130" height="26" rx="4" fill="#090d16" stroke="#22d3ee" strokeWidth="1.2" />
            <text x="65" y="16" fill="#22d3ee" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {currentDuval.zoneCode}: ({currentDuval.pctCH4.toFixed(0)}%, {currentDuval.pctC2H4.toFixed(0)}%, {currentDuval.pctC2H2.toFixed(0)}%)
            </text>
          </g>

          {/* Vertex Labels & Gas Names */}
          {/* Top Vertex (%CH4) */}
          <text x={topV.x} y={topV.y - 12} fill="#fb923c" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            ▲ %CH₄ (Methane)
          </text>
          <text x={topV.x} y={topV.y + 20} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
            100%
          </text>

          {/* Bottom-Left Vertex (%C2H4) */}
          <text x={leftV.x - 20} y={leftV.y + 25} fill="#c084fc" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            ◄ %C₂H₄ (Ethylene)
          </text>
          <text x={leftV.x} y={leftV.y - 10} fill="#64748b" fontSize="10" fontFamily="monospace">
            100%
          </text>

          {/* Bottom-Right Vertex (%C2H2) */}
          <text x={rightV.x + 20} y={rightV.y + 25} fill="#f43f5e" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            %C₂H₂ (Acetylene) ►
          </text>
          <text x={rightV.x - 30} y={rightV.y - 10} fill="#64748b" fontSize="10" fontFamily="monospace">
            100%
          </text>
        </svg>

        {/* Active Coordinates Footer */}
        <div className="absolute bottom-2 left-2 right-2 bg-slate-900/95 border border-slate-800 rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              %CH₄: <strong className="text-orange-400">{currentDuval.pctCH4.toFixed(1)}%</strong>
            </span>
            <span className="text-slate-400">
              %C₂H₄: <strong className="text-purple-400">{currentDuval.pctC2H4.toFixed(1)}%</strong>
            </span>
            <span className="text-slate-400">
              %C₂H₂: <strong className="text-rose-400">{currentDuval.pctC2H2.toFixed(1)}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Zone:</span>
            <span className="px-2 py-0.5 rounded font-bold text-white bg-slate-800 border border-slate-700">
              {currentDuval.zone}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

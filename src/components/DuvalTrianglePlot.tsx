import React from 'react';
import { Triangle } from 'lucide-react';
import { DuvalCoordinates } from '../engine/dgaStandards';

interface DuvalTrianglePlotProps {
  currentDuval: DuvalCoordinates;
}

export const DuvalTrianglePlot: React.FC<DuvalTrianglePlotProps> = ({
  currentDuval,
}) => {
  // Triangle SVG Canvas Geometry (400x320)
  const topV = { x: 250, y: 35 };     // %CH4 = 100%
  const leftV = { x: 70, y: 285 };   // %C2H4 = 100%
  const rightV = { x: 430, y: 285 };  // %C2H2 = 100%

  // Barycentric coordinate projection
  const project = (ch4: number, c2h4: number, c2h2: number) => {
    const total = ch4 + c2h4 + c2h2;
    if (total <= 0) return { x: 250, y: 190 };
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

  // Standard Duval Triangle 1 Zones
  const DUVAL_ZONES = [
    { code: 'PD', label: 'PD', color: '#0284c7', points: toSvgPoints([[100, 0, 0], [98, 2, 0], [98, 0, 2]]) },
    { code: 'T1', label: 'T1 (<300°)', color: '#0d9488', points: toSvgPoints([[98, 2, 0], [80, 20, 0], [76, 20, 4], [96, 0, 4], [98, 0, 2]]) },
    { code: 'T2', label: 'T2 (300-700°)', color: '#d97706', points: toSvgPoints([[80, 20, 0], [50, 50, 0], [46, 50, 4], [76, 20, 4]]) },
    { code: 'T3', label: 'T3 (>700°)', color: '#dc2626', points: toSvgPoints([[50, 50, 0], [0, 100, 0], [0, 85, 15], [35, 50, 15], [46, 50, 4]]) },
    { code: 'DT', label: 'DT', color: '#9333ea', points: toSvgPoints([[76, 20, 4], [46, 50, 4], [35, 50, 15], [48, 23, 29], [64, 23, 13]]) },
    { code: 'D1', label: 'D1 (Spark)', color: '#ea580c', points: toSvgPoints([[87, 0, 13], [64, 23, 13], [48, 23, 29], [71, 0, 29]]) },
    { code: 'D2', label: 'D2 (Arc)', color: '#be123c', points: toSvgPoints([[71, 0, 29], [48, 23, 29], [35, 50, 15], [0, 85, 15], [0, 0, 100]]) },
  ];

  const currentPt = project(currentDuval.pctCH4, currentDuval.pctC2H4, currentDuval.pctC2H2);

  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Triangle className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Duval Triangle 1 &bull; Diagnostic Zones
          </h3>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
          Zone: {currentDuval.zoneCode}
        </span>
      </div>

      {/* Clean SVG Canvas */}
      <div className="w-full flex items-center justify-center bg-slate-950/80 rounded-lg border border-slate-800 p-2">
        <svg viewBox="0 0 500 320" className="w-full max-w-[460px] select-none" xmlns="http://www.w3.org/2000/svg">
          {/* Base Triangle */}
          <polygon
            points={`${topV.x},${topV.y} ${leftV.x},${leftV.y} ${rightV.x},${rightV.y}`}
            fill="#090d16"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Zones */}
          {DUVAL_ZONES.map((zone) => {
            const isMatch = currentDuval.zoneCode === zone.code;
            return (
              <polygon
                key={zone.code}
                points={zone.points}
                fill={zone.color}
                fillOpacity={isMatch ? 0.6 : 0.25}
                stroke={zone.color}
                strokeWidth={isMatch ? 2 : 1}
              >
                <title>{zone.label}</title>
              </polygon>
            );
          })}

          {/* Current Operating Point (Clean solid marker, no blinking) */}
          <circle
            cx={currentPt.x}
            cy={currentPt.y}
            r="6"
            fill="#22d3ee"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <circle cx={currentPt.x} cy={currentPt.y} r="2" fill="#020617" />

          {/* Vertex Labels */}
          {/* Top: %CH4 */}
          <text x={topV.x} y={topV.y - 10} fill="#fb923c" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            %CH₄ (Methane)
          </text>

          {/* Bottom-Left: %C2H4 */}
          <text x={leftV.x - 10} y={leftV.y + 18} fill="#c084fc" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            %C₂H₄ (Ethylene)
          </text>

          {/* Bottom-Right: %C2H2 */}
          <text x={rightV.x + 10} y={rightV.y + 18} fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            %C₂H₂ (Acetylene)
          </text>
        </svg>
      </div>

      {/* Clean Coordinates Footer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span>%CH₄: <strong className="text-orange-400">{currentDuval.pctCH4.toFixed(1)}%</strong></span>
          <span>%C₂H₄: <strong className="text-purple-400">{currentDuval.pctC2H4.toFixed(1)}%</strong></span>
          <span>%C₂H₂: <strong className="text-rose-400">{currentDuval.pctC2H2.toFixed(1)}%</strong></span>
        </div>
        <div className="text-slate-400">
          Classification: <strong className="text-white">{currentDuval.zone}</strong>
        </div>
      </div>
    </div>
  );
};

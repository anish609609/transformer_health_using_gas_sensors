import React from 'react';
import { Triangle } from 'lucide-react';
import { DuvalCoordinates } from '../engine/dgaStandards';

interface DuvalTrianglePlotProps {
  currentDuval: DuvalCoordinates;
}

export const DuvalTrianglePlot: React.FC<DuvalTrianglePlotProps> = ({
  currentDuval,
}) => {
  // Triangle SVG Canvas Geometry (540 x 360)
  const topV = { x: 270, y: 38 };     // %CH4 = 100% (Apex)
  const leftV = { x: 105, y: 300 };   // %C2H4 = 100% (Bottom-Left)
  const rightV = { x: 435, y: 300 };  // %C2H2 = 100% (Bottom-Right)

  // Barycentric coordinate projection
  const project = (ch4: number, c2h4: number, c2h2: number) => {
    const total = ch4 + c2h4 + c2h2;
    if (total <= 0) return { x: 270, y: 170 };
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

  // Standard Duval Triangle 1 Diagnostic Zones with centroids for text labels
  const DUVAL_ZONES = [
    { code: 'PD', label: 'PD (Partial Discharge)', color: '#0284c7', centroid: project(98.8, 0.6, 0.6), points: toSvgPoints([[100, 0, 0], [98, 2, 0], [98, 0, 2]]) },
    { code: 'T1', label: 'T1 (<300°C)', color: '#0d9488', centroid: project(88, 10, 2), points: toSvgPoints([[98, 2, 0], [80, 20, 0], [76, 20, 4], [96, 0, 4], [98, 0, 2]]) },
    { code: 'T2', label: 'T2 (300-700°C)', color: '#d97706', centroid: project(63, 34, 3), points: toSvgPoints([[80, 20, 0], [50, 50, 0], [46, 50, 4], [76, 20, 4]]) },
    { code: 'T3', label: 'T3 (>700°C)', color: '#dc2626', centroid: project(25, 68, 7), points: toSvgPoints([[50, 50, 0], [0, 100, 0], [0, 85, 15], [35, 50, 15], [46, 50, 4]]) },
    { code: 'DT', label: 'DT (Thermal/Electrical)', color: '#9333ea', centroid: project(52, 34, 14), points: toSvgPoints([[76, 20, 4], [46, 50, 4], [35, 50, 15], [48, 23, 29], [64, 23, 13]]) },
    { code: 'D1', label: 'D1 (Low Energy Spark)', color: '#ea580c', centroid: project(67, 12, 21), points: toSvgPoints([[87, 0, 13], [64, 23, 13], [48, 23, 29], [71, 0, 29]]) },
    { code: 'D2', label: 'D2 (High Energy Arc)', color: '#be123c', centroid: project(28, 26, 46), points: toSvgPoints([[71, 0, 29], [48, 23, 29], [35, 50, 15], [0, 85, 15], [0, 0, 100]]) },
  ];

  const currentPt = project(currentDuval.pctCH4, currentDuval.pctC2H4, currentDuval.pctC2H2);

  // Scale ticks (0, 20, 40, 60, 80, 100%)
  const majorTicks = [0, 20, 40, 60, 80, 100];
  const minorTicks = [10, 30, 50, 70, 90];
  const gridPercentages = [20, 40, 60, 80];

  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-3.5 flex flex-col justify-between shadow-lg h-full">
      {/* Header with Integrated Compact Axis Colors & Zone Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Triangle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200">
            Duval Triangle 1 &bull; Diagnostic Zones
          </h3>
        </div>

        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-slate-900 dark:border-slate-700 dark:text-cyan-300">
          Zone: {currentDuval.zoneCode}
        </span>
      </div>

      {/* Streamlined Single-Line Axis Color Legend */}
      <div className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-100/90 border border-slate-200 text-slate-700 dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-300 text-[11px] font-mono flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
            <span className="w-2.5 h-1 bg-orange-500 rounded-full" /> %CH₄
          </span>
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
            <span className="w-2.5 h-1 bg-purple-500 rounded-full" /> %C₂H₄
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
            <span className="w-2.5 h-1 bg-rose-500 rounded-full" /> %C₂H₂
          </span>
        </div>
        <div className="text-slate-600 dark:text-slate-400 text-[10px]">
          Classification: <strong className="text-slate-900 dark:text-white">{currentDuval.zone}</strong>
        </div>
      </div>

      {/* High-Clarity Scaled SVG Canvas */}
      <div className="w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950/80 rounded-lg border border-slate-200 dark:border-slate-800 p-1.5 overflow-hidden">
        <svg viewBox="0 0 540 350" className="w-full max-w-[440px] select-none" xmlns="http://www.w3.org/2000/svg">
          {/* Base Triangle Background */}
          <polygon
            points={`${topV.x},${topV.y} ${leftV.x},${leftV.y} ${rightV.x},${rightV.y}`}
            className="fill-white stroke-slate-300 dark:fill-[#090d16] dark:stroke-[#1e293b]"
            strokeWidth="1"
          />

          {/* Diagnostic Zones */}
          {DUVAL_ZONES.map((zone) => {
            const isMatch = currentDuval.zoneCode === zone.code;
            return (
              <polygon
                key={zone.code}
                points={zone.points}
                fill={zone.color}
                fillOpacity={isMatch ? 0.6 : 0.22}
                stroke={zone.color}
                strokeWidth={isMatch ? 2 : 1}
              >
                <title>{zone.label}</title>
              </polygon>
            );
          })}

          {/* Dotted Gridlines for 20%, 40%, 60%, 80% */}
          {gridPercentages.map((p) => {
            const ch4Left = project(p, 100 - p, 0);
            const ch4Right = project(p, 0, 100 - p);

            const c2h4Left = project(100 - p, p, 0);
            const c2h4Bottom = project(0, p, 100 - p);

            const c2h2Bottom = project(0, 100 - p, p);
            const c2h2Right = project(100 - p, 0, p);

            return (
              <g key={`grid-${p}`}>
                <line
                  x1={ch4Left.x} y1={ch4Left.y}
                  x2={ch4Right.x} y2={ch4Right.y}
                  stroke="#fb923c" strokeWidth="0.7" strokeDasharray="3 3" strokeOpacity="0.3"
                />
                <line
                  x1={c2h4Left.x} y1={c2h4Left.y}
                  x2={c2h4Bottom.x} y2={c2h4Bottom.y}
                  stroke="#c084fc" strokeWidth="0.7" strokeDasharray="3 3" strokeOpacity="0.3"
                />
                <line
                  x1={c2h2Bottom.x} y1={c2h2Bottom.y}
                  x2={c2h2Right.x} y2={c2h2Right.y}
                  stroke="#f43f5e" strokeWidth="0.7" strokeDasharray="3 3" strokeOpacity="0.3"
                />
              </g>
            );
          })}

          {/* Zone Codes rendered inside each polygon */}
          {DUVAL_ZONES.map((zone) => (
            <text
              key={`label-${zone.code}`}
              x={zone.centroid.x}
              y={zone.centroid.y}
              className="fill-slate-900 dark:fill-white font-mono font-bold"
              fillOpacity={currentDuval.zoneCode === zone.code ? 1 : 0.85}
              fontSize={zone.code === 'PD' ? '8.5' : '10'}
              textAnchor="middle"
              dominantBaseline="central"
              pointerEvents="none"
            >
              {zone.code}
            </text>
          ))}

          {/* AXIS 1: LEFT EDGE — %C₂H₄ (Ethylene) Top to Bottom-Left (Purple) */}
          <line
            x1={topV.x} y1={topV.y}
            x2={leftV.x} y2={leftV.y}
            stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round"
            className="stroke-purple-600 dark:stroke-purple-400"
          />

          {/* Left Edge Minor Ticks */}
          {minorTicks.map((p) => {
            const f = p / 100;
            const px = (1 - f) * topV.x + f * leftV.x;
            const py = (1 - f) * topV.y + f * leftV.y;
            return (
              <line
                key={`c2h4-minor-${p}`}
                x1={px} y1={py}
                x2={px - 4 * 0.860} y2={py - 4 * 0.510}
                stroke="#9333ea" strokeWidth="1" strokeOpacity="0.6"
                className="stroke-purple-600 dark:stroke-purple-400"
              />
            );
          })}

          {/* Left Edge Major Ticks & Numbers */}
          {majorTicks.map((p) => {
            const f = p / 100;
            const px = (1 - f) * topV.x + f * leftV.x;
            const py = (1 - f) * topV.y + f * leftV.y;
            const tx = px - 6 * 0.860;
            const ty = py - 6 * 0.510;
            const lx = px - 12 * 0.860;
            const ly = py - 12 * 0.510;
            return (
              <g key={`c2h4-${p}`}>
                <line x1={px} y1={py} x2={tx} y2={ty} stroke="#9333ea" strokeWidth="1.5" className="stroke-purple-600 dark:stroke-purple-400" />
                <text
                  x={lx} y={ly}
                  fill="#7c3aed"
                  className="fill-purple-700 dark:fill-purple-400"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                  textAnchor="end"
                  dominantBaseline="central"
                >
                  {p}%
                </text>
              </g>
            );
          })}

          {/* Left Axis Label */}
          <text
            x={125} y={150}
            transform="rotate(-59.4 125 150)"
            fill="#7c3aed"
            className="fill-purple-700 dark:fill-purple-400"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            ↙ %C₂H₄ Scale
          </text>

          {/* AXIS 2: BOTTOM EDGE — %C₂H₂ (Acetylene) Left to Right (Red) */}
          <line
            x1={leftV.x} y1={leftV.y}
            x2={rightV.x} y2={rightV.y}
            stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round"
            className="stroke-rose-600 dark:stroke-rose-400"
          />

          {/* Bottom Edge Minor Ticks */}
          {minorTicks.map((p) => {
            const f = p / 100;
            const px = (1 - f) * leftV.x + f * rightV.x;
            return (
              <line
                key={`c2h2-minor-${p}`}
                x1={px} y1={300}
                x2={px} y2={304}
                stroke="#e11d48" strokeWidth="1" strokeOpacity="0.6"
                className="stroke-rose-600 dark:stroke-rose-400"
              />
            );
          })}

          {/* Bottom Edge Major Ticks & Numbers */}
          {majorTicks.map((p) => {
            const f = p / 100;
            const px = (1 - f) * leftV.x + f * rightV.x;
            return (
              <g key={`c2h2-${p}`}>
                <line x1={px} y1={300} x2={px} y2={306} stroke="#e11d48" strokeWidth="1.5" className="stroke-rose-600 dark:stroke-rose-400" />
                <text
                  x={px} y={316}
                  fill="#e11d48"
                  className="fill-rose-700 dark:fill-rose-400"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="hanging"
                >
                  {p}%
                </text>
              </g>
            );
          })}

          {/* Bottom Axis Label */}
          <text
            x={270} y={338}
            fill="#e11d48"
            className="fill-rose-700 dark:fill-rose-400"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            → %C₂H₂ Scale
          </text>

          {/* AXIS 3: RIGHT EDGE — %CH₄ (Methane) Right to Top (Orange) */}
          <line
            x1={rightV.x} y1={rightV.y}
            x2={topV.x} y2={topV.y}
            stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round"
            className="stroke-orange-500 dark:stroke-orange-400"
          />

          {/* Right Edge Minor Ticks */}
          {minorTicks.map((p) => {
            const f = p / 100;
            const px = (1 - f) * rightV.x + f * topV.x;
            const py = (1 - f) * rightV.y + f * topV.y;
            return (
              <line
                key={`ch4-minor-${p}`}
                x1={px} y1={py}
                x2={px + 4 * 0.860} y2={py - 4 * 0.510}
                stroke="#ea580c" strokeWidth="1" strokeOpacity="0.6"
                className="stroke-orange-500 dark:stroke-orange-400"
              />
            );
          })}

          {/* Right Edge Major Ticks & Numbers */}
          {majorTicks.map((p) => {
            const f = p / 100;
            const px = (1 - f) * rightV.x + f * topV.x;
            const py = (1 - f) * rightV.y + f * topV.y;
            const tx = px + 6 * 0.860;
            const ty = py - 6 * 0.510;
            const lx = px + 12 * 0.860;
            const ly = py - 12 * 0.510;
            return (
              <g key={`ch4-${p}`}>
                <line x1={px} y1={py} x2={tx} y2={ty} stroke="#ea580c" strokeWidth="1.5" className="stroke-orange-500 dark:stroke-orange-400" />
                <text
                  x={lx} y={ly}
                  fill="#ea580c"
                  className="fill-orange-700 dark:fill-orange-400"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                  textAnchor="start"
                  dominantBaseline="central"
                >
                  {p}%
                </text>
              </g>
            );
          })}

          {/* Right Axis Label */}
          <text
            x={415} y={150}
            transform="rotate(59.4 415 150)"
            fill="#ea580c"
            className="fill-orange-700 dark:fill-orange-400"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            ↗ %CH₄ Scale
          </text>

          {/* Apex Summary Label */}
          <text x={topV.x} y={topV.y - 18} fill="#ea580c" className="fill-orange-700 dark:fill-orange-400" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            Apex: 100% CH₄
          </text>

          {/* Current Operating Point Marker */}
          <circle
            cx={currentPt.x}
            cy={currentPt.y}
            r="5.5"
            fill="#06b6d4"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <circle cx={currentPt.x} cy={currentPt.y} r="1.8" fill="#020617" className="fill-slate-900 dark:fill-slate-950" />
        </svg>
      </div>

      {/* Streamlined Coordinates Footer */}
      <div className="bg-slate-100/90 border border-slate-200 text-slate-700 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-300 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <span>%CH₄: <strong className="text-orange-600 dark:text-orange-400">{currentDuval.pctCH4.toFixed(1)}%</strong></span>
          <span>%C₂H₄: <strong className="text-purple-600 dark:text-purple-400">{currentDuval.pctC2H4.toFixed(1)}%</strong></span>
          <span>%C₂H₂: <strong className="text-rose-600 dark:text-rose-400">{currentDuval.pctC2H2.toFixed(1)}%</strong></span>
        </div>
      </div>
    </div>
  );
};

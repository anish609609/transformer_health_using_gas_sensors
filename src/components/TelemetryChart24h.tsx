import React, { useState } from 'react';
import { LineChart as LineChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TelemetryPoint } from '../engine/scenarioPresets';
import { GasKey, GAS_NAMES, GAS_METADATA } from '../engine/dgaStandards';

interface TelemetryChart24hProps {
  telemetryData: TelemetryPoint[];
}

export const TelemetryChart24h: React.FC<TelemetryChart24hProps> = ({
  telemetryData,
}) => {
  const [isLogScale, setIsLogScale] = useState(false);
  const [showIEEEThresholds, setShowIEEEThresholds] = useState(false);
  const [showTDCG, setShowTDCG] = useState(true);

  // Visibility state for each gas
  const [visibleGases, setVisibleGases] = useState<Record<GasKey, boolean>>({
    H2: true,
    CH4: true,
    C2H6: true,
    C2H4: true,
    C2H2: true,
    CO: true,
    CO2: true,
  });

  const toggleGas = (gas: GasKey) => {
    setVisibleGases((prev) => ({ ...prev, [gas]: !prev[gas] }));
  };

  const setAllGases = (visible: boolean) => {
    setVisibleGases({
      H2: visible,
      CH4: visible,
      C2H6: visible,
      C2H4: visible,
      C2H2: visible,
      CO: visible,
      CO2: visible,
    });
  };

  // Prepare chart data with log transformation if selected
  const chartData = telemetryData.map((pt) => {
    const row: Record<string, number | string> = {
      hourLabel: pt.hourLabel,
      hourIndex: pt.hourIndex,
    };

    for (const gas of GAS_NAMES) {
      const rawVal = pt[gas] ?? 0;
      row[gas] = isLogScale ? Math.log10(Math.max(0.1, rawVal)) : rawVal;
      row[`${gas}_raw`] = rawVal;
    }

    const tdcgVal = pt.tdcg ?? 0;
    row.TDCG = isLogScale ? Math.log10(Math.max(0.1, tdcgVal)) : tdcgVal;
    row.TDCG_raw = tdcgVal;

    return row;
  });

  // Log axis tick formatter
  const formatYAxis = (val: number) => {
    if (!isLogScale) {
      if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
      return val.toFixed(0);
    }
    const pow = Math.pow(10, val);
    if (pow >= 1000) return `${(pow / 1000).toFixed(0)}k`;
    if (pow < 1) return pow.toFixed(1);
    return pow.toFixed(0);
  };

  return (
    <div className="bg-scada-card border border-scada-border rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      {/* Header & Scale Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <LineChartIcon className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            24-Hour Multi-Gas Telemetry Waveform Trend &bull; Rate-of-Rise
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Linear vs Log Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setIsLogScale(false)}
              className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                !isLogScale
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => setIsLogScale(true)}
              className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                isLogScale
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log₁₀ Scale
            </button>
          </div>

          {/* IEEE Threshold line toggle */}
          <button
            onClick={() => setShowIEEEThresholds(!showIEEEThresholds)}
            className={`px-2 py-1 rounded text-xs font-mono border transition ${
              showIEEEThresholds
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            IEEE Limits
          </button>
        </div>
      </div>

      {/* Gas Trace Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
        <span className="text-[11px] text-slate-500 uppercase mr-1">Traces:</span>

        {GAS_NAMES.map((gas: GasKey) => {
          const meta = GAS_METADATA[gas];
          const isVisible = visibleGases[gas];
          return (
            <button
              key={gas}
              onClick={() => toggleGas(gas)}
              className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 text-[11px] ${
                isVisible
                  ? 'bg-slate-800/90 text-white border-slate-700'
                  : 'bg-slate-950/40 text-slate-600 border-slate-800/60 line-through'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isVisible ? meta.color : '#475569' }}
              />
              <span>{meta.chemical}</span>
            </button>
          );
        })}

        {/* TDCG Pill */}
        <button
          onClick={() => setShowTDCG(!showTDCG)}
          className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 text-[11px] ${
            showTDCG
              ? 'bg-slate-800/90 text-slate-200 border-slate-700'
              : 'bg-slate-950/40 text-slate-600 border-slate-800/60 line-through'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          <span>TDCG</span>
        </button>

        <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
          <button onClick={() => setAllGases(true)} className="hover:text-cyan-400">
            [All]
          </button>
          <span>/</span>
          <button onClick={() => setAllGases(false)} className="hover:text-cyan-400">
            [None]
          </button>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

            <XAxis
              dataKey="hourLabel"
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              interval={3}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              tickFormatter={formatYAxis}
              domain={isLogScale ? [-1, 4.2] : [0, 'auto']}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="bg-slate-950/95 border border-slate-700/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-md font-mono text-xs z-50">
                    <div className="text-cyan-400 font-bold mb-1.5 border-b border-slate-800 pb-1">
                      Timeline: {label}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {payload.map((entry: any) => {
                        const gas = entry.dataKey as string;
                        const raw = entry.payload[`${gas}_raw`];
                        return (
                          <div key={gas} className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1" style={{ color: entry.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              {gas}:
                            </span>
                            <span className="font-bold text-white">
                              {raw !== undefined ? Number(raw).toFixed(gas === 'C2H2' ? 1 : 0) : ''} ppm
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />

            {/* Render Lines for Active Gases */}
            {GAS_NAMES.map((gas: GasKey) => {
              if (!visibleGases[gas]) return null;
              const meta = GAS_METADATA[gas];
              const isAcetylene = gas === 'C2H2';
              return (
                <Line
                  key={gas}
                  type="monotone"
                  dataKey={gas}
                  name={meta.chemical}
                  stroke={meta.color}
                  strokeWidth={isAcetylene ? 3 : 1.8}
                  strokeDasharray={isAcetylene ? '4 2' : undefined}
                  dot={isAcetylene ? { r: 3, fill: meta.color } : false}
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1.5 }}
                  isAnimationActive={false}
                />
              );
            })}

            {/* Optional TDCG Line */}
            {showTDCG && (
              <Line
                type="monotone"
                dataKey="TDCG"
                name="TDCG"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Optional IEEE Threshold Reference Lines */}
            {showIEEEThresholds &&
              GAS_NAMES.map((gas: GasKey) => {
                if (!visibleGases[gas]) return null;
                const meta = GAS_METADATA[gas];
                const yVal = isLogScale ? Math.log10(meta.limit) : meta.limit;
                return (
                  <ReferenceLine
                    key={`ref-${gas}`}
                    y={yVal}
                    stroke={meta.color}
                    strokeDasharray="2 3"
                    strokeOpacity={0.6}
                  />
                );
              })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

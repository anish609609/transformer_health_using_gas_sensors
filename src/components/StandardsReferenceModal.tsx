import React, { useState } from 'react';
import { X, BookOpen, FileText, Globe, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StandardsReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'ieee' | 'iec';
}

export const StandardsReferenceModal: React.FC<StandardsReferenceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'ieee',
}) => {
  const [activeTab, setActiveTab] = useState<'ieee' | 'iec'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-scada-card border border-scada-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-wide">
                DGA Standards &amp; Regulatory Learning Guide
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Dissolved Gas Analysis Interpretation &bull; Transformer Diagnostic Context
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Reference Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/90 px-4 pt-2 gap-2">
          {/* Tab 1: IEEE C57.104 */}
          <button
            onClick={() => setActiveTab('ieee')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg transition flex items-center gap-2 border-t border-x ${
              activeTab === 'ieee'
                ? 'bg-scada-card text-cyan-400 border-slate-700 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tab 1: IEEE C57.104 &amp; Gas Thresholds</span>
          </button>

          {/* Tab 2: IEC 60599 & IEC 61850 */}
          <button
            onClick={() => setActiveTab('iec')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg transition flex items-center gap-2 border-t border-x ${
              activeTab === 'iec'
                ? 'bg-scada-card text-cyan-400 border-slate-700 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Tab 2: IEC 60599 &amp; IEC 61850 Protocols</span>
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-200 leading-relaxed">
          
          {/* ========================================================================= */}
          {/* TAB 1: IEEE C57.104-2019 & THRESHOLDS                                    */}
          {/* ========================================================================= */}
          {activeTab === 'ieee' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <h3 className="text-sm font-bold font-mono text-cyan-300 uppercase tracking-wide flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  IEEE C57.104-2019 DGA Guide Overview
                </h3>
                <p className="text-slate-300">
                  The <strong>IEEE C57.104-2019</strong> standard defines criteria for interpreting dissolved gas levels generated in mineral oil-immersed transformers. It establishes 90th and 95th percentile cumulative concentration benchmarks, 24-hour rate of generation thresholds (&Delta;ppm/24h), and the Total Dissolved Combustible Gas (TDCG) status condition hierarchy.
                </p>
              </div>

              {/* Table 1: Gas Limits */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  IEEE Table 1: 90th Percentile Baseline &amp; Condition 3 Limits
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800 shadow-sm">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Gas Key</th>
                        <th className="py-2.5 px-3">Chemical</th>
                        <th className="py-2.5 px-3">IEEE 90th Limit</th>
                        <th className="py-2.5 px-3">Condition 3 Limit</th>
                        <th className="py-2.5 px-3">Primary Fault Mechanism</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-bold text-white">Hydrogen</td>
                        <td className="py-2 px-3 text-cyan-400 font-bold">H₂</td>
                        <td className="py-2 px-3 text-emerald-400">100 ppm</td>
                        <td className="py-2 px-3 text-amber-400">300 ppm</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Corona partial discharge, electrolysis, sparking</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-bold text-white">Methane</td>
                        <td className="py-2 px-3 text-orange-400 font-bold">CH₄</td>
                        <td className="py-2 px-3 text-emerald-400">120 ppm</td>
                        <td className="py-2 px-3 text-amber-400">400 ppm</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Low-to-medium thermal oil decomposition (&lt;300°C)</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-bold text-white">Ethane</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">C₂H₆</td>
                        <td className="py-2 px-3 text-emerald-400">65 ppm</td>
                        <td className="py-2 px-3 text-amber-400">150 ppm</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Low-temperature oil cracking (&lt;300°C)</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-bold text-white">Ethylene</td>
                        <td className="py-2 px-3 text-purple-400 font-bold">C₂H₄</td>
                        <td className="py-2 px-3 text-emerald-400">50 ppm</td>
                        <td className="py-2 px-3 text-amber-400">150 ppm</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">High-temperature thermal fault (&gt;300°C)</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50 bg-rose-950/15">
                        <td className="py-2 px-3 font-bold text-white">Acetylene</td>
                        <td className="py-2 px-3 text-rose-400 font-bold">C₂H₂</td>
                        <td className="py-2 px-3 text-rose-400 font-bold">1 ppm</td>
                        <td className="py-2 px-3 text-rose-400 font-bold">3 ppm</td>
                        <td className="py-2 px-3 text-rose-300 font-sans font-semibold">Severe electrical arcing &amp; flashover (&gt;1000°C)</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-bold text-white">Carbon Monoxide</td>
                        <td className="py-2 px-3 text-teal-400 font-bold">CO</td>
                        <td className="py-2 px-3 text-emerald-400">350 ppm</td>
                        <td className="py-2 px-3 text-amber-400">800 ppm</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Kraft paper insulation thermal pyrolysis</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-bold text-white">Carbon Dioxide</td>
                        <td className="py-2 px-3 text-violet-400 font-bold">CO₂</td>
                        <td className="py-2 px-3 text-emerald-400">2500 ppm</td>
                        <td className="py-2 px-3 text-amber-400">5000 ppm</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Paper aging &amp; normal atmospheric oxidation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TDCG Hierarchy Cards */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Total Dissolved Combustible Gas (TDCG) Levels
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">Condition 1</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">&le; 720 ppm</span>
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      Normal baseline operation. Oil degradation within standard limits.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/40">
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block">Condition 2</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">721 – 1920 ppm</span>
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      Elevated combustible gas level. Establish generation rate trend.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-950/20 border border-orange-500/40">
                    <span className="text-[10px] font-mono font-bold uppercase text-orange-400 block">Condition 3</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">1921 – 4630 ppm</span>
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      High decomposition level. Increase sampling frequency to monthly/weekly.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-950/25 border border-rose-500/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-rose-400 block">Condition 4</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">&gt; 4630 ppm</span>
                    <p className="text-[11px] text-slate-200 font-sans mt-1 font-semibold">
                      Excessive decomposition. Immediate load curtailment and inspection.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paper Health Rule */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-mono font-bold text-xs text-pink-300 uppercase">
                    Cellulose Kraft Paper Insulation Health Index (CO₂ / CO Ratio)
                  </h5>
                  <p className="text-slate-300 mt-1">
                    Normal healthy paper degradation yields a CO₂/CO ratio between <strong>3.0 and 10.0</strong>. If the ratio drops <strong>&lt; 3.0</strong> accompanied by elevated CO &gt; 350 ppm, active paper insulation pyrolysis is occurring, threatening catastrophic turn-to-turn dielectric breakdown.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: IEC 60599 & IEC 61850 PROTOCOLS (DGA CONTEXT)                      */}
          {/* ========================================================================= */}
          {activeTab === 'iec' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <h3 className="text-sm font-bold font-mono text-cyan-300 uppercase tracking-wide flex items-center gap-2 mb-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  IEC 60599 &amp; IEC 61850 Substation Architecture
                </h3>
                <p className="text-slate-300">
                  <strong>IEC 60599</strong> governs the diagnostic interpretation of dissolved gases in mineral oil-filled electrical equipment via characteristic gas ratios and the Duval Triangle method. <strong>IEC 61850</strong> standardizes how online DGA optical sensors communicate continuous telemetry and protective interlocks to substation automation systems.
                </p>
              </div>

              {/* Duval Triangle 1 Fault Classifications */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  IEC 60599 &bull; Duval Triangle 1 Diagnostic Coordinate Zones
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-sky-950/20 border border-sky-500/40">
                    <span className="font-bold text-sky-400 text-xs block">PD: Partial Discharge</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">%CH₄ &ge; 98%</span>
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      Discharges in gas-filled cavities, voids, or micro-bubbles in paper/oil.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-teal-950/20 border border-teal-500/40">
                    <span className="font-bold text-teal-400 text-xs block">T1: Thermal Fault &lt;300°C</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">%C₂H₄ &lt; 20%, %C₂H₂ &lt; 4%</span>
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      Mild overheating, blocked oil ducts, cooling radiator deficiency.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/40">
                    <span className="font-bold text-amber-400 text-xs block">T2: Thermal Fault 300–700°C</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">20% &le; %C₂H₄ &lt; 50%, %C₂H₂ &lt; 4%</span>
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      Core ground circulating currents, loose winding bus connections.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/40">
                    <span className="font-bold text-red-400 text-xs block">T3: Thermal Fault &gt;700°C</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">%C₂H₄ &ge; 50%, %C₂H₂ &lt; 15%</span>
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      Magnetic core short circuits, severe tank shunt overheating.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-orange-950/20 border border-orange-500/40">
                    <span className="font-bold text-orange-400 text-xs block">D1: Low-Energy Discharge</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">%C₂H₄ &lt; 23%, %C₂H₂ &ge; 13%</span>
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      Sparking in tap changer selector contacts, floating metallic particles.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-950/25 border border-rose-500/50">
                    <span className="font-bold text-rose-400 text-xs block">D2: High-Energy Arc Discharge</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">%C₂H₄ &ge; 23%, %C₂H₂ &ge; 29%</span>
                    <p className="text-[11px] text-slate-200 font-sans mt-1 font-semibold">
                      Flashover, turn-to-turn winding puncture, explosive gas risk.
                    </p>
                  </div>
                </div>
              </div>

              {/* IEC 61850 Logical Nodes for DGA Context */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  IEC 61850 Online DGA Telemetry Logical Node Hierarchy
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-start gap-2.5 border-b border-slate-800/80 pb-2.5">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold shrink-0">
                      SIML
                    </span>
                    <div>
                      <strong className="text-white">Sensor for Insulation Medium Liquid (Online DGA IED)</strong>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                        Transmits analog gas concentrations (<code className="text-cyan-300">H2Ppm</code>, <code className="text-cyan-300">CH4Ppm</code>, <code className="text-cyan-300">C2H4Ppm</code>, <code className="text-cyan-300">C2H2Ppm</code>) with high precision (<code className="text-slate-300">mag.f</code>) and quality timestamps.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-b border-slate-800/80 pb-2.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                      GGIO
                    </span>
                    <div>
                      <strong className="text-white">Generic Process I/O &bull; Automated Protective Interlocks</strong>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                        Controls trip interlock contacts (<code className="text-amber-300">GGIO.TripInterlock</code>) and auto load-curtailment signals dispatched across the substation optical fiber bus.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                      GOOSE
                    </span>
                    <div>
                      <strong className="text-white">Generic Object Oriented Substation Events (Peer-to-Peer &lt;4ms)</strong>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                        Ensures zero-latency transmission of critical condition alarms directly to feeder breakers and Energy Management Systems (EMS).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between font-mono text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Strictly limited to DGA &bull; Power Transformer Diagnostics</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

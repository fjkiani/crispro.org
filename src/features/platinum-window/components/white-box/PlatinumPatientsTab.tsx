import React, { useState } from 'react';
import { Users, FileJson, Activity, AlertTriangle, ChevronRight, Stethoscope } from 'lucide-react';
import { usePlatinumArtifact } from '../../hooks/usePlatinumArtifact';

const PATIENTS = [
  "TCGA-04-1337-01", "TCGA-04-1517-01", "TCGA-04-1542-01", "TCGA-09-0366-01",
  "TCGA-09-1659-01", "TCGA-09-1662-01", "TCGA-09-1667-01", "TCGA-09-1673-01",
  "TCGA-09-1674-01", "TCGA-09-2051-01", "TCGA-10-0934-01", "TCGA-10-0938-01",
  "TCGA-13-0724-01", "TCGA-13-0727-01", "TCGA-13-0730-01", "TCGA-13-0801-01",
  "TCGA-13-0804-01", "TCGA-13-0883-01", "TCGA-13-0885-01", "TCGA-13-1408-01",
  "TCGA-13-1411-01", "TCGA-13-2060-01", "TCGA-20-1683-01", "TCGA-20-1684-01",
  "TCGA-20-1685-01", "TCGA-24-1434-01", "TCGA-24-2293-01", "TCGA-29-1695-01"
];

export function PlatinumPatientsTab() {
  const [activeId, setActiveId] = useState<string>(PATIENTS[0]);
  const { data, loading, error } = usePlatinumArtifact('data/sample_clinical_briefs', `${activeId}.json`);

  return (
    <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 lg:p-12 shadow-sm min-h-[600px]">
      
      {/* Header */}
      <div className="mb-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">TCGA Patient Briefs</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Intervention Simulation Ledger</p>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed font-medium">
          Explore the exact JSON simulation briefs generated for the 28 TCGA high-grade serous ovarian cancer cases. 
          Each brief details the baseline transcriptomics, predicted survival threshold, and the simulated response 
          to Nintedanib / Metformin biological augmentation.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Patient Selector */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Select TCGA Case</h3>
           <div className="space-y-1 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
             {PATIENTS.map(id => {
               const isActive = activeId === id;
               return (
                 <button
                   key={id}
                   onClick={() => setActiveId(id)}
                   className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-mono text-sm font-bold transition-all ${
                     isActive 
                     ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm relative z-10'
                     : 'bg-white text-slate-500 border-2 border-transparent hover:bg-slate-50 hover:border-slate-200'
                   }`}
                 >
                   {id}
                   <ChevronRight size={16} className={`transition-opacity ${isActive ? 'opacity-100 text-blue-500' : 'opacity-0'}`} />
                 </button>
               );
             })}
           </div>
        </div>

        {/* Right Side: Rendered Brief & JSON Viewer */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Top Panel: High-level readout if data exists */}
          {data && !loading && !error && (
            <div className="p-6 rounded-2xl border-2 border-slate-200 bg-slate-50">
               <div className="flex items-center gap-3 mb-4">
                 <Stethoscope size={20} className="text-indigo-600" />
                 <h3 className="font-black text-lg text-slate-800">Clinical Simulation Summary</h3>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">PLATINUM_SCORE</span>
                    <span className="font-mono font-bold text-lg text-slate-700">{data.PLATINUM_SCORE?.toFixed(4) || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">FAP Z-Score</span>
                    <span className="font-mono font-bold text-lg text-slate-700">{data.FAP_zscore?.toFixed(3) || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Tier</span>
                    <span className="font-bold text-lg text-slate-700">{data.risk_tier || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Window Status</span>
                    <span className="font-bold text-indigo-700 text-[13px]">{data.window_status || 'N/A'}</span>
                  </div>
               </div>
            </div>
          )}

          {/* Bottom Panel: Deep JSON Viewer */}
          <div className="flex-1 border-2 border-slate-200 rounded-[20px] overflow-hidden bg-slate-900 shadow-md">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                 <FileJson size={16} className="text-slate-400" />
                 <span className="text-xs font-mono font-bold text-slate-300">{activeId}.json</span>
              </div>
              <Activity size={16} className="text-emerald-500 animate-pulse" />
            </div>
            <div className="p-4 h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full text-blue-500/50 animate-pulse font-mono text-sm">
                   &gt; Syncing simulated biomarker pipeline...
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full gap-3 text-rose-400 bg-rose-900/20 p-6 rounded-2xl border border-rose-800/50 mx-4">
                  <AlertTriangle size={20} />
                  <span className="font-mono font-bold text-sm bg-rose-950/50 px-3 py-1 rounded-md">{error}</span>
                </div>
              ) : (
                <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

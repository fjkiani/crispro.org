import React, { useState } from 'react';
import { Clock, AlertTriangle, FastForward, Activity, Hexagon, Database, ChevronDown, ChevronUp } from 'lucide-react';

import { usePlatinumArtifact } from '../../hooks/usePlatinumArtifact';

function SimulationArtifactViewer() {
  const { data, loading, error } = usePlatinumArtifact('data/intervention_simulation', 'window_timing_v2_simulation.json');
  if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse font-mono text-sm">&gt; Fetching clock simulation artifact...</div>;
  if (error) return <div className="p-8 text-center text-rose-500 font-mono text-sm">[ERROR] {error}</div>;
  return (
     <div className="p-6 bg-slate-900 text-indigo-400 font-mono text-xs rounded-xl overflow-x-auto mt-6 shadow-inner border border-slate-800">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
           <span className="text-slate-400 flex items-center gap-2"><Database size={14} /> window_timing_v2_simulation.json</span>
        </div>
        <pre>{JSON.stringify(data, null, 2)}</pre>
     </div>
  );
}

interface PlatinumClockTabProps {
  data: any | null;
}

export function PlatinumClockTab({ data }: PlatinumClockTabProps) {
  const [showArtifact, setShowArtifact] = useState(false);
  if (!data) {
    return (
      <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 lg:p-12 shadow-sm min-h-[600px] flex flex-col items-center justify-center">
        <Clock className="w-16 h-16 text-slate-200 mb-6" />
        <h3 className="text-xl font-black tracking-tight text-slate-800">Awaiting Patient Data</h3>
        <p className="text-slate-500 font-medium text-center mt-2 max-w-sm">
          Run the Score Engine to generate the biological timing simulation and predict FAP-mediated resistance trajectories.
        </p>
      </div>
    );
  }

  const {
    window_status,
    cycles_until_window_closes,
    cycles_remaining,
    weeks_remaining,
    intervention_deadline,
    FAP_zscore,
  } = data;

  const isClosed = window_status === 'CLOSED' || window_status === 'NEVER_OPEN' || window_status === 'CLOSED_RECENTLY';
  
  // Calculate simulated cycle progression (0.10 shift per cycle)
  const currentFap = FAP_zscore;
  const projectedFapCycles = Array.from({ length: 6 }).map((_, i) => currentFap + (i * 0.10));

  return (
    <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 lg:p-12 shadow-sm min-h-[600px]">
      
      {/* Header */}
      <div className="mb-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Biological FAP Clock</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Stromal Resistance Simulation</p>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed font-medium">
          Repeated exposure to genotoxic platinum stress accelerates CAF maturation. The biological clock 
          computes a deterministic +0.10 FAP z-score shift per cycle, projecting exactly when the stromal 
          barrier will permanently seal the tumor microenvironment against immune infiltration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Timing Status Card */}
        <div className={`p-8 rounded-3xl border-2 ${isClosed ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-start gap-4 mb-6">
             <div className="mt-1">
               {isClosed ? <AlertTriangle size={28} className="text-rose-600" /> : <FastForward size={28} className="text-emerald-600" />}
             </div>
             <div>
               <h3 className={`text-xl font-black tracking-tight ${isClosed ? 'text-rose-800' : 'text-emerald-800'}`}>
                 {window_status.replace('_', ' ')}
               </h3>
               <p className={`text-sm font-bold uppercase tracking-widest mt-1 ${isClosed ? 'text-rose-600/80' : 'text-emerald-600/80'}`}>
                 Window Status
               </p>
             </div>
          </div>
          
          <div className="space-y-4">
             <div className="flex justify-between items-center pb-4 border-b border-black/5">
                <span className={`font-bold ${isClosed ? 'text-rose-700' : 'text-emerald-700'}`}>Timeline Deadline</span>
                <span className="font-mono font-bold">{intervention_deadline || 'N/A'}</span>
             </div>
             <div className="flex justify-between items-center pb-4 border-b border-black/5">
                <span className={`font-bold ${isClosed ? 'text-rose-700' : 'text-emerald-700'}`}>Cycles Remaining</span>
                <span className="font-mono font-bold">{cycles_remaining !== null ? cycles_remaining : 0} cycles</span>
             </div>
             <div className="flex justify-between items-center">
                <span className={`font-bold ${isClosed ? 'text-rose-700' : 'text-emerald-700'}`}>Weeks Remaining</span>
                <span className="font-mono font-bold">{weeks_remaining !== null ? weeks_remaining : 0} weeks</span>
             </div>
          </div>
        </div>

        {/* Dynamic Shift Visualizer */}
        <div className="p-8 rounded-3xl border-2 bg-slate-50 border-slate-200">
           <div className="flex items-start gap-4 mb-6">
             <div className="mt-1">
               <Activity size={28} className="text-indigo-600" />
             </div>
             <div>
               <h3 className="text-xl font-black tracking-tight text-slate-800">
                 FAP Kinetic Shift
               </h3>
               <p className="text-sm font-bold uppercase tracking-widest mt-1 text-slate-500">
                 +0.10$\sigma$ Per Cycle
               </p>
             </div>
          </div>

          <div className="space-y-3">
             {projectedFapCycles.map((val, idx) => {
               const aboveThreshold = val > 0.65; // Example threshold from clock mechanics
               return (
                 <div key={idx} className="flex items-center gap-4">
                    <span className="font-bold text-slate-500 w-20 text-right text-sm">
                      {idx === 0 ? 'Current' : `+${idx} Cycle${idx>1?'s':''}`}
                    </span>
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden flex">
                       <div 
                         className={`h-full transition-all duration-500 ${aboveThreshold ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                         style={{ width: `${Math.min(100, Math.max(0, (val + 2) * 25))}%` }} 
                       />
                    </div>
                    <span className={`font-mono font-bold w-16 text-sm ${aboveThreshold ? 'text-rose-600' : 'text-indigo-600'}`}>
                      {val.toFixed(2)}
                    </span>
                 </div>
               );
             })}
          </div>
        </div>

      </div>

      <div className="border-t-2 border-slate-100 mt-8 pt-8">
         <button onClick={() => setShowArtifact(!showArtifact)} 
                 className="flex items-center gap-3 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
             <Database size={18} />
             {showArtifact ? 'Hide Raw Simulation Envelope (JSON)' : 'Drill-Down: View Raw Simulation Envelope (JSON)'}
             {showArtifact ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
         </button>
         {showArtifact && <SimulationArtifactViewer />}
      </div>
    </div>
  );
}

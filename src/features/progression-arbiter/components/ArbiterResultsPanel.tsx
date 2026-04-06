import React, { useMemo } from 'react';
import { ChevronRight, Database } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import type { ArbiterScoreResponse } from '../types/arbiter';

interface Props {
  data: ArbiterScoreResponse;
}

export default function ArbiterResultsPanel({ data }: Props) {
  
  // Transform term_contributions map into sorted array for Recharts
  const features = useMemo(() => {
    return Object.entries(data.term_contributions)
      .map(([name, value]) => ({ 
        name: name.replace('img_', '').replace('tx_', ''), // Clean label
        value 
      }))
      .sort((a, b) => a.value - b.value);
  }, [data.term_contributions]);

  const isHighRisk = data.risk_bucket === 'HIGH';
  const isLowRisk = data.risk_bucket === 'LOW';
  
  // Dynamic styling mapping
  const colorMap = {
    bgCard: isLowRisk ? 'border-emerald-500' : isHighRisk ? 'border-red-500' : 'border-amber-500',
    bgHeader: isLowRisk ? 'bg-emerald-50/30' : isHighRisk ? 'bg-red-50/30' : 'bg-amber-50/30',
    pillBg: isLowRisk ? 'bg-emerald-100' : isHighRisk ? 'bg-red-100' : 'bg-amber-100',
    textMain: isLowRisk ? 'text-emerald-600' : isHighRisk ? 'text-red-600' : 'text-amber-600',
    decoration: isLowRisk ? 'decoration-emerald-300 text-emerald-600' : isHighRisk ? 'decoration-red-300 text-red-600' : 'decoration-amber-300 text-amber-600',
    borderDiv: isLowRisk ? 'border-emerald-200/50' : isHighRisk ? 'border-red-200/50' : 'border-amber-200/50',
    probText: isLowRisk ? 'text-emerald-400' : isHighRisk ? 'text-red-400' : 'text-amber-400',
    subtitle: isLowRisk ? 'Likely Pseudo-Progression' : isHighRisk ? 'Confidence True Progression' : 'Indeterminate / Mixed Response'
  };

  return (
    <div className="lg:col-span-5 space-y-4 transition-all duration-1000 transform opacity-100 translate-y-0">
      
      {/* Risk Level Card */}
      <section className={`bg-white border-4 ${colorMap.bgCard} rounded-[32px] shadow-2xl flex flex-col overflow-hidden`}>
        <div className={`p-6 flex flex-col gap-4 ${colorMap.bgHeader}`}>
          <div className="flex justify-between items-start">
            <span className={`text-xs font-black ${colorMap.textMain} uppercase tracking-[0.2em] ${colorMap.pillBg} px-3 py-0.5 rounded-full`}>
              Calculated Risk Level
            </span>
            <span className="text-xs font-bold text-slate-400 italic">n=239 validated</span>
          </div>
          <h3 className={`text-6xl font-black leading-none ${colorMap.textMain} tracking-tighter`}>
            {data.risk_bucket} RISK
          </h3>
          <p className="text-xl font-black text-slate-800 leading-tight">
            — <span className={`underline decoration-2 underline-offset-4 ${colorMap.decoration}`}>{colorMap.subtitle}</span>
          </p>
          <div className={`pt-4 border-t ${colorMap.borderDiv} flex items-center gap-2 text-blue-700 font-black text-xl italic uppercase tracking-tighter`}>
              <ChevronRight size={24} strokeWidth={3} />
              {data.recommendation.replace(/_/g, ' ')}
          </div>
        </div>
        
        <div className="bg-slate-900 p-6 flex flex-col items-center justify-center text-center min-h-[160px]">
          <span className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-2">P(True Progression)</span>
          <div className="text-6xl font-black text-white">
            {(data.p_true_progression * 100).toFixed(1)}<span className={`text-2xl ${colorMap.probText}`}>%</span>
          </div>
          <div className={`mt-4 text-base font-mono font-black ${colorMap.probText} bg-white/5 px-4 py-1.5 rounded-xl border border-white/10 uppercase tracking-widest`}>
            Logit: {data.logit.toFixed(4)}
          </div>
        </div>
      </section>

      {/* Statistical Drivers Mini-Chart */}
      <section className="bg-white border-2 border-slate-200 rounded-[28px] p-6 shadow-sm">
        <header className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
             <Database size={20} className="text-blue-600"/>
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Drivers</h3>
           </div>
           <span className="text-[10px] font-black text-slate-400 uppercase">Impact Score</span>
        </header>
        
        <div className="h-40 w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={features} margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
              {/* Domain dynamic based on features map, ensuring 0 is visible */}
              <XAxis type="number" hide domain={['dataMin - 1', 'dataMax + 1']} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} width={90}/>
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {features.map((entry, index) => (
                  <Cell key={index} fill={entry.value < 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  );
}

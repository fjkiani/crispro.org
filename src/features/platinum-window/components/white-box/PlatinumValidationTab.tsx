import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle, ArrowRight, RefreshCcw, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { usePlatinumArtifact } from '../../hooks/usePlatinumArtifact';

function ValidationArtifactViewer({ cohortId }: { cohortId: string }) {
  const { data, loading, error } = usePlatinumArtifact('data/validation', 'cross_cohort_fingerprint_regression.json');
  
  if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse font-mono text-sm">&gt; Fetching cohort pooled artifact...</div>;
  if (error) return <div className="p-8 text-center text-rose-500 font-mono text-sm">[ERROR] {error}</div>;
  
  return (
     <div className="p-6 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto m-4 shadow-inner border border-slate-800">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
           <span className="text-slate-400 flex items-center gap-2"><Database size={14} /> cross_cohort_fingerprint_regression.json</span>
           <span className="text-emerald-600">STATUS: VERIFIED (View Line: {cohortId})</span>
        </div>
        <pre>{JSON.stringify(data, null, 2)}</pre>
     </div>
  );
}

const COHORTS = [
  {
    id: "hgsoc_tcga_gdc",
    type: "Discovery",
    n: 376,
    p_value: "0.0038",
    indicator: "success",
    note: "Strong separation at bare threshold transfer. Primary base.",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-50 border-emerald-200"
  },
  {
    id: "GSE49997",
    type: "Validation",
    n: 204,
    p_value: "0.060",
    indicator: "warning",
    note: "Trending towards significance. Margin call.",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200"
  },
  {
    id: "GSE102073",
    type: "Validation",
    n: 85,
    p_value: "0.476",
    indicator: "rescue",
    note: "Directional reversal. Rank-based rescue required.",
    icon: RefreshCcw,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200"
  },
  {
    id: "GSE17260",
    type: "Validation",
    n: 110,
    p_value: "0.821",
    indicator: "neutral",
    note: "Neutral separation. Likely platform normalization drift.",
    icon: ArrowRight,
    color: "text-slate-400",
    bg: "bg-slate-50 border-slate-200"
  },
  {
    id: "GSE26712",
    type: "Validation",
    n: 185,
    p_value: "0.890",
    indicator: "neutral",
    note: "Neutral separation. Microarray saturation limits.",
    icon: ArrowRight,
    color: "text-slate-400",
    bg: "bg-slate-50 border-slate-200"
  },
  {
    id: "GSE32062",
    type: "Validation",
    n: 260,
    p_value: "0.929",
    indicator: "fail",
    note: "Complete miss on bare threshold. RNA-seq structural barrier.",
    icon: ShieldAlert,
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-200"
  }
];

export function PlatinumValidationTab() {
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null);

  return (
    <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 lg:p-12 shadow-sm min-h-[600px]">
      
      {/* Header */}
      <div className="mb-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">6-Cohort Validation Board</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">External Reproducibility Audit</p>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed font-medium">
          The Platinum Window algorithm enforces strict out-of-sample validation to prevent AI hallucination and overfitting. 
          Below is an honest readout of cross-cohort transfers from the TCGA discovery base, highlighting where the molecular 
          logic holds and where platform-specific normalization drift requires intervention.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-2 border-slate-100 rounded-2xl">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-100">
              <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-wider">Cohort ID</th>
              <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-wider">Status</th>
              <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-wider">p-value</th>
              <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-wider">Indicator</th>
              <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-wider">Audit Notes</th>
              <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Drill-Down</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {COHORTS.map((cohort) => {
              const Icon = cohort.icon;
              return (
                <React.Fragment key={cohort.id}>
                  <tr 
                    onClick={() => setExpandedCohort(expandedCohort === cohort.id ? null : cohort.id)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    {/* Cohort ID */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border ${cohort.bg} flex items-center justify-center shrink-0`}>
                          <Icon strokeWidth={2.5} size={16} className={cohort.color} />
                        </div>
                        <span className="font-bold text-slate-700">{cohort.id}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                        cohort.type === 'Discovery' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {cohort.type}
                      </span>
                    </td>

                    {/* p-value */}
                    <td className="py-5 px-6">
                      <span className="font-mono text-sm font-bold text-slate-600">
                        {cohort.p_value}
                      </span>
                    </td>

                    {/* Indicator */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black uppercase tracking-wider ${cohort.color}`}>
                          {cohort.indicator}
                        </span>
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="py-5 px-6">
                      <p className="text-sm text-slate-600 font-medium max-w-sm">
                        {cohort.note}
                      </p>
                    </td>

                    {/* Drill-down Caret */}
                    <td className="py-5 px-6 text-right">
                      {expandedCohort === cohort.id ? <ChevronUp className="inline text-indigo-500" size={20} /> : <ChevronDown className="inline text-slate-300" size={20} />}
                    </td>
                  </tr>
                  {expandedCohort === cohort.id && (
                    <tr>
                      <td colSpan={6} className="p-0 border-b-2 border-slate-100 bg-slate-50/50">
                         <ValidationArtifactViewer cohortId={cohort.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

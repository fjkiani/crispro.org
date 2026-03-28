import React, { useMemo, useState } from 'react';
import { Activity, Database, Table as TableIcon, ChevronDown, ChevronUp, Stethoscope, FileJson } from 'lucide-react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useArbiterArtifact } from '../../hooks/useArbiterArtifact';

export function ProvenanceTab() {
  const { data: rawData, loading: dataLoading, error: dataError } = useArbiterArtifact('data', 'mbc_bone_events_raw.json');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return null;
    
    const N = rawData.length;
    
    // Therapy Distribution
    const therapies = rawData.reduce((acc: Record<string, number>, curr) => {
      const tc = curr.therapy_class || 'UNKNOWN';
      acc[tc] = (acc[tc] || 0) + 1;
      return acc;
    }, {});
    
    // Imaging Modality / Change
    const imaging = rawData.reduce((acc: Record<string, number>, curr) => {
      const im = curr.imaging_change_type || 'UNKNOWN';
      acc[im] = (acc[im] || 0) + 1;
      return acc;
    }, {});

    // Healing Flag Distribution
    let pseudoProgCount = 0;
    let trueProgCount = 0;
    rawData.forEach(curr => {
      if (curr.healing_flag === true) pseudoProgCount++;
      else trueProgCount++;
    });

    const COLORS = ['#2563eb', '#64748b', '#94a3b8', '#0f172a'];
    const IMG_COLORS = ['#047857', '#059669', '#10b981', '#34d399'];
    
    const therapyChart = Object.entries(therapies).map(([key, val], i) => ({
      class: key,
      count: val as number,
      fill: COLORS[i % COLORS.length]
    })).sort((a, b) => b.count - a.count);

    const imagingChart = Object.entries(imaging).map(([key, val], i) => ({
      class: key,
      count: val as number,
      fill: IMG_COLORS[i % IMG_COLORS.length]
    })).sort((a, b) => b.count - a.count);

    return { 
      N, 
      therapyChart, 
      imagingChart,
      pseudoProgCount,
      trueProgCount,
      sliceData: rawData.slice(0, 50) // First 50 for the transparent table ledger
    };
  }, [rawData]);

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-emerald-500 animate-pulse">
        <Activity size={32} className="mb-4" />
        <p className="text-sm font-black uppercase tracking-widest">&gt; Querying Training Cohort JSON...</p>
      </div>
    );
  }

  if (dataError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-red-500">
        <p className="text-sm font-black uppercase tracking-widest">[ERROR] {dataError || 'Invalid dataset structure'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full mx-auto mt-4">
      {/* ── Top Level Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Therapy Chart */}
        <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
          <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-6 w-full text-center">Therapy Distribution</h4>
          <div className="flex items-center justify-center gap-6 w-full flex-grow">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={stats.therapyChart} dataKey="count" nameKey="class" cx="50%" cy="50%" innerRadius={40} outerRadius={50}>
                  {stats.therapyChart.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
               {stats.therapyChart.map(c => (
                  <div key={c.class} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded shadow-sm" style={{background: c.fill}} />
                    <span className="text-[11px] font-black text-slate-600 uppercase leading-none">{c.class} <span className="text-slate-400">({c.count})</span></span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Imaging Chart */}
        <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
          <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-6 w-full text-center">Finding Morphology</h4>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full flex-grow">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={stats.imagingChart} dataKey="count" nameKey="class" cx="50%" cy="50%" innerRadius={40} outerRadius={50}>
                  {stats.imagingChart.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3">
               {stats.imagingChart.map(c => (
                  <div key={c.class} className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded shadow-sm flex-shrink-0" style={{background: c.fill}} />
                      <span className="text-[11px] font-black text-slate-600 uppercase leading-none truncate max-w-[120px]" title={c.class}>{c.class.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 ml-5 leading-none">N = {c.count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Label Distribution */}
        <div className="bg-slate-900 border-2 border-slate-800 rounded-[32px] p-8 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
          <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-6 w-full text-center">Inferred Ground Truth</h4>
          <div className="flex items-center justify-center gap-2 w-full flex-grow">
             <div className="flex flex-col items-center justify-center w-1/2 border-r border-slate-800 px-2 text-center">
                <span className="text-[40px] leading-none font-black text-emerald-400 mb-2">{stats.pseudoProgCount}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Pseudo Progression</span>
             </div>
             <div className="flex flex-col items-center justify-center w-1/2 px-2 text-center">
                <span className="text-[40px] leading-none font-black text-red-500 mb-2">{stats.trueProgCount}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">True Progression</span>
             </div>
          </div>
        </div>

      </div>

      {/* ── Data Ledger ────────────────────────────────────────────── */}
      <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col overflow-hidden w-full">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
           <div className="flex items-center gap-4">
              <Database size={28} className="text-blue-600" />
              <div>
                <h3 className="text-xl font-black text-slate-800">Clinical Event Ledger</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Click any row to interrogate raw artifacts</p>
              </div>
           </div>
           <div className="hidden sm:flex bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest items-center gap-2 shadow-inner">
             <TableIcon size={14} /> Showing top {stats.sliceData.length} records
           </div>
        </div>
        
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] border-2 border-slate-100 rounded-2xl">
           <table className="w-full text-left border-collapse min-w-[700px]">
             <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
               <tr>
                 <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">Patient ID</th>
                 <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">Study</th>
                 <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">Therapy</th>
                 <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">Primary Finder</th>
                 <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 border-l border-slate-100 text-center">ALP Δ</th>
                 <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 text-right">Outcome</th>
                 <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 w-10 text-center">Drill</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {stats.sliceData.map((row: any, i: number) => {
                  const isExpanded = expandedRow === row.patient_id;
                  
                  return (
                  <React.Fragment key={i}>
                    <tr 
                      onClick={() => setExpandedRow(isExpanded ? null : row.patient_id)}
                      className={`cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'}`}
                      style={isExpanded ? { borderBottom: '2px solid transparent' } : {}}
                    >
                       <td className="p-4 font-mono text-[11px] font-bold text-slate-600 border-r border-slate-50 whitespace-nowrap">
                          {row.patient_id?.substring(0, 16) || 'UNKNOWN'}
                       </td>
                       <td className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                          {row.study_id || 'N/A'}
                       </td>
                       <td className="p-4 text-[11px] font-black text-blue-600 bg-blue-50/30 uppercase border-r border-slate-50 border-l rounded-l-md whitespace-nowrap">
                          {row.therapy_class}
                       </td>
                       <td className="p-4 text-[11px] font-black text-emerald-700 bg-emerald-50/30 uppercase border-r border-slate-50 rounded-r-md truncate max-w-[150px]">
                          {row.imaging_change_type?.replace(/_/g, ' ')}
                       </td>
                       <td className={`p-4 text-[12px] font-mono font-bold whitespace-nowrap text-center border-l border-slate-50 ${row.alp_delta < 0 ? 'text-emerald-500' : (row.alp_delta > 0 ? 'text-red-500' : 'text-slate-400')}`}>
                          {row.alp_delta !== null ? (row.alp_delta > 0 ? `+${row.alp_delta.toFixed(1)}%` : `${row.alp_delta.toFixed(1)}%`) : '—'}
                       </td>
                       <td className="p-4 text-right whitespace-nowrap">
                          {row.healing_flag === true ? (
                             <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded shadow-sm border border-emerald-200">Pseudo</span>
                          ) : (
                             <span className="inline-block px-3 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest rounded shadow-sm border border-red-200">Prog</span>
                          )}
                       </td>
                       <td className="p-4 text-center">
                          {isExpanded ? <ChevronUp size={20} className="text-blue-500 mx-auto" /> : <ChevronDown size={20} className="text-slate-300 mx-auto" />}
                       </td>
                    </tr>
                    
                    {/* Drill-down expanded row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={7} className="p-0 border-b border-blue-100">
                          <div className="p-8 border-t-2 border-blue-50">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                               {/* Clinical Report Extraction */}
                               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                 <div className="flex items-center gap-2 mb-4 text-slate-800">
                                   <Stethoscope size={18} className="text-blue-600" />
                                   <h5 className="text-[11px] font-black uppercase tracking-widest">Original Clinical Impression</h5>
                                 </div>
                                 <p className="font-serif italic text-sm leading-relaxed text-slate-700 flex-grow">
                                   "{row.imaging_report_text || 'No unstructured report provided for this record.'}"
                                 </p>
                                 <div className="mt-4 pt-4 border-t border-slate-100">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Therapeutic Action</span>
                                   <p className="text-xs font-bold text-slate-600">{row.outcome_text || row.decision}</p>
                                 </div>
                               </div>

                               {/* Artifact JSON Raw Payload */}
                               <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-inner flex flex-col h-full max-h-[300px]">
                                 <div className="flex items-center gap-2 mb-4 text-white">
                                   <FileJson size={18} className="text-emerald-400" />
                                   <h5 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Underlying JSON Verification</h5>
                                   <span className="ml-auto text-[10px] font-mono text-slate-500 border border-slate-700 px-2 py-0.5 rounded">Unmodified</span>
                                 </div>
                                 <div className="overflow-auto scrollbar-thin flex-grow">
                                    <pre className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                                      {JSON.stringify({
                                        event_index: row.event_index,
                                        weeks_since_therapy_start: row.weeks_since_therapy_start,
                                        symptomatic: row.symptomatic,
                                        new_pain_at_site: row.new_pain_at_site,
                                        alp_baseline: row.alp_baseline,
                                        alp_followup: row.alp_followup,
                                        pfs_from_event_months: row.pfs_from_event_months,
                                        imputed: row.imputed || false,
                                        imputed_fields: row.imputed_fields || []
                                      }, null, 2)}
                                    </pre>
                                 </div>
                               </div>
                            </div>

                          </div>
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

    </div>
  );
}

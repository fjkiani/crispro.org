import { useState } from 'react';
import { Activity, User, Hash, Pill, FileText, ChevronRight } from 'lucide-react';
import type { ArbiterScoreRequest } from '../types/arbiter';

interface Props {
  data: ArbiterScoreRequest;
  onChange: (data: ArbiterScoreRequest) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function ArbiterForm({ data, onChange, onSubmit, isLoading }: Props) {
  const [nlpText, setNlpText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const handleNLPParse = async () => {
    if (!nlpText.trim()) return;
    setIsParsing(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseURL}/api/v1/progression-arbiter/parse-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_text: nlpText })
      });
      
      if (!response.ok) throw new Error('NLP Parsed failed. Ensure backend is running.');
      const result = await response.json();
      
      onChange({
          ...data,
          imaging_change_type: result.imaging_change_type ?? data.imaging_change_type,
          healing_flag: result.healing_flag ?? data.healing_flag,
          therapy_class: result.therapy_class ?? data.therapy_class,
          weeks_on_therapy: result.weeks_since_therapy_start ?? data.weeks_on_therapy
      });
    } catch (err) {
      console.error(err);
      alert("Failed to parse report via API.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="lg:col-span-7 space-y-6">
      <section className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden border-b-4 border-b-blue-600">
        
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3 text-blue-600">
            <User size={24} strokeWidth={2.5} />
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Inference Input</h2>
          </div>
        </div>

        <div className="p-8 space-y-6">

          <div className="relative group">
             <div className="absolute -left-1 top-0 bottom-0 w-1 bg-indigo-500 rounded-full" />
             <div className="bg-slate-50/80 rounded-[20px] p-6 border-2 border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-sm">
                <div className="flex justify-between items-end mb-3">
                  <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-700 uppercase">
                     <FileText className="w-4 h-4" /> Unstructured Clinical Notes
                  </label>
                  {nlpText.length > 5 && (
                      <button 
                         onClick={handleNLPParse}
                         disabled={isParsing}
                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition flex items-center gap-2 disabled:opacity-50"
                      >
                         {isParsing ? 'Extracting Vector Features...' : 'Auto-Extract Nodes'} <ChevronRight className="w-3 h-3" />
                      </button>
                  )}
                </div>
                <textarea
                    value={nlpText}
                    onChange={(e) => setNlpText(e.target.value)}
                    placeholder="Paste radiology report or clinical narrative here... Ex: '36 weeks post Ibrance inituation. New bone lesions present...'"
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 resize-none font-medium h-24 outline-none"
                />
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-2 text-xs font-black text-slate-500 uppercase">
                   <Hash className="w-4 h-4 text-emerald-600" />
                   Imaging Features
                </div>
                <select 
                  className="w-full p-3 bg-white border-2 border-slate-100 rounded-2xl text-base font-black text-slate-700 outline-none focus:border-blue-500"
                  value={data.imaging_change_type}
                  onChange={e => onChange({ ...data, imaging_change_type: e.target.value as any })}
                >
                    <option value="NEW_SCLEROTIC_BONE">New Sclerotic Bone Lesion</option>
                    <option value="SUV_INCREASE_NO_SIZE">Isolated SUV Increase</option>
                    <option value="SUB_5MM_SIZE_INCREASE">Sub-5mm Size Increase</option>
                    <option value="NEW_SOFT_TISSUE_LESION">New Soft Tissue Lesion</option>
                    <option value="RECIST_PROGRESSION">RECIST Progression</option>
                    <option value="STABLE_DISEASE">Stable Disease</option>
                    <option value="OTHER_OR_UNCLEAR">Other / Unclear</option>
                </select>
                <select 
                  onChange={e => onChange({ ...data, healing_flag: e.target.value === 'true' })}
                  value={data.healing_flag ? 'true' : 'false'}
                  className={`w-full p-3 border-2 rounded-2xl text-base font-black outline-none transition-all ${data.healing_flag ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-white border-slate-100 text-slate-700 focus:border-blue-500'}`}
                >
                  <option value="false">Healing Flag: INACTIVE</option>
                  <option value="true">Healing Flag: ACTIVE</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-2 text-xs font-black text-slate-500 uppercase">
                   <Pill className="w-4 h-4 text-rose-600" />
                   Clinical Context
                </div>
                <select 
                  className="w-full p-3 bg-white border-2 border-slate-100 rounded-2xl text-base font-black text-slate-700 outline-none focus:border-blue-500"
                  value={data.therapy_class}
                  onChange={e => onChange({ ...data, therapy_class: e.target.value as any })}
                >
                    <option value="CDK46">CDK4/6 Inhibitor Tx</option>
                    <option value="ENDOCRINE">Endocrine Monotherapy</option>
                    <option value="CHEMO">Cytotoxic Chemotherapy</option>
                    <option value="HER2">HER2 Targeted</option>
                    <option value="IO">Immunotherapy</option>
                    <option value="OTHER">Other Line</option>
                </select>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select 
                      className="w-full p-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-700 outline-none focus:border-blue-500"
                      value={data.symptomatic ? 'true' : 'false'}
                      onChange={e => onChange({ ...data, symptomatic: e.target.value === 'true' })}
                    >
                        <option value="false">Symptom: NO</option>
                        <option value="true">Symptom: YES</option>
                    </select>
                    <select 
                      className="w-full p-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-700 outline-none focus:border-blue-500"
                      value={data.new_pain_at_site ? 'true' : 'false'}
                      onChange={e => onChange({ ...data, new_pain_at_site: e.target.value === 'true' })}
                    >
                        <option value="false">Focal Pain: NO</option>
                        <option value="true">Focal Pain: YES</option>
                    </select>
                </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="bg-white p-3 rounded-2xl border border-blue-200 shadow-sm">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block">Weeks on Tx</label>
                <input 
                  type="number" 
                  value={data.weeks_on_therapy === 0 ? "" : data.weeks_on_therapy} 
                  onChange={(e) => onChange({...data, weeks_on_therapy: Number(e.target.value)})} 
                  className="w-full text-2xl font-black text-slate-800 outline-none" 
                  min="0"
                  max="500"
                  placeholder="0"
                />
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">ALP Delta %</label>
                <input 
                  type="number" 
                  value={data.alp_delta_pct === 0 ? "" : data.alp_delta_pct} 
                  onChange={(e) => onChange({...data, alp_delta_pct: Number(e.target.value)})} 
                  className="w-full text-2xl font-black text-slate-800 outline-none" 
                  placeholder="0"
                />
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CA15.3 Delta %</label>
                <input 
                  type="number" 
                  value={data.ca153_delta_pct === 0 ? "" : data.ca153_delta_pct} 
                  onChange={(e) => onChange({...data, ca153_delta_pct: Number(e.target.value)})} 
                  className="w-full text-2xl font-black text-slate-800 outline-none" 
                  placeholder="0"
                />
              </div>
          </div>

          <button 
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl shadow-blue-200 disabled:opacity-70"
          >
            {isLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <Activity size={24} strokeWidth={3} />}
            {isLoading ? 'CALCULATING RISK PROBABILITY...' : 'COMPUTE CLINICAL RISK SCORE'}
          </button>

        </div>
      </section>
    </div>
  );
}

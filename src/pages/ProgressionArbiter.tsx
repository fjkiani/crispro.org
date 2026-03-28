import { useState } from 'react';
import { Network, Activity, AlertTriangle, Dna, FileCode, ShieldCheck, Table as TableIcon, BookOpen, FileText } from 'lucide-react';
import { useArbiterScore } from '../features/progression-arbiter/hooks/useArbiterScore';
import ArbiterForm from '../features/progression-arbiter/components/ArbiterForm';
import ArbiterResultsPanel from '../features/progression-arbiter/components/ArbiterResultsPanel';
import { AlgorithmSchemaTab } from '../features/progression-arbiter/components/white-box/AlgorithmSchemaTab';
import { PerformanceTab } from '../features/progression-arbiter/components/white-box/PerformanceTab';
import { ProvenanceTab } from '../features/progression-arbiter/components/white-box/ProvenanceTab';
import { AppendixTab } from '../features/progression-arbiter/components/white-box/AppendixTab';
import { ProofOfConceptTab } from '../features/progression-arbiter/components/white-box/ProofOfConceptTab';
import { ArbiterOverviewTab } from '../features/progression-arbiter/components/white-box/ArbiterOverviewTab';

// Shared utility classes from scaffolding
export const glassCard = "bg-white border border-slate-200 rounded-[20px] shadow-sm";
export const labelTiny = "text-[10px] font-extrabold tracking-[0.05em] text-slate-500 uppercase";

export default function ProgressionArbiter() {
  const { form, setForm, data, loading, error, scoreEvent } = useArbiterScore();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'inference', label: 'Clinical Inference', icon: Activity },
    { id: 'math', label: 'Algorithm & Schema', icon: FileCode },
    { id: 'performance', label: 'Clinical Performance', icon: ShieldCheck },
    { id: 'provenance', label: 'Cohort Explorer', icon: TableIcon },
    { id: 'appendix', label: 'Appendix (Hard Cases)', icon: BookOpen },
    { id: 'poc', label: 'Proof of Concept', icon: FileText },
  ];

  return (
    <div className="font-sans bg-slate-50 text-slate-800 p-0 m-0 overflow-x-hidden min-h-screen pb-12">
      
      <style>{`
        .animate-flicker { animation: flicker 2s linear infinite; }
        @keyframes flicker {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
        }
      `}</style>

      {/* Main Dashboard Layout - Sidebar Split */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[calc(100vh-48px)] max-w-[1440px] mx-auto py-4 lg:py-8 px-4 lg:px-8">
        
        {/* LEFT: MASTER NAVIGATION SIDEBAR */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-2 relative">
          <div className="lg:sticky top-8 space-y-2">
            
            {/* Branding Header Area */}
            <div className="flex items-center gap-4 mb-8 px-2 py-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-md flex items-center justify-center text-white shrink-0">
                <Dna strokeWidth={2.5} size={24} />
              </div>
              <div>
                <h2 className="text-[17px] font-black text-slate-800 tracking-tight leading-tight">Progression Arbiter</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-0.5">L2 Classification</p>
              </div>
            </div>
            
            <div className="space-y-1.5 no-scrollbar overflow-x-auto flex lg:flex-col pb-4 lg:pb-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-auto lg:w-full flex-shrink-0 flex items-center gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all duration-200 text-left border-2 group
                      ${isActive 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-white border-transparent text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-900 shadow-sm'
                      }
                    `}
                  >
                    <div className={`p-2 rounded-xl transition-colors duration-200 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <div className="flex-1 pr-4 lg:pr-0">
                      <span className={`block font-bold tracking-tight text-sm ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                        {tab.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: MAIN VIEW */}
        <main className="flex-1 w-full relative flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
          {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-[20px] flex items-start gap-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-800">Analysis Error</h3>
                  <p className="text-sm text-rose-600 mt-1">{error}</p>
                </div>
              </div>
          )}

          <div className="flex-grow">
            {/* INFERENCE ENGINE VIEW */}
            {activeTab === 'inference' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Left Form */}
                <div className="lg:col-span-7">
                  <ArbiterForm 
                    data={form} 
                    onChange={setForm} 
                    onSubmit={() => scoreEvent(form)} 
                    isLoading={loading} 
                  />
                </div>
                
                {/* Right Results */}
                <div className="lg:col-span-5">
                  {data ? (
                    <ArbiterResultsPanel data={data} key={JSON.stringify(data)} />
                  ) : (
                    <div className={glassCard + " min-h-[400px] lg:h-[600px] flex flex-col items-center justify-center bg-slate-50/50"}>
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                        <Network className="w-6 h-6 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-black tracking-tight text-slate-700 mb-2">Awaiting Patient Data</h3>
                      <p className="text-xs font-medium text-slate-500 text-center max-w-[280px]">
                        Enter findings in the form or paste a radiology report to generate a progression risk analysis.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WHITE BOX VIEWS */}
            {activeTab === 'overview' && <ArbiterOverviewTab />}
            {activeTab === 'math' && <AlgorithmSchemaTab />}
            {activeTab === 'performance' && <PerformanceTab />}
            {activeTab === 'provenance' && <ProvenanceTab />}
            {activeTab === 'appendix' && <AppendixTab />}
            {activeTab === 'poc' && <ProofOfConceptTab />}
          </div>
        </main>

      </div>
    </div>
  );
}

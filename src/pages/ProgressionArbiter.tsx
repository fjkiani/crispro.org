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

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-0 flex flex-col lg:flex-row items-start lg:items-center justify-between sticky top-0 z-50 shadow-sm min-h-[5rem]">
        <div className="flex items-center gap-4 py-3 lg:py-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                <Dna className="w-6 h-6" />
            </div>
            <div>
                {/* <h1 className="text-xl font-black text-slate-800 tracking-tight">CrisPRO<span className="text-blue-600">.org</span></h1> */}
                <div className="flex items-center gap-2">
                    <span className={labelTiny + " text-[9px] truncate"}>Progression Arbiter | L2 Logistic Regression</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0"></span>
                </div>
            </div>
        </div>

        <nav className="flex items-center gap-6 lg:gap-8 h-full w-full lg:w-auto overflow-x-auto whitespace-nowrap pb-2 lg:pb-0 pt-2 lg:pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-full pb-3 flex flex-shrink-0 items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                  ? 'border-b-4 border-blue-700 text-blue-800 translate-y-[2px]' 
                  : 'text-slate-600 hover:text-slate-900 border-b-4 border-transparent translate-y-[2px]'
                }`}
              >
                <tab.icon size={16} strokeWidth={2.5} />
                {tab.label}
              </button>
            ))}
        </nav>


       
      </header>

      {/* Main Dashboard Layout */}
      <main className="max-w-[1440px] w-full mx-auto px-4 md:px-12 mt-4 h-[calc(100vh-140px)] flex flex-col">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              {/* Left Panel: Form */}
              <div className="lg:col-span-7">
                <ArbiterForm 
                  data={form} 
                  onChange={setForm} 
                  onSubmit={() => scoreEvent(form)} 
                  isLoading={loading} 
                />
              </div>
              
              {/* Right Panel: Results */}
              <div className="lg:col-span-5">
                {data ? (
                  <ArbiterResultsPanel data={data} key={JSON.stringify(data)} />
                ) : (
                  <div className={glassCard + " h-[600px] flex flex-col items-center justify-center bg-slate-50/50"}>
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

      {/* Footer */}

    </div>
  );
}

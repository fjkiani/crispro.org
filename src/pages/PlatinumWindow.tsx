import React, { useState } from 'react';
import { Network, Activity, AlertTriangle, Dna, FileCode, ShieldCheck, Table as TableIcon, BookOpen, FileText } from 'lucide-react';
import ScoreForm from '../components/ScoreForm';
import ResultsPanel from '../components/ResultsPanel';
import { usePlatinumScore } from '../hooks/usePlatinumScore';
import { PlatinumAlgorithmSchemaTab } from '../features/platinum-window/components/white-box/PlatinumAlgorithmSchemaTab';
import { PlatinumValidationTab } from '../features/platinum-window/components/white-box/PlatinumValidationTab';
import { PlatinumClockTab } from '../features/platinum-window/components/white-box/PlatinumClockTab';
import { PlatinumPatientsTab } from '../features/platinum-window/components/white-box/PlatinumPatientsTab';
import { PlatinumPOCTab } from '../features/platinum-window/components/white-box/PlatinumPOCTab';
import { PlatinumOverviewTab } from '../features/platinum-window/components/white-box/PlatinumOverviewTab';

// Shared utility classes from scaffolding
export const glassCard = "bg-white border border-slate-200 rounded-[20px] shadow-sm";
export const labelTiny = "text-[10px] font-extrabold tracking-[0.05em] text-slate-500 uppercase";

export default function PlatinumWindowDashboard() {
  const { data, loading, error, runDemo, scorePatient } = usePlatinumScore();
  const [activeTab, setActiveTab] = useState('engine');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'engine', label: 'Score Engine', icon: Activity },
    { id: 'math', label: 'Platinum Window | Elastic Net Cox', icon: FileCode },
    { id: 'validation', label: '6-Cohort Validation', icon: ShieldCheck },
    { id: 'clock', label: 'FAP Clock', icon: TableIcon },
    { id: 'patients', label: 'Patient Briefs', icon: BookOpen },
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
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shrink-0">
                <Dna className="w-6 h-6" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <span className={labelTiny + " text-[9px] truncate"}>Platinum Window | Elastic Net Cox</span>
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
                  ? 'border-b-4 border-teal-600 text-teal-600 translate-y-[2px]' 
                  : 'text-slate-400 hover:text-slate-600 border-b-4 border-transparent translate-y-[2px]'
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
          {activeTab === 'engine' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              {/* Left Panel: Form */}
              <div className="lg:col-span-7">
                <ScoreForm 
                  onScore={scorePatient}
                  onDemo={runDemo}
                  loading={loading} 
                />
              </div>
              
              {/* Right Panel: Results */}
              <div className="lg:col-span-5">
                {data ? (
                  <ResultsPanel data={data} key={JSON.stringify(data)} />
                ) : (
                  <div className={glassCard + " h-[600px] flex flex-col items-center justify-center bg-slate-50/50"}>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                      <Network className="w-6 h-6 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-slate-700 mb-2">Awaiting Expression Data</h3>
                    <p className="text-xs font-medium text-slate-500 text-center max-w-[280px]">
                      Enter RNA-seq values in the form or run the demoto generate a Platinum Window score.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WHITE BOX VIEWS (Placeholders for now) */}
          {activeTab === 'overview' && <PlatinumOverviewTab />}
          {activeTab === 'math' && <PlatinumAlgorithmSchemaTab />}
          {activeTab === 'validation' && <PlatinumValidationTab />}
          {activeTab === 'clock' && <PlatinumClockTab data={data} />}
          {activeTab === 'patients' && <PlatinumPatientsTab />}
          {activeTab === 'poc' && <PlatinumPOCTab />}
        </div>
      </main>
    </div>
  );
}

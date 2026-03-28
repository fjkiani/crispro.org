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

      {/* Main Dashboard Layout - Sidebar Split */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[calc(100vh-48px)] max-w-[1440px] mx-auto py-4 lg:py-8 px-4 lg:px-8">
        
        {/* LEFT: MASTER NAVIGATION SIDEBAR */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-2 relative">
          <div className="lg:sticky top-8 space-y-2">
            
            {/* Branding Header Area */}
            <div className="flex items-center gap-4 mb-8 px-2 py-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 shadow-md flex items-center justify-center text-white shrink-0">
                <Dna strokeWidth={2.5} size={24} />
              </div>
              <div>
                <h2 className="text-[17px] font-black text-slate-800 tracking-tight leading-tight">Platinum Window</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-0.5">Elastic Net Cox</p>
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
                        ? 'bg-teal-600 border-teal-600 text-white shadow-md' 
                        : 'bg-white border-transparent text-slate-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-900 shadow-sm'
                      }
                    `}
                  >
                    <div className={`p-2 rounded-xl transition-colors duration-200 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-600'}`}>
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
            {activeTab === 'engine' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
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
                    <div className={glassCard + " min-h-[400px] lg:h-[600px] flex flex-col items-center justify-center bg-slate-50/50"}>
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                        <Network className="w-6 h-6 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-black tracking-tight text-slate-700 mb-2">Awaiting Expression Data</h3>
                      <p className="text-xs font-medium text-slate-500 text-center max-w-[280px]">
                        Enter RNA-seq values in the form or run the demo to generate a Platinum Window score.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WHITE BOX VIEWS */}
            {activeTab === 'overview' && <PlatinumOverviewTab />}
            {activeTab === 'math' && <PlatinumAlgorithmSchemaTab />}
            {activeTab === 'validation' && <PlatinumValidationTab />}
            {activeTab === 'clock' && <PlatinumClockTab data={data} />}
            {activeTab === 'patients' && <PlatinumPatientsTab />}
            {activeTab === 'poc' && <PlatinumPOCTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

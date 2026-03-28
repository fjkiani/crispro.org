import React, { useState, useMemo } from 'react';
import { AlertTriangle, BookOpen, User, Flame, Search, Info, ChevronRight, AlertCircle } from 'lucide-react';
import { useArbiterArtifact } from '../../hooks/useArbiterArtifact';
import { ClinicalMarkdown } from './ClinicalMarkdown';

const SECTIONS = [
  { id: 'vignette-a', label: 'Vignette A: Sclerotic Lesion', subtitle: 'Symptomatic, CDK4/6i (Week 6)', icon: Flame },
  { id: 'vignette-b', label: 'Vignette B: Late Sclerosis', subtitle: 'Flat ALP, CDK4/6i (Week 36)', icon: User },
  { id: 'vignette-c', label: 'Vignette C: SUV Increase', subtitle: 'Asymptomatic, CDK4/6i (Week 10)', icon: Search },
  { id: 'indeterminate', label: 'The Indeterminate Zone', subtitle: 'Model Uncertainty Rules', icon: Info },
];

function extractSection(markdown: string, startHeader: string, nextHeader: string | null) {
  if (!markdown) return '';
  const startIdx = markdown.indexOf(startHeader);
  if (startIdx === -1) return '';
  const endIdx = nextHeader ? markdown.indexOf(nextHeader, startIdx) : -1;
  return endIdx === -1 ? markdown.substring(startIdx) : markdown.substring(startIdx, endIdx);
}

export function AppendixTab() {
  const [activeSection, setActiveSection] = useState('vignette-a');
  const { data: hardCasesData, loading, error } = useArbiterArtifact('reports', 'sammons_hard_cases_appendix.md');

  const sectionContent = useMemo(() => {
    if (!hardCasesData) return '';

    switch (activeSection) {
      case 'vignette-a':
        return extractSection(hardCasesData, '## Vignette A', '## Vignette B');
      case 'vignette-b':
        return extractSection(hardCasesData, '## Vignette B', '## Vignette C');
      case 'vignette-c':
        return extractSection(hardCasesData, '## Vignette C', '## When the Model Says');
      case 'indeterminate':
        return extractSection(hardCasesData, '## When the Model Says', '## Vignette D');
      default:
        return '';
    }
  }, [activeSection, hardCasesData]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* LEFT: MASTER NAVIGATION */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-2 relative">
        <div className="sticky top-24 space-y-2">
          
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <BookOpen strokeWidth={2.5} size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Hard Cases</h2>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">SAMMONS_v1.2</p>
            </div>
          </div>
          
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 text-left border-2 group
                  ${isActive 
                    ? 'bg-amber-500 border-amber-500 text-white shadow-md' 
                    : 'bg-white/50 border-white/20 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-900 hover:shadow-sm backdrop-blur-sm'
                  }
                `}
              >
                <div className={`p-2 rounded-xl transition-colors duration-200 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div className="flex-1">
                  <span className={`block font-bold tracking-tight text-sm ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                    {section.label}
                  </span>
                  <span className={`block text-[11px] mt-0.5 font-medium ${isActive ? 'text-amber-100' : 'text-slate-400 group-hover:text-amber-600/70'}`}>
                    {section.subtitle}
                  </span>
                </div>
                <ChevronRight size={16} className={`transition-transform duration-200 ${isActive ? 'opacity-100 translate-x-1' : 'opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: DETAIL VIEW */}
      <div className="flex-1 w-full bg-slate-50 border-2 border-slate-200 rounded-[32px] overflow-hidden shadow-sm relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 opacity-20" />
        
        <div className="p-8 lg:p-12 w-full h-full min-h-[500px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-60 text-slate-500 py-20">
              <div className="w-12 h-12 rounded-full border-4 border-amber-300 border-t-amber-600 animate-spin" />
              <div className="space-y-1 text-center">
                <span className="font-black text-lg tracking-tight block text-amber-900">Simulating Hard Cases</span>
                <span className="font-medium text-sm text-slate-500">Loading SAMMONS_v1.2 appendix...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 text-rose-600 bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
              <AlertCircle size={24} className="mt-0.5 shrink-0" />
              <div>
                <h4 className="font-black tracking-tight mb-1">Appendix Load Failed</h4>
                <p className="font-medium text-sm opacity-80">{error}</p>
              </div>
            </div>
          ) : (
            <div key={activeSection} className="animate-in fade-in slide-in-from-right-4 duration-300 w-full overflow-hidden">
              <ClinicalMarkdown content={sectionContent} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

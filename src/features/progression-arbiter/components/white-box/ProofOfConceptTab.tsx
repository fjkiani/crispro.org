import { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Database, 
  Target, 
  Activity, 
  SplitSquareHorizontal, 
  Stethoscope, 
  Scale, 
  ChevronRight, 
  AlertCircle,
  FlaskConical
} from 'lucide-react';
import { useArbiterArtifact } from '../../hooks/useArbiterArtifact';
import { ClinicalMarkdown } from './ClinicalMarkdown';

const SECTIONS = [
  { id: 'problem', label: 'The Problem', subtitle: 'Misinterpreted Healing', icon: AlertTriangle, start: '## The Problem', next: '## What We Built' },
  { id: 'solution', label: 'Arbiter Validation', subtitle: '239 Events, 9 Studies', icon: Database, start: '## What We Built', next: '## The Strongest Predictors' },
  { id: 'predictors', label: 'Key Predictors', subtitle: 'Strongest Features', icon: Target, start: '## The Strongest Predictors', next: '## Model Performance' },
  { id: 'performance', label: 'Performance', subtitle: 'AUROC & Caveats', icon: Activity, start: '## Model Performance', next: '## Where Clinicians Disagree' },
  { id: 'discordance', label: 'Clinical Discordance', subtitle: 'When Providers Disagree', icon: SplitSquareHorizontal, start: '## Where Clinicians Disagree', next: '## Clinical Decision Support' },
  { id: 'cds', label: 'Decision Support', subtitle: 'Proposed Logic', icon: Stethoscope, start: '## Clinical Decision Support', next: '## Limitations' },
  { id: 'limitations', label: 'Limitations', subtitle: 'Research Caveats', icon: Scale, start: '## Limitations', next: null },
];

function extractSection(markdown: string, startHeader: string, nextHeader: string | null) {
  if (!markdown) return '';
  const startIdx = markdown.indexOf(startHeader);
  if (startIdx === -1) return '';
  const endIdx = nextHeader ? markdown.indexOf(nextHeader, startIdx) : -1;
  return endIdx === -1 ? markdown.substring(startIdx) : markdown.substring(startIdx, endIdx);
}

export function ProofOfConceptTab() {
  const [activeSection, setActiveSection] = useState('problem');
  const { data: onePagerData, loading, error } = useArbiterArtifact('reports', 'sammons_one_pager.md');

  const sectionContent = useMemo(() => {
    if (!onePagerData) return '';
    const section = SECTIONS.find(s => s.id === activeSection);
    if (!section) return '';
    return extractSection(onePagerData, section.start, section.next);
  }, [activeSection, onePagerData]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto py-8">
      
      {/* LEFT: MASTER NAVIGATION */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-2 relative">
        <div className="sticky top-24 space-y-2">
          
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <FlaskConical strokeWidth={2.5} size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">One Pager</h2>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">POC_SUMMARY_v1</p>
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
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white/50 border-white/20 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-900 hover:shadow-sm backdrop-blur-sm'
                  }
                `}
              >
                <div className={`p-2 rounded-xl transition-colors duration-200 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div className="flex-1">
                  <span className={`block font-bold tracking-tight text-sm ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                    {section.label}
                  </span>
                  <span className={`block text-[11px] mt-0.5 font-medium ${isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-600/70'}`}>
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
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 opacity-20" />
        
        <div className="p-8 lg:p-12 w-full h-full min-h-[500px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-60 text-slate-500 py-20">
              <div className="w-12 h-12 rounded-full border-4 border-blue-300 border-t-blue-600 animate-spin" />
              <div className="space-y-1 text-center">
                <span className="font-black text-lg tracking-tight block text-blue-900">Streaming POC Artifact</span>
                <span className="font-medium text-sm text-slate-500">Loading sammons_one_pager.md...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 text-rose-600 bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
              <AlertCircle size={24} className="mt-0.5 shrink-0" />
              <div>
                <h4 className="font-black tracking-tight mb-1">POC Load Failed</h4>
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

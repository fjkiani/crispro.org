import React, { useState, useMemo } from 'react';
import { AlertCircle, FileText, Activity, Database, BrainCircuit, Search, FlaskConical, ChevronRight } from 'lucide-react';
import { useArbiterArtifact } from '../../hooks/useArbiterArtifact';
import { ClinicalMarkdown } from './ClinicalMarkdown';

const SECTIONS = [
  { id: 'data-sources', label: 'Data Sources', icon: Database },
  { id: 'labeling-rules', label: 'Labeling Rules (Full Dataset)', icon: FileText },
  { id: 'model-architecture', label: 'Model Architecture & CV', icon: BrainCircuit },
  { id: 'discordance', label: 'Clinician Discordance', icon: Activity },
  { id: 'radiology-parser', label: 'Radiology Parser Logic', icon: Search },
  { id: 'assumptions', label: 'Assumptions & Imputations', icon: FlaskConical },
];

function extractSection(markdown: string, startHeader: string, nextHeader: string | null) {
  if (!markdown) return '';
  const startIdx = markdown.indexOf(startHeader);
  if (startIdx === -1) return '';
  const endIdx = nextHeader ? markdown.indexOf(nextHeader, startIdx) : -1;
  return endIdx === -1 ? markdown.substring(startIdx) : markdown.substring(startIdx, endIdx);
}

export function PerformanceTab() {
  const [activeSection, setActiveSection] = useState('data-sources');

  // Load all foundational artifacts simultaneously
  const { data: finalReport, loading: l1, error: e1 } = useArbiterArtifact('reports', 'final_report.md');
  const { data: labelingRules, loading: l2, error: e2 } = useArbiterArtifact('reports', 'labeling_rules.md');
  const { data: confusionReport, loading: l3, error: e3 } = useArbiterArtifact('reports', 'confusion_report.md');

  const loading = l1 || l2 || l3;
  const error = e1 || e2 || e3;

  const sectionContent = useMemo(() => {
    if (!finalReport) return '';

    switch (activeSection) {
      case 'data-sources':
        return extractSection(finalReport, '## 1. Data Sources', '## 2. Labeling Rules');
      case 'labeling-rules':
        return labelingRules || 'Failed to load labeling_rules.md';
      case 'model-architecture':
        return extractSection(finalReport, '## 3. Model Architecture & Performance', '## 4. Clinician-Decision Discordance');
      case 'discordance':
        return confusionReport || 'Failed to load confusion_report.md';
      case 'radiology-parser':
        return extractSection(finalReport, '## 5. Radiology Parser', '## 6. Assumptions & Imputations');
      case 'assumptions':
        return extractSection(finalReport, '## 6. Assumptions & Imputations', '## 7. Artifacts');
      default:
        return '';
    }
  }, [activeSection, finalReport, labelingRules, confusionReport]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* LEFT: MASTER NAVIGATION */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-2 relative">
        <div className="sticky top-24 space-y-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Clinical Pipeline Methodology</h3>
          
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 text-left border-2 group
                  ${isActive 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white/50 border-white/20 text-slate-600 hover:bg-white hover:border-slate-200 hover:text-slate-900 hover:shadow-sm backdrop-blur-sm'
                  }
                `}
              >
                <div className={`p-2 rounded-xl transition-colors duration-200 ${isActive ? 'bg-white/20 text-blue-300' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`flex-1 font-bold tracking-tight text-sm ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                  {section.label}
                </span>
                <ChevronRight size={16} className={`transition-transform duration-200 ${isActive ? 'opacity-100 translate-x-1' : 'opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: DETAIL VIEW */}
      <div className="flex-1 w-full bg-slate-50 border-2 border-slate-200 rounded-[32px] overflow-hidden shadow-sm relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-20" />
        
        <div className="p-8 lg:p-12 w-full h-full min-h-[500px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-60 text-slate-500 py-20">
              <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-slate-600 animate-spin" />
              <div className="space-y-1 text-center">
                <span className="font-black text-lg tracking-tight block text-slate-800">Streaming Clinical Artifacts</span>
                <span className="font-medium text-sm">Synchronizing methodology from backend...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 text-rose-600 bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
              <AlertCircle size={24} className="mt-0.5 shrink-0" />
              <div>
                <h4 className="font-black tracking-tight mb-1">Methodology Sync Failed</h4>
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

import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { usePlatinumArtifact } from '../../hooks/usePlatinumArtifact';
import { ClinicalMarkdown } from '../../../progression-arbiter/components/white-box/ClinicalMarkdown';

export function PlatinumPOCTab() {
  const { data: manuscript, loading, error } = usePlatinumArtifact('', 'ZETA_MANUSCRIPT.mdc');

  return (
    <div className="bg-white border-2 border-slate-200 rounded-[32px] overflow-hidden shadow-sm flex flex-col min-h-[600px]">
      
      {/* Header */}
      <div className="p-8 lg:p-12 pb-6 border-b-2 border-slate-100 bg-slate-50/50">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Proof of Concept Manuscript</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Zeta-Compliant Publication Output</p>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed font-medium">
            This tab renders the complete ZETA_MANUSCRIPT.mdc artifact. The manuscript is programmatically 
            chained to the deterministic outputs of the 16-cohort validation sprint and simulated intervention pipelines.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 opacity-60 text-slate-500 py-20">
            <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-indigo-600 animate-spin" />
            <div className="space-y-1 text-center">
              <span className="font-black text-lg tracking-tight block text-slate-800">Compiling Manuscript</span>
              <span className="font-medium text-sm">Streaming markdown artifact from publication directory...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 text-rose-600 bg-rose-50/50 p-6 rounded-2xl border border-rose-100 max-w-2xl mx-auto mt-10">
            <AlertCircle size={24} className="mt-0.5 shrink-0" />
            <div>
              <h4 className="font-black tracking-tight mb-1">Manuscript Load Failed</h4>
              <p className="font-medium text-sm opacity-80">{error}</p>
            </div>
          </div>
        ) : manuscript ? (
          <div className="max-w-4xl mx-auto bg-white">
             <ClinicalMarkdown content={manuscript as string} />
          </div>
        ) : null}
      </div>

    </div>
  );
}

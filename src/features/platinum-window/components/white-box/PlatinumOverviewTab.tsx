import React from 'react';
import { BookOpen, Network, Database, ShieldCheck } from 'lucide-react';
import { CLINICAL_CONTEXT, CAPABILITIES } from '../../../../constants';
import InfoCard from '../../../../components/InfoCard';
import { Link } from 'react-router-dom';

export function PlatinumOverviewTab() {
  return (
    <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 lg:p-12 shadow-sm min-h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="mb-10 max-w-3xl">
         <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
             <BookOpen className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Overview</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Foundational Intelligence</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* The Problem */}
        <section className="bg-slate-50 border border-slate-200 p-8 rounded-[24px]">
          <h2 className="text-2xl font-black text-slate-800 mb-4">{CLINICAL_CONTEXT.problemTitle}</h2>
          <p className="text-slate-600 leading-relaxed font-medium text-lg max-w-4xl">
             {CLINICAL_CONTEXT.problemDescription}
          </p>
        </section>

        {/* The Solution */}
        <section>
          <h3 className="text-xl font-black text-slate-800 mb-4">{CLINICAL_CONTEXT.solutionTitle}</h3>
          <p className="text-slate-600 leading-relaxed font-medium text-lg max-w-4xl mb-8">
            {CLINICAL_CONTEXT.solutionDescription}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CLINICAL_CONTEXT.solutionPoints.map((pt) => (
              <div key={pt.title} className="bg-white border-2 border-slate-100 p-6 rounded-2xl shadow-sm flex gap-4">
                 <div className="text-3xl shrink-0">{pt.icon}</div>
                 <div>
                   <h4 className="font-bold text-slate-800 tracking-tight mb-2">{pt.title}</h4>
                   <p className="text-slate-600 text-sm">{pt.detail}</p>
                 </div>
              </div>
            ))}
          </div>
           
           <div className="mt-8 p-4 bg-teal-50 text-teal-800 rounded-xl font-medium border border-teal-200 max-w-2xl">
              <strong>Who uses this:</strong> {CLINICAL_CONTEXT.whoNeedsThis}
           </div>
        </section>

        {/* Capabilities */}
        <section>
          <h3 className="text-xl font-black text-slate-800 mb-6 border-b-2 border-slate-100 pb-2">Platform Capabilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {CAPABILITIES.map((cap) => (
               <div key={cap.title} className={`p-6 bg-white border-2 rounded-[24px] shadow-sm flex flex-col ${cap.status === 'COMING SOON' ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-3xl">{cap.icon}</span>
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${cap.status === 'LIVE' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
                         {cap.status}
                      </span>
                   </div>
                   <h4 className="font-black tracking-tight text-lg text-slate-800 mb-2">{cap.title}</h4>
                   <p className="text-slate-500 text-sm mb-6 flex-grow">{cap.desc}</p>
                   {cap.link && cap.status === 'LIVE' && (
                     <span className="text-teal-600 font-bold uppercase text-[11px] tracking-widest flex items-center gap-1">
                        Active Component &rarr;
                     </span>
                   )}
               </div>
             ))}
          </div>
        </section>
      </div>

    </div>
  );
}

import React from 'react';
import { BookOpen, Network, Database, ShieldCheck } from 'lucide-react';
import { ARBITER_CONTEXT, ARBITER_CAPABILITIES } from '../../constants';
import { Link } from 'react-router-dom';

export function ArbiterOverviewTab() {
  return (
    <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 lg:p-12 shadow-sm min-h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="mb-10 max-w-3xl">
         <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
             <BookOpen className="w-6 h-6 text-blue-700" />
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
          <h2 className="text-2xl font-black text-slate-800 mb-4">The Clinical Challenge</h2>
          <p className="text-slate-600 leading-relaxed font-medium text-lg max-w-4xl">
             {ARBITER_CONTEXT.problemDescription}
          </p>
        </section>

        {/* The Solution */}
        <section>
          <h3 className="text-xl font-black text-slate-800 mb-4">Who uses this:</h3>
          <p className="text-slate-600 leading-relaxed font-medium text-lg max-w-4xl mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            {ARBITER_CONTEXT.whoNeedsThis}
          </p>
        </section>

        {/* Capabilities */}
        <section>
          <h3 className="text-xl font-black text-slate-800 mb-6 border-b-2 border-slate-100 pb-2">Arbiter Mechanics & Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {ARBITER_CAPABILITIES.map((cap) => (
               <div key={cap.title} className={`p-6 bg-white border-2 rounded-[24px] shadow-sm flex flex-col ${cap.status === 'COMING SOON' ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-3xl">{cap.icon}</span>
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${cap.status === 'LIVE' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                         {cap.status}
                      </span>
                   </div>
                   <h4 className="font-black tracking-tight text-lg text-slate-800 mb-2">{cap.title}</h4>
                   <p className="text-slate-500 text-sm mb-6 flex-grow">{cap.desc}</p>
                   {cap.status === 'LIVE' && (
                     <span className="text-blue-600 font-bold uppercase text-[11px] tracking-widest flex items-center gap-1">
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

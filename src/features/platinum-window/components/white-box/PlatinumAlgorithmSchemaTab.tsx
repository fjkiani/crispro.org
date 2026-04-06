import React, { useState } from 'react';
import { Database, Activity, BookOpen, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { usePlatinumArtifact } from '../../hooks/usePlatinumArtifact';

const COEFFICIENT_ANCHORS: Record<string, any> = {
  "FAP_z": {
    raw_feature: "FAP TPM (z-score)",
    schema_desc: "Fibroblast Activation Protein Alpha (CAF stromal proxy).",
    type: "Float (standardized)",
    anchor: "Stromal Arm (Cancer-Associated Fibroblasts)",
    quote: "FAP+ CAFs create a dense fibrotic barrier that physically impedes immune infiltration and platinum penetration, accelerating resistance."
  },
  "CXCL10_z": {
    raw_feature: "CXCL10 TPM (z-score)",
    schema_desc: "C-X-C motif chemokine ligand 10 (Immune access proxy).",
    type: "Float (standardized)",
    anchor: "Immune Access Arm (T-cell recruitment)",
    quote: "CXCL10 acts as a potent chemoattractant for effector T-cells. Its presence opposes the stromal barrier, conferring a massive survival advantage."
  }
};

const PLATINUM_WEIGHTS = {
  "FAP_z": 0.2033,
  "CXCL10_z": -0.1474
};

export function PlatinumAlgorithmSchemaTab() {
  const { data: schemaData, loading: schemaLoading, error: schemaError } = usePlatinumArtifact('data/validation', 'continuous_survival_score_v1.json');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  return (
    <div className="algo-container">
      {/* ── Left Side: Analytics Components (Equation & Unified Table) ── */}
      <div className="algo-left-col">
        {/* Component 1: Equation */}
        <div>
          <h3 className="algo-equation-header text-teal-800">Elastic Net Cox Regression</h3>
          <div className="algo-equation-box border-teal-100 bg-teal-50/20">
            <p className="algo-equation-text text-teal-900">
              $Score = 1 - \sigma(\sum \beta_i X_i)$
            </p>
            <p className="text-xs text-teal-600 mt-2 font-medium">Higher score = better predicted survival</p>
          </div>
        </div>
        
        {/* Component 2 & 3: Model Weights Table + Inline Registry */}
        <div>
          <div className="registry-header-row mb-4">
            <div className="registry-header-title-box">
                <Database size={28} className="text-teal-600" />
                <h3 className="registry-main-title">White-Box Feature Registry</h3>
            </div>
            <span className="registry-hint-badge border-teal-200 text-teal-700 bg-teal-50">
              Click Rows to Interrogate
            </span>
          </div>

          <div className="algo-table-container border-teal-100 overflow-x-auto">
            <table className="algo-table min-w-[600px]">
              <thead>
                <tr>
                  <th className="bg-slate-50 text-slate-600">Coefficient Name</th>
                  <th className="bg-slate-50 text-slate-600">Value ($\beta$)</th>
                  <th className="bg-slate-50 text-slate-600">Hazard Effect</th>
                  <th className="w-12 bg-slate-50"></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PLATINUM_WEIGHTS).map(([key, val]) => {
                  const isExpanded = expandedFeature === key;
                  const anchorData = COEFFICIENT_ANCHORS[key] || {};

                  return (
                    <React.Fragment key={key}>
                      {/* Main Coefficient Row */}
                      <tr 
                        onClick={() => setExpandedFeature(isExpanded ? null : key)}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-teal-50/30' : 'hover:bg-slate-50'}`}
                        style={isExpanded ? { borderBottom: '2px solid transparent' } : {}}
                      >
                        <td className="algo-table-key" style={isExpanded ? { color: '#0d9488' } : {}}>{key}</td>
                        <td className={`algo-table-val ${val > 0 ? 'neg' : 'pos'}`}>
                          {val > 0 ? '+' : ''}{val.toFixed(4)}
                        </td>
                        <td>
                          <span className={`algo-table-badge ${val > 0 ? 'neg' : 'pos'}`}>
                            {val > 0 ? 'Increases Hazard (Barrier)' : 'Decreases Hazard (Protector)' }
                          </span>
                        </td>
                        <td className="text-center text-slate-400">
                          {isExpanded ? <ChevronUp size={24} className="text-teal-500 mx-auto" /> : <ChevronDown size={24} className="mx-auto" />}
                        </td>
                      </tr>

                      {/* Inline Expanded Registry Payload */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="p-0 border-b border-teal-100">
                            <div className="p-8 bg-teal-50/20 border-t-2 border-teal-100">
                                <div className="grid grid-cols-1 gap-8">
                                  {/* Schema Details */}
                                  <div>
                                    <div className="registry-section-header schema" style={{marginBottom: '0.75rem'}}>
                                      <Database size={16} className="text-teal-600" />
                                      <span className="text-teal-800">Feature Definition</span>
                                    </div>
                                    <p className="registry-text-main">{anchorData.schema_desc}</p>
                                    <div style={{marginTop: '0.75rem'}}>
                                      <span className="registry-badge-schema font-bold text-slate-700 bg-white border border-slate-200">
                                        Raw Field: {anchorData.raw_feature}
                                      </span>
                                      <span className="registry-badge-schema">
                                        Type: {anchorData.type}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Clinical Provenance Details */}
                                  <div className="registry-section-divider mt-0 pt-6 border-slate-200/50">
                                    <div className="registry-section-header prov" style={{marginBottom: '0.75rem'}}>
                                      <BookOpen size={16} className="text-blue-600" />
                                      <span className="text-blue-800">Biological Provenance</span>
                                    </div>
                                    <p className="registry-text-main font-bold">{anchorData.anchor}</p>
                                    {anchorData.quote && (
                                      <div className="registry-quote-box mt-3 bg-white shadow-sm border-teal-100">
                                        <Quote size={20} className="text-teal-400 flex-shrink-0 mt-1" />
                                        <p className="registry-quote-text">"{anchorData.quote}"</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Right Side: Native Schema Data Box ── */}
      <div className="algo-schema-col">
        <h3 className="algo-schema-header bg-slate-800 text-slate-100 rounded-t-xl px-4 py-3 m-0 text-sm tracking-wide shadow-sm">
          MetaGx 16-Cohort Survival Model (JSON)
        </h3>
        <div className="algo-schema-box border-slate-200 bg-slate-900 !text-emerald-400 rounded-b-xl border-t-0 font-mono text-xs overflow-y-auto" style={{ height: '500px' }}>
          {schemaLoading ? (
             <div className="flex items-center justify-center h-full text-emerald-500/50 animate-pulse">
                &gt; Establishing secure connection to Platinum Artifacts...
             </div>
          ) : schemaError ? (
             <div className="text-red-400 text-center uppercase font-bold text-sm tracking-widest pt-20">
               [ERROR] {schemaError}
             </div>
          ) : (
             <pre className="whitespace-pre-wrap p-4">
               {JSON.stringify(schemaData, null, 2)}
             </pre>
          )}
        </div>
      </div>
    </div>
  );
}

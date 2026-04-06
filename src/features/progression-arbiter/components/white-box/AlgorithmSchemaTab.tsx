import React, { useState } from 'react';
import { Database, BookOpen, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { useArbiterArtifact } from '../../hooks/useArbiterArtifact';
import './AlgorithmSchemaTab.css';

const COEFFICIENT_ANCHORS: Record<string, any> = {
  "intercept": {
    raw_feature: "N/A",
    schema_desc: "Baseline log-odds of Progression before feature adjustment.",
    type: "Float",
    anchor: "Base incidence prior",
    quote: "Prior assigned assuming average baseline risk before feature adjustment."
  },
  "healing_flag": {
    raw_feature: "healing_flag",
    schema_desc: "Boolean flag from NLP reading of Radiology Reports.",
    type: "boolean",
    anchor: "Sammons Heuristic",
    quote: "When in doubt, a short interval rescan is almost always the right call over an immediate switch."
  },
  "img_NEW_SCLEROTIC_BONE": {
    raw_feature: "imaging_change_type",
    schema_desc: "One-hot encoded state of 'imaging_change_type' raw feature.",
    type: "enum state (0 or 1)",
    anchor: "Zhang 2021 & Yuan 2025",
    quote: "New osteoblastic lesions often signal a healing response, not disease progression."
  },
  "tx_ENDOCRINE": {
    raw_feature: "therapy_class",
    schema_desc: "One-hot encoded state of 'therapy_class'.",
    type: "enum state (0 or 1)",
    anchor: "Zhang 2021",
    quote: "CDK4/6i + Endocrine therapy cohort (n=48)"
  },
  "weeks_since_therapy_start_norm": {
    raw_feature: "weeks_since_therapy_start",
    schema_desc: "Normalized continuous variable for duration of therapy.",
    type: "numeric (standardized)",
    anchor: "Yuan 2025: Timing Prior",
    quote: "83% of pseudo-progression cases occur within the first 3 months of therapy."
  },
  "alp_delta_norm": {
    raw_feature: "alp_delta_pct",
    schema_desc: "Normalized continuous variable for Alkaline Phosphatase percent change.",
    type: "numeric (standardized)",
    anchor: "Jung 2022: ALP Trajectory",
    quote: "OR=10.6 for stable or decreasing ALP predicting bone flare vs true progression."
  },
  "symptomatic": {
    raw_feature: "symptomatic",
    schema_desc: "Boolean flag indicating if the patient has active symptoms or pain at site.",
    type: "boolean",
    anchor: "General Oncology Consensus",
    quote: "Pseudo-progression is almost always an asymptomatic radiological phenomenon."
  },
  "img_RECIST_PROGRESSION": {
    raw_feature: "imaging_change_type",
    schema_desc: "One-hot encoded state indicating objective RECIST 1.1 progression.",
    type: "enum state (0 or 1)",
    anchor: "Costelloe 2013",
    quote: "Definitive progression observed by central radiological review."
  }
};

export function AlgorithmSchemaTab() {
  const { data: schemaData, loading: schemaLoading, error: schemaError } = useArbiterArtifact('docs', 'event_schema.json');
  const { data: modelData } = useArbiterArtifact('models', 'progression_arbiter_model_v1.json');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  // Combine intercept and coefficients dynamically from the model artifact
  const liveWeights = React.useMemo(() => {
    if (!modelData) return {};
    return {
      intercept: modelData.intercept,
      ...modelData.coefficients
    };
  }, [modelData]);

  return (
    <div className="algo-container">
      
      {/* ── Left Side: Analytics Components (Equation & Unified Table) ── */}
      <div className="algo-left-col">
        
        {/* Component 1: Equation */}
        <div>
          <h3 className="algo-equation-header">Logistic Regression Equation</h3>
          <div className="algo-equation-box">
            <p className="algo-equation-text">
              $Logit(p) = \beta_0 + \sum \beta_i X_i$
            </p>
          </div>
        </div>
        
        {/* Component 2 & 3: Model Weights Table + Inline Registry */}
        <div>
          <div className="registry-header-row mb-4">
            <div className="registry-header-title-box">
                <Database size={28} className="text-emerald-600" />
                <h3 className="registry-main-title">White-Box Feature Registry</h3>
            </div>
            <span className="registry-hint-badge">
              Click Rows to Interrogate
            </span>
          </div>

          <div className="algo-table-container overflow-x-auto">
            <table className="algo-table min-w-[600px]">
              <thead>
                <tr>
                  <th>Coefficient Name</th>
                  <th>Value ($\beta$)</th>
                  <th>Clinical Bias</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(liveWeights).map(([key, rawVal]) => {
                  const val = rawVal as number;
                  const isExpanded = expandedFeature === key;
                  const anchorData = COEFFICIENT_ANCHORS[key] || {
                    raw_feature: key,
                    schema_desc: "Auto-discovered model feature.",
                    type: "dynamic",
                    anchor: "Model Weight",
                    quote: ""
                  };

                  return (
                    <React.Fragment key={key}>
                      {/* Main Coefficient Row */}
                      <tr 
                        onClick={() => setExpandedFeature(isExpanded ? null : key)}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}
                        style={isExpanded ? { borderBottom: '2px solid transparent' } : {}}
                      >
                        <td className="algo-table-key" style={isExpanded ? { color: '#047857' } : {}}>{key}</td>
                        <td className={`algo-table-val ${val < 0 ? 'neg' : val > 0 ? 'pos' : 'neu'}`}>
                          {val.toFixed(4)}
                        </td>
                        <td>
                          <span className={`algo-table-badge ${val < 0 ? 'neg' : val > 0 ? 'pos' : 'neu'}`}>
                            {val < 0 ? 'Inhibitor (Pseudo)' : val > 0 ? 'Promoter (Prog)' : 'Neutral' }
                          </span>
                        </td>
                        <td className="text-center text-slate-400">
                          {isExpanded ? <ChevronUp size={24} className="text-emerald-500 mx-auto" /> : <ChevronDown size={24} className="mx-auto" />}
                        </td>
                      </tr>

                      {/* Inline Expanded Registry Payload */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="p-0 border-b border-emerald-100">
                            <div className="p-8 bg-emerald-50/20 border-t-2 border-emerald-100">
                                
                                <div className="grid grid-cols-1 gap-8">
                                  {/* Schema Details */}
                                  <div>
                                    <div className="registry-section-header schema" style={{marginBottom: '0.75rem'}}>
                                      <Database size={16} />
                                      <span>JSON Schema Origin</span>
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
                                      <BookOpen size={16} />
                                      <span>Clinical Provenance</span>
                                    </div>
                                    <p className="registry-text-main font-bold">{anchorData.anchor}</p>
                                    {anchorData.quote && (
                                      <div className="registry-quote-box mt-3 bg-white shadow-sm border-blue-100">
                                        <Quote size={20} className="text-blue-400 flex-shrink-0 mt-1" />
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
        <h3 className="algo-schema-header">Clinical Event Schema (JSON)</h3>
        <div className="algo-schema-box">
          {schemaLoading ? (
             <div className="flex items-center justify-center h-full text-emerald-500/50 animate-pulse">
                &gt; Establishing secure connection to Arbiter Artifacts...
             </div>
          ) : schemaError ? (
             <div className="text-red-400 text-center uppercase font-bold text-sm tracking-widest pt-20">
               [ERROR] {schemaError}
             </div>
          ) : (
             <pre className="whitespace-pre-wrap">
               {JSON.stringify(schemaData, null, 2)}
             </pre>
          )}
        </div>
      </div>

    </div>
  );
}

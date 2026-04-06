import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

/** Types live in this module (with the hook) so Vite never loads an interface-only file as a runtime ES module. */
export interface StreamStep {
  type: string;
  message: string;
  query?: string;
  papers?: Array<{ pmid: string; title: string; journal: string; year: string }>;
  count?: number;
  total?: number;
  elapsed?: number;
  attempt?: number;
}

export interface Finding {
  pmid: string; title: string; year: string; journal: string;
  finding: string; evidence_type: string; maturity_tier: number;
  is_human_clinical: boolean; confidence: number; relevance_score: number; key_data_point: string;
}

export interface Mechanism {
  mechanism: string; target: string; evidence_strength: string;
  supporting_pmids: string[]; clinical_relevance: string;
}

export interface DrugInteraction {
  drug_a: string; drug_b: string; mechanism: string; clinical_impact: string;
  evidence_source: string; auc_change: string | null; source_pmid: string;
}

export interface SafetySignal {
  signal: string; frequency: string; grade: string; source_pmid: string;
}

export interface AnalysisResult {
  question: string; pubmedQuery: string; totalFound: number; articlesRetrieved: number;
  clinical_directive: string;
  human_clinical_papers_found: number; preclinical_papers_found: number;
  articles: Array<{ pmid: string; title: string; year: string; journal: string; doi: string; pmcid: string }>;
  findings: Finding[]; pmids: string[]; synthesized_mechanisms: Mechanism[];
  evidence_tier: 'SUPPORTED' | 'CONSIDER' | 'MECHANISTIC_SPECULATION' | 'INSUFFICIENT';
  badges: string[];
  dosage_signals: { dose: string; schedule: string; notes: string; source_pmids: string[] } | null;
  safety_signals: SafetySignal[]; drug_interactions: DrugInteraction[];
  knowledge_gaps: string[]; papers_discarded: Array<{ pmid: string; reason: string }>;
  cynical_summary: string;
}

export interface ParsedContext {
  disease: string; compound: string; treatmentLine: string;
  genes: string[]; suggestedQuestion: string; queryHint: string;
}

export interface StreamState {
  steps: StreamStep[];
  phase: 'idle' | 'running' | 'complete' | 'error';
}

export function useZetaCore() {
  const [question, setQuestion] = useState('');
  const [disease, setDisease] = useState('');
  const [compound, setCompound] = useState('');
  const [treatmentLine, setTreatmentLine] = useState('');
  const [genes, setGenes] = useState<string[]>([]);
  const [queryHint, setQueryHint] = useState('');
  const [maxResults, setMaxResults] = useState('12');

  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamState, setStreamState] = useState<StreamState>({ steps: [], phase: 'idle' });
  const [showTrace, setShowTrace] = useState(false);

  const resetContext = useCallback(() => {
    setDisease(''); setCompound(''); setTreatmentLine(''); setGenes([]); setQueryHint('');
  }, []);

  const parseContext = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 10) return;
    setParsing(true);
    try {
      const resp = await fetch(`${API_BASE}/api/v1/zeta-core/parse-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      if (!resp.ok) return;
      const data: ParsedContext = await resp.json();
      if (data.disease) setDisease(data.disease);
      if (data.compound) setCompound(data.compound);
      if (data.treatmentLine) setTreatmentLine(data.treatmentLine);
      if (data.genes?.length) setGenes(data.genes);
      if (data.suggestedQuestion && data.suggestedQuestion !== q) setQuestion(data.suggestedQuestion);
      if (data.queryHint) setQueryHint(data.queryHint);
    } catch { /* silent */ } finally {
      setParsing(false);
    }
  }, []);

  const analyze = useCallback(async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setShowTrace(true);
    setStreamState({ steps: [], phase: 'running' });

    try {
      const context: Record<string, unknown> = {};
      if (disease.trim()) context.disease = disease.trim();
      if (compound.trim()) context.compound = compound.trim();
      if (treatmentLine.trim()) context.treatmentLine = treatmentLine.trim();
      if (genes.length) context.genes = genes;

      const resp = await fetch(`${API_BASE}/api/v1/zeta-core/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), context, maxResults: parseInt(maxResults) }),
      });

      if (!resp.body) throw new Error('No response body — streaming not supported');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = 'message';

      const handleEvent = (evtType: string, raw: string) => {
        try {
          const data = JSON.parse(raw);
          if (evtType === 'step') {
            setStreamState(prev => ({ ...prev, steps: [...prev.steps, data as StreamStep] }));
          } else if (evtType === 'result') {
            setResult(data as AnalysisResult);
            setStreamState(prev => ({ ...prev, phase: 'complete' }));
          } else if (evtType === 'error') {
            setError((data as { message: string }).message ?? 'Analysis failed');
            setStreamState(prev => ({ ...prev, phase: 'error' }));
          }
        } catch { /* malformed */ }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const t = line.trim();
          if (t === '') { currentEventType = 'message'; }
          else if (t.startsWith('event: ')) { currentEventType = t.slice(7); }
          else if (t.startsWith('data: ')) { handleEvent(currentEventType, t.slice(6)); }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
      setStreamState(prev => ({ ...prev, phase: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [question, disease, compound, treatmentLine, genes, maxResults]);

  return {
    // state
    question, setQuestion,
    disease, setDisease,
    compound, setCompound,
    treatmentLine, setTreatmentLine,
    genes, setGenes,
    queryHint, setQueryHint,
    maxResults, setMaxResults,
    parsing, loading, result, error,
    streamState, showTrace, setShowTrace,
    // actions
    resetContext, parseContext, analyze,
    hasContext: !!(disease || compound || treatmentLine || genes.length),
  };
}

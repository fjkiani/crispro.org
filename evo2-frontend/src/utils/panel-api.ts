/**
 * API fetch wrappers for the VUS Triage Co-Pilot endpoints.
 *
 * Mirrors the pattern established in genome-api.ts:
 *   - URLs come from typed env vars (env.js / Zod schema)
 *   - Typed request / response interfaces
 *   - Errors are thrown as Error objects for the caller to handle
 */

import { env } from "~/env";

// ---------------------------------------------------------------------------
// TypeScript interfaces mirroring backend Pydantic schemas
// ---------------------------------------------------------------------------

export interface VariantInput {
  chr: string;
  pos: number;
  ref: string;
  alt: string;
  gene_symbol: string;
  genome?: string;
  sample_id?: string | null;
  clinvar_id?: string | null;
  clinvar_context?: string | null;
}

/** A single variant selected from the Known Variants table for triage. */
export interface CartItem {
  clinvar_id: string;
  title: string;
  classification: string;
  gene_symbol: string;
  chromosome: string;
  pos: number;
  ref: string;
  alt: string;
  genome: string;
}

export function cartItemToVariantInput(item: CartItem): VariantInput {
  return {
    chr: item.chromosome,
    pos: item.pos,
    ref: item.ref,
    alt: item.alt,
    gene_symbol: item.gene_symbol,
    genome: item.genome,
    clinvar_id: item.clinvar_id,
  };
}

export interface PanelAnalysisRequest {
  variants: VariantInput[];
  panel_name?: string | null;
  run_copilot?: boolean;
}

export interface Evo2RawResult {
  position: number;
  reference: string;
  alternative: string;
  delta_score: number;
  prediction: string;
  classification_confidence: number;
  splice_risk: string;
  splice_position: number | null;
  splice_boundary: string | null;
}

export interface CancerGeneAnnotation {
  is_cancer_gene: boolean;
  cancer_gene_tier: string | null;
  pathways: string[];
  gene_role: string | null;
  cancer_types: string[];
  oncokb_level: string | null;
}

export interface CompositeScore {
  raw_score: number;
  priority: "High" | "Medium" | "Low";
  score_components: {
    evo2_pathogenicity: number;
    splice_severity: number;
    cancer_gene_tier: number;
    evo2_confidence: number;
  };
}

export interface AnnotatedVariant {
  input: VariantInput;
  evo2: Evo2RawResult | null;
  cancer_annotation: CancerGeneAnnotation | null;
  composite: CompositeScore | null;
  rag_context: string[];
  clinvar_context: string | null;
  error: string | null;
}

export interface CopilotResponse {
  mode: string;
  report_markdown: string | null;
  answer: string | null;
  citations: string[];
  model_used: string;
  disclaimer: string;
  input_tokens: number;
  output_tokens: number;
}

export interface PanelAnalysisResponse {
  panel_name: string | null;
  genome: string;
  annotated_variants: AnnotatedVariant[];
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
  processing_time_seconds: number;
  copilot_report: CopilotResponse | null;
}

export type CopilotMode = "triage_report" | "tumor_board" | "followup_qa";

export interface CopilotRequest {
  annotated_variants: AnnotatedVariant[];
  panel_name?: string | null;
  mode: CopilotMode;
  followup_question?: string | null;
  conversation_history?: Array<{ role: "user" | "assistant"; content: string }>;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function analyzePanelWithAPI(
  request: PanelAnalysisRequest
): Promise<PanelAnalysisResponse> {
  const url = `${env.NEXT_PUBLIC_PANEL_ANALYSIS_BASE_URL}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to analyze panel: ${errorText}`);
  }

  return response.json() as Promise<PanelAnalysisResponse>;
}

export async function generateCopilotReport(
  request: CopilotRequest
): Promise<CopilotResponse> {
  const url = `${env.NEXT_PUBLIC_COPILOT_BASE_URL}/copilot/report`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate co-pilot report: ${errorText}`);
  }

  return response.json() as Promise<CopilotResponse>;
}

export async function chatWithCopilot(
  request: CopilotRequest
): Promise<CopilotResponse> {
  const url = `${env.NEXT_PUBLIC_COPILOT_BASE_URL}/copilot/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to chat with co-pilot: ${errorText}`);
  }

  return response.json() as Promise<CopilotResponse>;
}

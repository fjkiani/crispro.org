// Evo2 Modal backend API wrappers
// Base URL set via VITE_EVO2_API_URL in .env.local

import type {
  VariantInput,
  AnnotatedVariant,
  PanelAnalysisResponse,
  CopilotResponse,
  CopilotMode,
  ChatMessage,
} from '../types/triage';

function getBaseUrl(): string {
  const url = import.meta.env.VITE_EVO2_API_URL as string | undefined;
  if (!url) throw new Error('VITE_EVO2_API_URL is not set. Add it to .env.local');
  return url.replace(/\/$/, '');
}

export async function analyzePanel(
  variants: VariantInput[],
  panelName?: string
): Promise<PanelAnalysisResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/analyze_panel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variants, panel_name: panelName ?? null, run_copilot: false }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Panel analysis failed: ${text}`);
  }

  return res.json() as Promise<PanelAnalysisResponse>;
}

export async function generateReport(
  annotatedVariants: AnnotatedVariant[],
  mode: Exclude<CopilotMode, 'followup_qa'>,
  panelName?: string
): Promise<CopilotResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/copilot/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      annotated_variants: annotatedVariants,
      panel_name: panelName ?? null,
      mode,
      conversation_history: [],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Copilot report failed: ${text}`);
  }

  return res.json() as Promise<CopilotResponse>;
}

export async function chatWithCopilot(
  annotatedVariants: AnnotatedVariant[],
  question: string,
  history: ChatMessage[],
  panelName?: string
): Promise<CopilotResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/copilot/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      annotated_variants: annotatedVariants,
      panel_name: panelName ?? null,
      mode: 'followup_qa',
      followup_question: question,
      conversation_history: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Copilot chat failed: ${text}`);
  }

  return res.json() as Promise<CopilotResponse>;
}

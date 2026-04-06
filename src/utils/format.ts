/** Format utilities for CrisPRO UI */

export function formatScore(value: number, decimals = 4): string {
  return value.toFixed(decimals);
}

export function getUrgencyColor(urgency: string): string {
  const map: Record<string, string> = {
    IMMEDIATE: 'var(--emerald)',
    STANDARD: 'var(--cyan)',
    CAGE_BREAKING_FIRST: 'var(--amber)',
    INELIGIBLE: 'var(--red)',
  };
  return map[urgency] || 'var(--text-muted)';
}

export function getUrgencyGlow(urgency: string): string {
  const map: Record<string, string> = {
    IMMEDIATE: 'var(--emerald-glow)',
    STANDARD: 'var(--cyan-glow)',
    CAGE_BREAKING_FIRST: 'var(--amber-glow)',
    INELIGIBLE: 'var(--red-glow)',
  };
  return map[urgency] || 'transparent';
}

export function formatTrialRouting(routing: string): string {
  return routing.replace(/_/g, ' ');
}

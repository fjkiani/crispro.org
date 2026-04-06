/**
 * TypeScript interfaces mirroring the Platinum Window API models.
 * Keep in sync with api/models.py.
 */

export interface TreatmentStep {
  cycle: string;
  drugs: string[];
  rationale: string;
  condition?: string | null;
}

export interface ValidationContext {
  cohorts_validated: number;
  patients_validated: number;
  validation_type: string;
  data_type: string;
  prospective_validation: boolean;
  clia_validated: boolean;
  regulatory_status: string;
  OCT1_reference_n: number;
  OCT1_reference_warning: string;
}

export interface PlatinumWindowResponse {
  // Core
  window_status: string;
  fingerprint_positive: boolean;

  // Z-scores
  FAP_zscore: number;
  CXCL10_zscore: number;
  STROMAL_ARM_SCORE: number;
  IMMUNE_ACCESS_SCORE: number;
  TCELL_GPS_SCORE: number;
  OCT1_STATUS: string;
  OCT1_zscore: number;
  metformin_eligible: boolean;
  metformin_caveat: string | null;

  // Tier
  TIER: string;
  TIER_REFINED: string | null;

  // PLATINUM_SCORE
  PLATINUM_SCORE: number;
  PLATINUM_SCORE_percentile: number;
  PLATINUM_SCORE_percentile_reference: string;
  risk_tier: string;
  binary_HR_estimate: number;
  continuous_HR_estimate: number;
  score_confidence: string;
  validation_context: ValidationContext;

  // Window timing
  cycles_until_window_closes: number | null;
  cycles_remaining: number | null;
  weeks_remaining: number | null;
  intervention_deadline: string;

  // Treatment
  recommended_sequence: TreatmentStep[];

  // Urgency
  urgency: string;
  urgency_reason: string;
  trial_routing: string;

  // Confidence
  confidence_tier: string;
  caveats: string[];
  ruo_disclaimer: string;

  // Normalization
  normalization_warning: string;
  input_units_assumed: string;

  // Imputation / warnings
  cxcl10_imputation: string | null;
  cxcl10_imputation_note: string | null;
  assay_warning: string | null;

  // Audit
  model_version: string;
  reference_cohort: string;
  computation_ms: number;
  timestamp_utc: string;
}

export interface PlatinumWindowRequest {
  FAP: number;
  CXCL10: number | null;
  CXCL9: number;
  CXCL11: number;
  CXCR3: number;
  ACTA2: number;
  POSTN: number;
  CXCL12: number;
  CXCR4: number;
  SLC22A1: number;
  platinum_status: 'sensitive' | 'resistant' | 'naive';
  prior_platinum_cycles: number;
  histotype: 'HGSOC' | 'PAAD' | 'other';
}

export interface HealthResponse {
  status: string;
  model_version: string;
  reference_cohort: string;
  reference_n: number;
  reference_loaded: boolean;
}

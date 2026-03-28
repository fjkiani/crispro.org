/**
 * TypeScript interfaces for the Progression Arbiter API.
 * Keep in sync with backend/capabilities/progression_arbiter/models.py.
 */

export type ImagingChangeType =
  | 'NEW_SCLEROTIC_BONE'
  | 'SUV_INCREASE_NO_SIZE'
  | 'SUB_5MM_SIZE_INCREASE'
  | 'NEW_SOFT_TISSUE_LESION'
  | 'RECIST_PROGRESSION'
  | 'STABLE_DISEASE'
  | 'OTHER_OR_UNCLEAR';

export type TherapyClass =
  | 'CDK46'
  | 'HER2'
  | 'ENDOCRINE'
  | 'CHEMO'
  | 'IO'
  | 'OTHER';

export type RiskBucket = 'LOW' | 'MID' | 'HIGH';

export type ArbiterRecommendation =
  | 'SHORT_INTERVAL_RESCAN'
  | 'ADDITIONAL_WORKUP_REQUIRED'
  | 'IMMEDIATE_SWITCH_CONCERN';

export interface ArbiterScoreRequest {
  imaging_change_type: ImagingChangeType;
  therapy_class: TherapyClass;
  symptomatic: boolean | null;
  new_pain_at_site: boolean | null;
  healing_flag: boolean;
  weeks_on_therapy: number;
  alp_delta_pct: number;
  ca153_delta_pct: number;
}

export interface ArbiterScoreResponse {
  p_true_progression: number;
  logit: number;
  risk_bucket: RiskBucket;
  recommendation: ArbiterRecommendation;
  term_contributions: Record<string, number>;
  driving_feature: string;
  driving_feature_contribution: number;
  explanation: string;
  disclaimer: string;
}

export interface RadiologyParseResponse {
  imaging_change_type: string;
  healing_flag: boolean;
  key_phrases: string[];
  confidence: string;
}

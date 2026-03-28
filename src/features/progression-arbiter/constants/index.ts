export const PROGRESSION_ARBITER = {
  title: 'PROGRESSION_ARBITER',
  subtitle: 'Bone Pseudo-Progression vs True Progression Scoring',
  stats: '239 Events | 9 Studies | L2 Logistic Regression',
} as const;

export const ARBITER_CONTEXT = {
  problemDescription:
    'Bone imaging changes during systemic therapy for metastatic breast cancer are frequently ambiguous. New sclerotic lesions, isolated SUV increases, and sub-5mm size changes can represent either healing (pseudo-progression) or true disease progression. Premature therapy switches based on these findings can deny patients benefit from effective treatment.',
  whoNeedsThis:
    'Medical oncologists treating metastatic breast cancer with bone-predominant disease, radiologists interpreting restaging scans, and tumor boards evaluating equivocal bone findings.',
} as const;

export const IMAGING_TYPES = [
  { value: 'NEW_SCLEROTIC_BONE', label: 'New Sclerotic Bone Lesion' },
  { value: 'SUV_INCREASE_NO_SIZE', label: 'SUV Increase (No Size Change)' },
  { value: 'SUB_5MM_SIZE_INCREASE', label: 'Sub-5mm Size Increase' },
  { value: 'NEW_SOFT_TISSUE_LESION', label: 'New Soft Tissue Lesion' },
  { value: 'RECIST_PROGRESSION', label: 'RECIST Definitive Progression' },
  { value: 'STABLE_DISEASE', label: 'Stable Disease' },
  { value: 'OTHER_OR_UNCLEAR', label: 'Other/Unclear' },
] as const;

export const THERAPY_CLASSES = [
  { value: 'CDK46', label: 'CDK4/6 Inhibitor' },
  { value: 'HER2', label: 'HER2-Targeted' },
  { value: 'ENDOCRINE', label: 'Endocrine Therapy Only' },
  { value: 'CHEMO', label: 'Chemotherapy' },
  { value: 'IO', label: 'Immunotherapy' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const ARBITER_DEFAULTS = {
  imaging_change_type: 'NEW_SCLEROTIC_BONE' as const,
  therapy_class: 'ENDOCRINE' as const,
  symptomatic: false,
  new_pain_at_site: false,
  healing_flag: true,
  weeks_on_therapy: 12,
  alp_delta_pct: 0,
  ca153_delta_pct: 0,
};

export const ARBITER_RISK_LABELS = {
  LOW: '🟢 LOW RISK — Likely Pseudo-Progression',
  MID: '🟡 INDETERMINATE — Additional Workup Required',
  HIGH: '🔴 HIGH RISK — True Progression Concern',
} as const;

export const ARBITER_CAPABILITIES = [
  {
    icon: '🎯',
    title: 'The Clinical Trigger',
    desc: 'Deterministic integration of mBC sclerotic pseudo-progression. Encodes clinical heuristics: integrating clinical symptoms, tumor markers, and serial imaging to prevent premature therapy switches.',
    status: 'LIVE',
  },
  {
    icon: '📚',
    title: 'The Data Backbone',
    desc: 'Anchored to 253 validated events across 9 published studies. Integrates Lin 2021 (22.9% pseudo-progression incidence) and Xu 2025 (timing prior and biomarker bridges).',
    status: 'LIVE',
  },
  {
    icon: '⚖️',
    title: 'Computational Architecture',
    desc: 'L2-regularized logistic regression coefficients strictly dictate P(true_progression). Healing logic computationally overpowers surface-level lesion progression (healing_flag weight: -3.1381).',
    status: 'LIVE',
  },
  {
    icon: '🛡️',
    title: 'System Audit & Proof',
    desc: 'Automated vignette stress-testing validates a 0.7% (1/148) erroneous switch rate among events the model classified as likely pseudo-progression.',
    status: 'LIVE',
  }
];

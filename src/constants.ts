/**
 * CrisPRO Constants
 * All copy, provenance, and configuration in one place.
 * Nothing is hardcoded in components — everything references this file.
 */

// ── Platform Identity ────────────────────────────────────────────────────────

export const PLATFORM = {
  name: 'CrisPRO',
  domain: '.org',
  fullName: 'CrisPRO.org',
  tagline: 'Precision Oncology for the 90%',
  description:
    'Open-source clinical decision support powered by CRISPR functional genomics. Turning molecular data into actionable treatment timing.',
  disclaimer: 'Research Use Only',
  footer: 'CrisPRO.org — Precision Oncology for the 90% · Research Use Only',
} as const;

// ── Platinum Window ──────────────────────────────────────────────────────────

export const PLATINUM_WINDOW = {
  title: 'PLATINUM_WINDOW',
  subtitle: 'Precision Timing for HGSOC Platinum-Based Therapy',
  stats: '8D Biomarker Fingerprint | 2,444 Patients | 16 Cohorts',
  modelVersion: '1.0.0',
} as const;

// ── Provenance & Validation ──────────────────────────────────────────────────

export const PROVENANCE = {
  cohort: 'TCGA PanCancer Atlas',
  cohortSize: 2444,
  cohortCount: 16,
  regressionMethod: 'Elastic net Cox proportional hazards',
  hazardRatio: 0.5422,
  hazardRatioCI: '95% CI [0.38–0.77]',
  pValue: '<0.001',
  validationType: 'Leave-one-cohort-out cross-validation',
  referenceOCT1_n: 113,
  dataSource: 'TCGA GDC RNA-seq (HTSeq TPM)',
  genes: ['FAP', 'CXCL10', 'CXCL9', 'CXCL11', 'CXCR3', 'ACTA2', 'POSTN', 'CXCL12', 'CXCR4', 'SLC22A1'],
  publications: [
    {
      id: 'pub1',
      label: 'Stromal-Immune Axis in HGSOC',
      detail: 'FAP/CXCL10 z-score fingerprint identifies platinum-sensitive HGSOC patients',
    },
    {
      id: 'pub2',
      label: 'Metformin + Dupilumab Sequencing',
      detail: 'AMPK activation → M2 reprogramming → checkpoint amplification',
    },
  ],
} as const;

// ── Clinical Context ─────────────────────────────────────────────────────────

export const CLINICAL_CONTEXT = {
  problemTitle: 'The Timing Problem in Ovarian Cancer',
  problemDescription:
    'In high-grade serous ovarian cancer (HGSOC), the window for effective platinum-based chemotherapy closes as stromal fibroblasts build a physical barrier around the tumor — the "stromal cage." Current clinical practice uses fixed calendar schedules and RECIST imaging, which cannot see this molecular deadline.',
  solutionTitle: 'What Platinum Window Does',
  solutionDescription:
    'This tool combines 10 gene expression measurements from the patient\'s tumor biopsy with the prior treatment history to compute a real-time molecular score. It answers three questions:',
  solutionPoints: [
    {
      icon: '⏱️',
      title: 'When does the window close?',
      detail: 'Patient-specific cycle countdown before FAP-driven stromal cage seals.',
    },
    {
      icon: '📊',
      title: 'How likely is this patient to respond?',
      detail: 'PLATINUM_SCORE 0–1 derived from elastic net Cox regression across 2,444 HGSOC patients.',
    },
    {
      icon: '💊',
      title: 'What sequence should be used?',
      detail: 'Automated 3-step treatment plan: metformin (AMPK) → dupilumab (M2) → checkpoint inhibitor.',
    },
  ],
  whoNeedsThis:
    'Gynecologic oncologists, tumor boards, and translational researchers evaluating platinum-based therapy timing for HGSOC patients post-debulking surgery.',
} as const;

// ── Capabilities ─────────────────────────────────────────────────────────────

export type CapabilityStatus = 'LIVE' | 'BETA' | 'COMING SOON';

export interface Capability {
  icon: string;
  title: string;
  subtitle?: string;
  desc: string;
  status: CapabilityStatus;
  link?: string;
  tag?: string;               // short label e.g. 'Ovarian · HGSOC'
  gradient?: string;          // tailwind gradient class
  stats?: { value: string; label: string }[];
  features?: string[];        // bullet highlights
  ctaLabel?: string;
}

// ── PRODUCTS (drives the homepage dynamically) ───────────────────────────────

export const PRODUCTS: Capability[] = [
  {
    icon: '💎',
    title: 'Platinum Window',
    subtitle: 'Real-time platinum timing for HGSOC',
    tag: 'Ovarian Cancer · HGSOC',
    desc: 'Patient-specific molecular countdown before the stromal cage closes platinum responsiveness. Replace calendar-based dosing with a data-driven treatment window derived from 10-gene tumor profiling.',
    status: 'LIVE',
    link: '/platinum-window',
    gradient: 'from-violet-500 to-indigo-600',
    stats: [
      { value: '2,444', label: 'Patients' },
      { value: '16', label: 'Cohorts' },
      { value: '0.54', label: 'Hazard Ratio' },
      { value: '10', label: 'Genes' },
    ],
    features: [
      '8D Biomarker Fingerprint (FAP + CXCL10)',
      'Elastic net Cox regression · HR 0.54',
      'Patient-specific cycle countdown',
      'Automated 3-step treatment sequencer',
    ],
    ctaLabel: 'Try Platinum Window',
  },
  {
    icon: '🦴',
    title: 'Progression Arbiter',
    subtitle: 'Bone pseudo-progression vs true progression',
    tag: 'Breast Cancer · Bone Mets',
    desc: 'L2 logistic regression model trained on 239 progression events from 9 published mBC studies. Disambiguates true progression from pseudo-progression in bone-metastatic breast cancer before irreversible treatment decisions.',
    status: 'LIVE',
    link: '/progression-arbiter',
    gradient: 'from-emerald-500 to-teal-600',
    stats: [
      { value: '239', label: 'Events' },
      { value: '9', label: 'Studies' },
      { value: 'L2', label: 'Model' },
      { value: 'mBC', label: 'Indication' },
    ],
    features: [
      'Bone-specific pseudo-progression scoring',
      'L2 logistic regression · validated',
      'Clinical signal integration (ECOG, pain, ALP)',
      'Multi-factor confidence output',
    ],
    ctaLabel: 'Try Progression Arbiter',
  },
  {
    icon: '📜',
    title: 'PAE-Onc',
    subtitle: 'AI-powered prior authorization appeal engine',
    tag: 'Insurance Appeals · Oncology',
    desc: 'Autonomous 3-agent pipeline (Ingestion → Ground Truth Match → Appeal Generation) that fights back against wrongful insurance denials of FDA-approved, NCCN-guideline-supported oncology treatments.',
    status: 'BETA',
    link: '/pae-onc',
    gradient: 'from-red-500 to-rose-600',
    stats: [
      { value: '34%', label: 'Denial Rate' },
      { value: '80%', label: 'Overturn Rate' },
      { value: '6–10h', label: 'Saved/Appeal' },
      { value: '3', label: 'AI Agents' },
    ],
    features: [
      'Agent A: Denial ingestion & normalization',
      'Agent B: NCCN/FDA ground truth matching',
      'Agent C: Cohere LLM appeal generation',
      'Manual review → edit → RingCentral fax',
    ],
    ctaLabel: 'Open PAE-Onc',
  },
  {
    icon: '🧪',
    title: 'Resistance Profiler',
    subtitle: '7D mechanistic resistance detection',
    tag: 'Multi-cancer · Resistance',
    desc: 'Real-time molecular surveillance across platinum, taxane, and checkpoint resistance pathways using a 7D mechanistic vector space with a deterministic 2-of-N state machine.',
    status: 'COMING SOON',
    gradient: 'from-amber-500 to-orange-600',
    features: [
      '7D mechanistic vector space',
      '2-of-N deterministic state machine',
      'Multi-pathway resistance scoring',
      'Kills Chain re-ranking on resistance signal',
    ],
    ctaLabel: 'Get Notified',
  },
  {
    icon: '🏥',
    title: 'Trial Matcher',
    subtitle: 'Molecular-profile trial routing',
    tag: 'All Cancers · Trials',
    desc: 'Automated eligibility matching against active NCI/ClinicalTrials.gov trials based on molecular profile, biomarker status, and inclusion/exclusion criteria.',
    status: 'COMING SOON',
    gradient: 'from-sky-500 to-blue-600',
    features: [
      'Live ClinicalTrials.gov integration',
      'Biomarker-first eligibility matching',
      'NCCN guideline cross-reference',
      'Distance & site availability filter',
    ],
    ctaLabel: 'Get Notified',
  },
];

// Legacy CAPABILITIES alias for backward compatibility
export const CAPABILITIES: Capability[] = PRODUCTS;

// ── Progression Arbiter Constants extracted to src/features/progression-arbiter/constants/index.ts

// ── Mission ──────────────────────────────────────────────────────────────────

export const MISSION = {
  title: 'Our Mission',
  body: 'Every patient with high-grade serous ovarian cancer deserves treatment timed to their molecular window — not calendar conventions. CrisPRO translates CRISPR functional genomics research into tools that oncologists can use at the point of care.',
} as const;

// ── Default Patient Data ─────────────────────────────────────────────────────

export const PATIENT_1_DEFAULTS = {
  FAP: 50.0,
  CXCL10: 15000.0,
  CXCL9: 8000.0,
  CXCL11: 4000.0,
  CXCR3: 600.0,
  ACTA2: 500.0,
  POSTN: 200.0,
  CXCL12: 300.0,
  CXCR4: 500.0,
  SLC22A1: 200.0,
  platinum_status: 'sensitive' as const,
  prior_platinum_cycles: 0,
  histotype: 'HGSOC' as const,
};

export const GENE_FIELDS = [
  'FAP', 'CXCL10', 'CXCL9', 'CXCL11', 'CXCR3',
  'ACTA2', 'POSTN', 'CXCL12', 'CXCR4', 'SLC22A1',
] as const;

// ── About ────────────────────────────────────────────────────────────────────

export const ABOUT = {
  createdBy: 'CrisPRO.ai',
  founder: 'Fahad Kiani',
  founderRole: 'Founder & CEO',
  founderBio:
    'Fahad Kiani is a technologist and entrepreneur building AI systems that translate cutting-edge genomics research into clinical decision support tools. His mission is to democratize precision oncology — ensuring that molecular-guided treatment is accessible beyond the 10% of patients treated at elite academic centers.',
  visionTitle: 'Why We Exist',
  visionBody:
    'Today, fewer than 10% of cancer patients receive treatment guided by molecular profiling. The other 90% are treated with calendar-based protocols and population averages. CrisPRO exists to close that gap — not by replacing physicians, but by giving every oncologist the molecular intelligence that only a handful of academic centers currently possess.',
  standardOfCareProblems: [
    {
      icon: '📅',
      title: 'Calendar-Based Dosing',
      detail: 'Standard of care uses fixed 21-day cycles for platinum chemotherapy. It ignores that each patient\'s tumor microenvironment evolves at a different rate — some patients need intervention at cycle 2, others can safely wait to cycle 6.',
    },
    {
      icon: '📏',
      title: 'One-Size-Fits-All Protocols',
      detail: 'NCCN guidelines stratify by stage and histology, but not by the molecular composition of the tumor stroma. Two Stage IIIC HGSOC patients can have radically different stromal-immune landscapes — and radically different treatment windows.',
    },
    {
      icon: '🔬',
      title: 'Imaging Lag',
      detail: 'RECIST criteria (CT-based response assessment) detect changes weeks to months after the molecular window has closed. By the time imaging shows progression, the stromal cage has already sealed.',
    },
    {
      icon: '🏥',
      title: 'Access Inequality',
      detail: 'Molecular profiling and precision oncology expertise are concentrated in a few academic medical centers. Community oncologists — who treat the majority of cancer patients — often lack the tools to interpret and act on genomic data.',
    },
    {
      icon: '⚡',
      title: 'Resistance Blindness',
      detail: 'Current practice detects platinum resistance after it has occurred (rising CA-125, progressive disease on imaging). There is no standard mechanism for real-time molecular surveillance of resistance emergence.',
    },
    {
      icon: '🧩',
      title: 'Siloed Biomarkers',
      detail: 'Individual biomarkers (BRCA status, HRD score) are evaluated in isolation. No standard tool integrates stromal, immune, and metabolic markers into a unified treatment-timing signal.',
    },
  ],
  howWeHelp: [
    {
      icon: '🎯',
      title: 'Molecular Timing, Not Calendar Timing',
      detail: 'Our Platinum Window tool computes a patient-specific cycle countdown based on 10-gene stromal-immune profiling — replacing arbitrary 21-day schedules with data-driven treatment windows.',
    },
    {
      icon: '🌐',
      title: 'Democratize Access',
      detail: 'CrisPRO.org is open-source so any oncologist — from a community clinic in rural America to a teaching hospital in Nairobi — can access the same molecular intelligence as MD Anderson or Memorial Sloan Kettering.',
    },
    {
      icon: '🤝',
      title: 'Assist, Not Replace',
      detail: 'CrisPRO is a decision-support tool, not an autonomous agent. It surfaces molecular signals, treatment timing, and trial routing — but the oncologist makes the final call. Every recommendation comes with full provenance and confidence intervals.',
    },
  ],
} as const;

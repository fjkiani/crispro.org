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

export type CapabilityStatus = 'LIVE' | 'COMING SOON';

export interface Capability {
  icon: string;
  title: string;
  desc: string;
  status: CapabilityStatus;
  link?: string;
}

export const CAPABILITIES: Capability[] = [
  {
    icon: '🧬',
    title: '8D Biomarker Fingerprint',
    desc: `FAP + CXCL10 scored against ${PROVENANCE.cohortSize.toLocaleString()} ${PROVENANCE.cohort} HGSOC patients. ${PROVENANCE.regressionMethod} yields PLATINUM_SCORE with HR ${PROVENANCE.hazardRatio}.`,
    status: 'LIVE',
    link: '/platinum-window',
  },
  {
    icon: '⏱️',
    title: 'Window Timer',
    desc: 'Patient-specific countdown for platinum cycles remaining before stromal cage closure. Metformin extends +2–3 cycles via AMPK activation.',
    status: 'LIVE',
    link: '/platinum-window',
  },
  {
    icon: '💊',
    title: 'Treatment Sequencer',
    desc: 'Automated 3-step sequence: Metformin → Dupilumab → Checkpoint inhibitor. Routes to Publication 1 or Publication 2 trial pathway.',
    status: 'LIVE',
    link: '/platinum-window',
  },
  {
    icon: '🧪',
    title: 'Resistance Profiler',
    desc: 'Multi-mechanism resistance detection across platinum, taxane, and checkpoint pathways. 7D mechanistic vector space with 2-of-N state machine.',
    status: 'COMING SOON',
  },
  {
    icon: '📊',
    title: 'Cohort Explorer',
    desc: `Interactive visualization of ${PROVENANCE.cohort} and institutional cohort distributions. Position any patient against the reference population.`,
    status: 'COMING SOON',
  },
  {
    icon: '🏥',
    title: 'Trial Matcher',
    desc: 'Automated matching against active clinical trials based on molecular profile, biomarker status, and eligibility criteria.',
    status: 'COMING SOON',
  },
];

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

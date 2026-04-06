import { Link } from "wouter";
import { 
  ShieldAlert, Clock, FileX, DollarSign, Brain, Zap, 
  ArrowRight, AlertTriangle, Users, Scale 
} from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-50 via-white to-amber-50 dark:from-red-950/40 dark:via-background dark:to-amber-950/20 border border-red-100 dark:border-red-900/30 p-10 lg:p-16 shadow-sm">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <ShieldAlert className="w-96 h-96 text-red-600" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-sm font-medium mb-6">
            <ShieldAlert className="w-4 h-4" />
            The PAE-Onc Mission
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
            Fighting back against the <span className="text-red-600 dark:text-red-500">broken</span> prior authorization system.
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-10">
            Every year, insurance companies deny thousands of oncology prior authorization requests — 
            often for FDA-approved, NCCN-guideline-supported therapies. Patients with cancer are forced 
            to wait days or weeks while their doctors fight bureaucratic battles instead of treating disease.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-red-100 dark:border-red-900/30 shadow-sm transition-transform hover:-translate-y-1">
              <Clock className="w-6 h-6 text-red-500 mb-3" />
              <div className="text-3xl font-black text-foreground mb-1">34%</div>
              <div className="text-sm font-medium text-muted-foreground">of oncology PA requests<br/>are initially denied</div>
            </div>
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-red-100 dark:border-red-900/30 shadow-sm transition-transform hover:-translate-y-1">
              <FileX className="w-6 h-6 text-red-500 mb-3" />
              <div className="text-3xl font-black text-foreground mb-1">14 days</div>
              <div className="text-sm font-medium text-muted-foreground">average delay from<br/>denial to treatment start</div>
            </div>
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-red-100 dark:border-red-900/30 shadow-sm transition-transform hover:-translate-y-1">
              <DollarSign className="w-6 h-6 text-red-500 mb-3" />
              <div className="text-3xl font-black text-foreground mb-1">$31B</div>
              <div className="text-sm font-medium text-muted-foreground">annual administrative waste<br/>on PA in the US</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* The Problem */}
        <div className="bg-card border border-border rounded-3xl p-10 shadow-sm h-full">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            The System is Broken
          </h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
            <p>
              <strong className="text-foreground font-semibold">Prior Authorization</strong> was designed as a cost-containment tool. 
              In oncology, it has become a weapon. Payers routinely deny FDA-approved, NCCN-supported treatments by 
              citing outdated formularies, requiring step therapy through inferior drugs, or classifying proven 
              therapies as "experimental."
            </p>
            <div className="pl-4 border-l-4 border-amber-200 dark:border-amber-800/50 italic py-2">
              When <strong className="text-foreground font-semibold">Enhertu (trastuzumab deruxtecan)</strong> was denied for a 
              HER2-low breast cancer patient — despite FDA approval and NCCN Category 1 recommendation — because 
              the payer's coverage policy hadn't been updated to include IHC 1+ patients, the oncologist had to 
              compile a massive dossier to fight back.
            </div>
            <p>
              <strong className="text-foreground font-semibold">That is 6–10 hours of physician time per appeal.</strong> Time 
              that should be spent treating patients. And <span className="text-amber-600 dark:text-amber-500 font-bold">80% of these denials are overturned</span> on appeal — meaning 
              the initial denial was wrong in the first place.
            </p>
          </div>
        </div>

        {/* How PAE-Onc Fights Back */}
        <div className="bg-card border border-border rounded-3xl p-10 shadow-sm h-full">
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            How PAE-Onc Fights Back
          </h2>
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {[
              {
                step: "1",
                icon: FileX,
                title: "Denial Ingestion",
                desc: "Paste or upload the denial letter. Our AI extracts the payer, drug, ICD-10 codes, and denial reason in seconds."
              },
              {
                step: "2",
                icon: Scale,
                title: "Ground Truth Matching",
                desc: "We match the denied drug against our NCCN/FDA ground truth database to identify the exact conflict — outdated policy or guideline mismatch."
              },
              {
                step: "3",
                icon: Zap,
                title: "AI-Generated Appeal",
                desc: "Cohere generates a 7-section appeal letter citing NCCN guidelines, FDA approval data, peer-reviewed evidence, and legal frameworks."
              },
              {
                step: "4",
                icon: Users,
                title: "Review, Edit, and Fax",
                desc: "You review and edit every section before sending. One click delivers the appeal packet directly to the payer's Medical Director via RingCentral fax."
              },
            ].map(({ step, icon: Icon, title, desc }, index) => (
              <div key={step} className="relative flex items-start gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md z-10 border-4 border-card relative">
                  {step}
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary opacity-80" />
                    {title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Layer */}
      <div className="bg-card border border-border rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Ready to fight back?</h3>
          <p className="text-muted-foreground text-lg">Start ingesting your first denial letter and building the appeal dossier.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
          <Link href="/ground-truth">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold py-4 px-8 rounded-xl hover:bg-secondary/80 transition-all font-medium whitespace-nowrap">
              Explore Ground Truth
            </button>
          </Link>
          <Link href="/denials/new">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all whitespace-nowrap">
              Start Appeal Pipeline
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

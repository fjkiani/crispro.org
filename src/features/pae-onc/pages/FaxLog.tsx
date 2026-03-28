import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/features/pae-onc/lib/queryClient";
import { useToast } from "@/features/pae-onc/hooks/use-toast";
import {
  Send, CheckCircle, Clock, AlertCircle, FileText,
  X, User, Phone, ChevronRight, Pencil, Save, ArrowRight, Download
} from "lucide-react";
import { useState } from "react";


const SECTION_LABELS: Record<string, string> = {
  executiveSummary: "Executive Summary",
  clinicalBackground: "Clinical Background",
  nccnFdaSection: "NCCN & FDA Evidence",
  payerContradictionSection: "Payer Contradiction Analysis",
  legalFrameworkSection: "Legal Framework",
  requestedResolution: "Requested Resolution",
};

function parseSections(a: any): Record<string, string> {
  try {
    const c = typeof a.generatedContent === "string" ? JSON.parse(a.generatedContent) : a.generatedContent;
    return c || {};
  } catch { return {}; }
}

export default function FaxLogPage() {
  const { toast } = useToast();
  const { data: logs = [] } = useQuery<any[]>({ queryKey: ["/api/fax-log"] });
  const { data: appeals = [] } = useQuery<any[]>({ queryKey: ["/api/appeals"] });

  // Which appeal is selected in the send panel
  const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);

  // Doctor contact form state
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    title: "",
    clinic: "",
    npi: "",
    phone: "",
    email: "",
  });

  // Editable fax number
  const [faxOverride, setFaxOverride] = useState("");
  const [editingSections, setEditingSections] = useState<Record<string, string>>({});
  const [isEditingContent, setIsEditingContent] = useState(false);

  // Stats
  const total = logs.length;
  const delivered = logs.filter((l: any) => l.status === "delivered").length;
  const totalCost = logs.reduce((sum: number, l: any) => sum + (l.costCents || 0), 0);


  // Ready appeals (not yet faxed)
  const readyAppeals = appeals.filter((a: any) => a.status === "generated");

  const saveAppeal = useMutation({
    mutationFn: ({ appealId, content }: { appealId: string; content: Record<string, string> }) =>
      apiRequest("PATCH", `/api/appeals/${appealId}`, { generatedContent: JSON.stringify(content) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appeals"] });
      toast({ title: "Appeal Updated", description: "Content saved." });
      setIsEditingContent(false);
    },
    onError: (e: any) => toast({ title: "Save Error", description: e.message, variant: "destructive" }),
  });

  const sendFax = useMutation({
    mutationFn: ({ appealId, faxNumber, doctor }: { appealId: string; faxNumber: string; doctor: any }) =>
      apiRequest("POST", `/api/appeals/${appealId}/fax`, { faxNumber, doctor }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fax-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appeals"] });
      toast({
        title: "📠 Fax Sent!",
        description: `Job ${data.faxJobId} queued via RingCentral.`,
      });
      setSelectedAppeal(null);
    },
    onError: (e: any) => toast({ title: "Fax Error", description: e.message, variant: "destructive" }),
  });

  const openPanel = (appeal: any) => {
    setSelectedAppeal(appeal);
    const sections = parseSections(appeal);
    setEditingSections({ ...sections });
    setFaxOverride(appeal.payerFaxNumber || "");
    setIsEditingContent(false);
  };

  const handleSend = () => {
    if (!selectedAppeal) return;
    if (!faxOverride.trim()) {
      toast({ title: "Fax number required", description: "Enter a valid fax number.", variant: "destructive" });
      return;
    }
    if (!doctorForm.name.trim()) {
      toast({ title: "Doctor name required", description: "Enter submitting physician name.", variant: "destructive" });
      return;
    }
    sendFax.mutate({ appealId: selectedAppeal.appealId, faxNumber: faxOverride, doctor: doctorForm });
  };

  return (
    <div className="h-full flex">
      {/* Main panel */}
      <div className={`flex-1 overflow-y-auto p-8 space-y-6 transition-all duration-300 ${selectedAppeal ? "pr-4" : ""}`}>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Send className="w-6 h-6 text-primary" />
            Fax Delivery Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Select an appeal below to review, edit, and fax to the payer Medical Director</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ready to Send", value: readyAppeals.length, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Total Sent", value: total, icon: Send, color: "text-primary", bg: "bg-primary/5" },
            { label: "Delivered", value: delivered, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
            { label: "Total Spend", value: `$${(totalCost / 100).toFixed(2)}`, icon: Clock, color: "text-muted-foreground", bg: "bg-muted/60" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} border border-border rounded-xl p-5 flex items-center gap-3`}>
              <Icon className={`w-8 h-8 ${color} opacity-80`} />
              <div>
                <div className="text-xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Ready Appeals — clickable to open send panel */}
        {readyAppeals.length > 0 && (
          <div className="bg-card border border-amber-200 dark:border-amber-800/40 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-amber-50/50 dark:bg-amber-900/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Appeals Ready to Send ({readyAppeals.length})
              </h2>
              <span className="text-xs text-muted-foreground">Click any row to open the send workflow</span>
            </div>

            <div className="divide-y divide-border">
              {readyAppeals.map((a: any) => (
                <div
                  key={a.appealId}
                  className={`flex items-center justify-between px-6 py-4 hover:bg-primary/5 transition-colors group ${selectedAppeal?.appealId === a.appealId ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                >
                  {/* Left — clickable area opens panel */}
                  <button
                    onClick={() => openPanel(a)}
                    className="flex items-center gap-4 text-left flex-1 min-w-0"
                  >
                    <FileText className="w-8 h-8 text-primary opacity-60 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground">{a.appealId}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {a.drugName} / {a.payerId} · Denial: {a.denialRecordId} · Patient: {a.patientId}
                      </div>
                    </div>
                  </button>
                  {/* Right — action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {a.pdfPath && (
                      <a
                        href={`/api/appeals/${a.appealId}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/70 text-foreground px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    )}
                    <button
                      onClick={() => openPanel(a)}
                      className="flex items-center gap-1.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      Send Fax
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Fax History Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Delivery History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  {["Appeal ID", "Payer", "Fax Number", "Job ID", "Status", "Pages", "Cost", "Sent At", "Delivered At"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log: any) => {
                  const appeal = appeals.find((a: any) => a.appealId === log.appealId);
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-muted/40 ${appeal ? "cursor-pointer" : ""}`}
                      onClick={() => appeal && openPanel(appeal)}
                      data-testid={`row-fax-${log.id}`}
                    >
                      <td className="px-4 py-3 font-medium text-primary hover:underline">{log.appealId}</td>
                      <td className="px-4 py-3 text-foreground">{log.payerId}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{log.faxNumber}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{log.jobId}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === "delivered" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                          log.status === "queued" || log.status === "sending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>{log.status}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{log.pageCount}</td>
                      <td className="px-4 py-3 text-muted-foreground">${((log.costCents || 0) / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">No fax records yet.</div>
            )}
          </div>
        </div>

        {/* Payer Directory */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Medical Director Fax Directory</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { payer: "UHC", name: "UnitedHealthcare", fax: "+1-866-252-0566" },
              { payer: "Cigna", name: "Cigna Health", fax: "+1-800-337-0255" },
              { payer: "Aetna", name: "Aetna", fax: "+1-860-754-3604" },
              { payer: "Humana", name: "Humana", fax: "+1-800-457-4708" },
            ].map(({ payer, name, fax }) => (
              <div key={payer} className="border border-border rounded-lg p-3 hover:border-primary/40 transition-colors">
                <div className="text-sm font-semibold text-foreground mb-1">{payer}</div>
                <div className="text-xs text-muted-foreground mb-1">{name}</div>
                <div className="text-sm font-mono text-primary font-medium">{fax}</div>
                <div className="text-xs text-muted-foreground mt-1">Medical Director Appeals</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SEND PANEL (slide-in) ───────────────────────────────────────── */}
      {selectedAppeal && (
        <div className="w-[520px] flex-shrink-0 border-l border-border bg-card overflow-y-auto flex flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 sticky top-0 z-10">
            <div>
              <div className="text-sm font-bold text-foreground">Send Appeal Packet</div>
              <div className="text-xs text-muted-foreground">{selectedAppeal.appealId}</div>
            </div>
            <button onClick={() => setSelectedAppeal(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 p-6 space-y-6">
            {/* Appeal Summary */}
            <div className="bg-muted/40 rounded-xl p-4 space-y-1">
              <div className="text-xs font-semibold text-foreground">Appeal: {selectedAppeal.appealId}</div>
              <div className="text-xs text-muted-foreground">Drug: {selectedAppeal.drugName}</div>
              <div className="text-xs text-muted-foreground">Payer: {selectedAppeal.payerId} · Patient: {selectedAppeal.patientId}</div>
              <div className="text-xs text-muted-foreground">Denial: {selectedAppeal.denialRecordId}</div>
            </div>

            {/* ── SECTION 1: Fax Destination */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Fax Destination
              </h3>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payer Fax Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={faxOverride}
                  onChange={e => setFaxOverride(e.target.value)}
                  placeholder="+1-866-252-0566"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-xs text-muted-foreground mt-1">You can override the auto-filled payer fax number.</p>
              </div>
            </div>

            {/* ── SECTION 2: Submitting Physician */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Submitting Physician
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "name", label: "Full Name *", placeholder: "Dr. Jane Smith" },
                  { key: "title", label: "Title", placeholder: "Medical Oncologist" },
                  { key: "npi", label: "NPI Number", placeholder: "1234567890" },
                  { key: "phone", label: "Phone", placeholder: "+1-212-555-0100" },
                  { key: "email", label: "Email", placeholder: "drsmith@clinic.org" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className={key === "name" || key === "email" ? "col-span-2" : ""}>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                    <input
                      type="text"
                      value={(doctorForm as any)[key]}
                      onChange={e => setDoctorForm(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Clinic / Institution</label>
                  <input
                    type="text"
                    value={doctorForm.clinic}
                    onChange={e => setDoctorForm(prev => ({ ...prev, clinic: e.target.value }))}
                    placeholder="Memorial Sloan Kettering Cancer Center"
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 3: Appeal Content Review */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Appeal Content
                </h3>
                <div className="flex gap-2">
                  {isEditingContent ? (
                    <>
                      <button
                        onClick={() => { setIsEditingContent(false); setEditingSections(parseSections(selectedAppeal)); }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
                      >Cancel</button>
                      <button
                        disabled={saveAppeal.isPending}
                        onClick={() => saveAppeal.mutate({ appealId: selectedAppeal.appealId, content: editingSections })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 transition-colors disabled:opacity-60"
                      >
                        <Save className="w-3 h-3" />
                        {saveAppeal.isPending ? "Saving…" : "Save"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingContent(true)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 flex items-center gap-1 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {Object.entries(SECTION_LABELS).map(([key, label]) => {
                  const content = editingSections[key] || "";
                  if (!content && !isEditingContent) return null;
                  return (
                    <div key={key} className="bg-background border border-border rounded-lg p-3">
                      <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">{label}</div>
                      {isEditingContent ? (
                        <textarea
                          value={editingSections[key] || ""}
                          onChange={e => setEditingSections(prev => ({ ...prev, [key]: e.target.value }))}
                          rows={4}
                          className="w-full text-xs text-foreground bg-muted/30 border border-border rounded-lg p-2 resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-3">{content}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── SEND FOOTER */}
          <div className="border-t border-border p-6 bg-muted/20 sticky bottom-0">
            <div className="mb-3 text-xs text-muted-foreground">
              Sending to: <span className="font-mono font-semibold text-foreground">{faxOverride || "(enter fax number above)"}</span>
            </div>
            <button
              onClick={handleSend}
              disabled={sendFax.isPending || !faxOverride || !doctorForm.name}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-4 px-6 rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none disabled:shadow-none text-sm"
            >
              {sendFax.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending via RingCentral…</>
              ) : (
                <><Send className="w-4 h-4" />Send Fax to {selectedAppeal.payerId} Medical Director<ArrowRight className="w-4 h-4 ml-auto" /></>
              )}
            </button>
            <p className="text-xs text-center text-muted-foreground mt-2">This will transmit the PDF via RingCentral to the payer.</p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/features/pae-onc/lib/queryClient";
import { useToast } from "@/features/pae-onc/hooks/use-toast";
import { Download, Send, FileText, Zap, ChevronDown, ChevronUp, Pencil, Save } from "lucide-react";
import { useState } from "react";

const SECTION_LABELS: Record<string, string> = {
  executiveSummary: "Executive Summary",
  clinicalBackground: "Clinical Background",
  nccnFdaSection: "NCCN & FDA Evidence",
  payerContradictionSection: "Payer Contradiction Analysis",
  legalFrameworkSection: "Legal Framework",
  requestedResolution: "Requested Resolution",
};

export default function AppealsPage() {
  const { toast } = useToast();
  const { data: appeals = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/appeals"] });
  const [expandedAppeal, setExpandedAppeal] = useState<string | null>(null);
  const [editingSections, setEditingSections] = useState<Record<string, Record<string, string>>>({});

  const saveAppeal = useMutation({
    mutationFn: ({ appealId, content }: { appealId: string; content: Record<string, string> }) =>
      apiRequest("PATCH", `/api/appeals/${appealId}`, { generatedContent: JSON.stringify(content) }),
    onSuccess: (_, { appealId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appeals"] });
      toast({ title: "Appeal Updated", description: "Your edits have been saved." });
      setEditingSections((prev) => { const n = { ...prev }; delete n[appealId]; return n; });
    },
    onError: (e: any) => toast({ title: "Save Error", description: e.message, variant: "destructive" }),
  });

  const batchFax = useMutation({
    mutationFn: () => apiRequest("POST", "/api/appeals/batch-fax", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appeals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fax-log"] });
      toast({ title: "Batch Fax Complete", description: `${data.queued} appeals queued for delivery.` });
    },
  });

  const downloadPdf = (appealId: string) => {
    window.open(`/api/appeals/${appealId}/pdf`, "_blank");
  };

  const parseSections = (a: any): Record<string, string> => {
    try {
      const content = typeof a.generatedContent === "string" ? JSON.parse(a.generatedContent) : a.generatedContent;
      return content || {};
    } catch { return {}; }
  };

  const startEditing = (appealId: string, sections: Record<string, string>) => {
    setEditingSections((prev) => ({ ...prev, [appealId]: { ...sections } }));
  };

  const updateSection = (appealId: string, key: string, value: string) => {
    setEditingSections((prev) => ({
      ...prev,
      [appealId]: { ...prev[appealId], [key]: value },
    }));
  };

  const generatedCount = appeals.filter((a: any) => a.status === "generated").length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Appeal Packets</h1>
          <p className="text-sm text-muted-foreground mt-1">Review, edit, and send appeal packets</p>
        </div>
        {generatedCount > 0 && (
          <button
            data-testid="button-batch-fax"
            onClick={() => batchFax.mutate()}
            disabled={batchFax.isPending}
            className="flex items-center gap-2 bg-accent text-accent-foreground text-sm font-medium py-2 px-4 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            <Zap className="w-4 h-4" />
            Batch Fax All ({generatedCount})
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted/60 animate-pulse rounded-xl" />)}
        </div>
      ) : appeals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No appeals yet. Run the pipeline on a denial to generate one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appeals.map((a: any) => {
            const isExpanded = expandedAppeal === a.appealId;
            const sections = parseSections(a);
            const isEditing = !!editingSections[a.appealId];
            const editData = editingSections[a.appealId] || sections;

            return (
              <div key={a.appealId} className="bg-card border border-border rounded-xl overflow-hidden" data-testid={`card-appeal-${a.appealId}`}>
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-foreground">{a.appealId}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          a.status === "generated" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : a.status === "faxed" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                        }`}>
                          {a.status === "generated" ? "📝 Ready to Review" : a.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{a.appealType?.replace(/_/g, " ")}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Denial: {a.denialRecordId} · Payer: {a.payerId} · Patient: {a.patientId}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedAppeal(isExpanded ? null : a.appealId)}
                        className="flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/70 text-foreground px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? "Collapse" : "Review & Edit"}
                      </button>
                      {a.pdfPath && (
                        <button
                          data-testid={`button-download-${a.appealId}`}
                          onClick={() => downloadPdf(a.appealId)}
                          className="flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/70 text-foreground px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                      )}
                      {a.status === "generated" && (
                        <Link href="/fax-log">
                          <button
                            data-testid={`button-fax-${a.appealId}`}
                            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            Send Fax to {a.payerId}
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Citations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="text-xs font-semibold text-green-800 dark:text-green-400 mb-1">NCCN Citation</div>
                      <p className="text-xs text-green-700 dark:text-green-300">{a.nccnCitation}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-1">FDA Citation</div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">{a.fdaCitation}</p>
                    </div>
                  </div>

                  {/* Conflict */}
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="text-xs font-semibold text-red-800 dark:text-red-400 mb-1">Conflict Summary</div>
                    <p className="text-xs text-red-700 dark:text-red-300">{a.conflictSummary}</p>
                  </div>

                  {/* Fax status */}
                  {a.faxJobId && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 mt-4 border-t border-border">
                      <span><span className="font-medium">Fax Job:</span> {a.faxJobId}</span>
                      <span><span className="font-medium">Status:</span> {a.faxStatus}</span>
                      {a.payerFaxNumber && <span><span className="font-medium">To:</span> {a.payerFaxNumber}</span>}
                      {a.faxSentAt && <span><span className="font-medium">Sent:</span> {new Date(a.faxSentAt).toLocaleString()}</span>}
                    </div>
                  )}
                </div>

                {/* Expandable Appeal Content Editor */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-foreground">Appeal Content — 6 Sections</h3>
                      <div className="flex gap-2">
                        {!isEditing ? (
                          <button
                            onClick={() => startEditing(a.appealId, sections)}
                            className="flex items-center gap-1.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit Sections
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingSections((prev) => { const n = { ...prev }; delete n[a.appealId]; return n; })}
                              className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground hover:bg-muted/70 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveAppeal.mutate({ appealId: a.appealId, content: editData })}
                              disabled={saveAppeal.isPending}
                              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                            >
                              <Save className="w-3 h-3" />
                              {saveAppeal.isPending ? "Saving..." : "Save Changes"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(SECTION_LABELS).map(([key, label]) => {
                        const content = editData[key] || "";
                        if (!content && !isEditing) return null;
                        return (
                          <div key={key} className="bg-card border border-border rounded-lg p-4">
                            <div className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">{label}</div>
                            {isEditing ? (
                              <textarea
                                value={editData[key] || ""}
                                onChange={(e) => updateSection(a.appealId, key, e.target.value)}
                                rows={6}
                                className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            ) : (
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

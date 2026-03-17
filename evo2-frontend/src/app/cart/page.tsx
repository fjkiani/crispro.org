"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useCart } from "~/context/cart-context";
import {
  cartItemToVariantInput,
  analyzePanelWithAPI,
  generateCopilotReport,
  chatWithCopilot,
  type PanelAnalysisResponse,
  type CopilotResponse,
} from "~/utils/panel-api";
import { PanelVariantsTable } from "~/components/panel-variants-table";
import { TumorBoardSummary } from "~/components/tumor-board-summary";
import { CopilotChat } from "~/components/copilot-chat";
import { Button } from "~/components/ui/button";

type TriageState = "idle" | "analyzing" | "results" | "error";

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [triageState, setTriageState] = useState<TriageState>("idle");
  const [panelResponse, setPanelResponse] = useState<PanelAnalysisResponse | null>(null);
  const [copilotReport, setCopilotReport] = useState<CopilotResponse | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  async function handleRunTriage() {
    if (cartItems.length === 0) return;
    setTriageState("analyzing");
    setTriageError(null);
    setPanelResponse(null);
    setCopilotReport(null);

    try {
      const response = await analyzePanelWithAPI({
        variants: cartItems.map(cartItemToVariantInput),
        panel_name: `Triage Cart — ${cartItems.length} variant${cartItems.length !== 1 ? "s" : ""}`,
      });
      setPanelResponse(response);
      if (response.copilot_report) {
        setCopilotReport(response.copilot_report);
      }
      setTriageState("results");
    } catch (e) {
      setTriageError(e instanceof Error ? e.message : "Analysis failed");
      setTriageState("error");
    }
  }

  async function handleGenerateReport(mode: "triage_report" | "tumor_board") {
    if (!panelResponse) return;
    setIsGeneratingReport(true);
    try {
      const report = await generateCopilotReport({
        annotated_variants: panelResponse.annotated_variants,
        panel_name: panelResponse.panel_name,
        mode,
      });
      setCopilotReport(report);
    } catch (e) {
      console.error("Failed to generate report:", e);
    } finally {
      setIsGeneratingReport(false);
    }
  }

  async function handleChat(
    question: string,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<CopilotResponse> {
    if (!panelResponse) throw new Error("No panel loaded");
    return chatWithCopilot({
      annotated_variants: panelResponse.annotated_variants,
      panel_name: panelResponse.panel_name,
      mode: "followup_qa",
      followup_question: question,
      conversation_history: history,
    });
  }

  return (
    <main className="min-h-screen bg-[#e9eeea]/40 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <header className="flex items-center gap-3">
          <Link href="/" className="text-[#3c4f3d]/50 hover:text-[#3c4f3d] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#3c4f3d]">Triage Cart</h1>
            <p className="text-sm text-[#3c4f3d]/60 mt-0.5">
              {cartItems.length} variant{cartItems.length !== 1 ? "s" : ""} selected ·
              Multi-signal Evo2 + splice annotation
            </p>
          </div>
        </header>

        {/* Disclaimer */}
        <div className="rounded-md border border-[#de8246]/30 bg-[#de8246]/5 px-4 py-2">
          <p className="text-xs text-[#de8246] font-medium">
            FOR RESEARCH USE ONLY — results do not constitute clinical advice. All
            interpretations must be reviewed by a qualified clinical geneticist.
          </p>
        </div>

        {/* Cart table */}
        <section className="overflow-hidden rounded-md border border-[#3c4f3d]/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#3c4f3d]/10 px-4 py-3">
            <h2 className="text-sm font-medium text-[#3c4f3d]">Selected Variants</h2>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Clear All
              </Button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-[#3c4f3d]/50">Your triage cart is empty.</p>
              <Link href="/" className="mt-3 text-xs text-[#de8246] underline">
                Browse genes to add variants
              </Link>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-[#e9eeea]/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-[#3c4f3d]/70">Gene</th>
                  <th className="px-4 py-2 text-left font-medium text-[#3c4f3d]/70">Variant</th>
                  <th className="px-4 py-2 text-left font-medium text-[#3c4f3d]/70">ClinVar Classification</th>
                  <th className="px-4 py-2 text-left font-medium text-[#3c4f3d]/70">ClinVar ID</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr
                    key={item.clinvar_id}
                    className="border-t border-[#3c4f3d]/5 hover:bg-[#e9eeea]/20"
                  >
                    <td className="px-4 py-2.5 font-medium text-[#3c4f3d]">{item.gene_symbol}</td>
                    <td className="px-4 py-2.5 font-mono text-[#3c4f3d]/80">
                      {item.chromosome}:{item.pos.toLocaleString()} {item.ref}&gt;{item.alt}
                    </td>
                    <td className="px-4 py-2.5 text-[#3c4f3d]/70">{item.classification || "—"}</td>
                    <td className="px-4 py-2.5">
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${item.clinvar_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#de8246] hover:underline"
                      >
                        {item.clinvar_id}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => removeFromCart(item.clinvar_id)}
                        aria-label="Remove variant"
                        className="text-[#3c4f3d]/30 transition-colors hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {cartItems.length > 0 && (
            <div className="flex justify-end border-t border-[#3c4f3d]/10 px-4 py-3">
              <Button
                onClick={() => void handleRunTriage()}
                disabled={triageState === "analyzing"}
                className="bg-[#3c4f3d] text-white hover:bg-[#3c4f3d]/90"
              >
                {triageState === "analyzing" ? "Running Analysis…" : "Run Triage Analysis"}
              </Button>
            </div>
          )}
        </section>

        {/* Spinner while analyzing */}
        {triageState === "analyzing" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3c4f3d]/30 border-t-[#3c4f3d]" />
            <p className="text-sm text-[#3c4f3d]/70">
              Running Evo2 scoring and splice annotation for {cartItems.length} variant
              {cartItems.length !== 1 ? "s" : ""}…
            </p>
            <p className="text-xs text-[#3c4f3d]/40">
              This may take 30–90 seconds per variant on first load.
            </p>
          </div>
        )}

        {/* Error state */}
        {triageState === "error" && triageError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-4">
            <p className="text-sm font-medium text-red-700">Analysis failed</p>
            <p className="mt-1 text-xs text-red-600">{triageError}</p>
            <button
              onClick={() => setTriageState("idle")}
              className="mt-3 text-xs text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {triageState === "results" && panelResponse && (
          <>
            <PanelVariantsTable
              response={panelResponse}
              onGenerateReport={(mode) => void handleGenerateReport(mode)}
              isGeneratingReport={isGeneratingReport}
            />

            {copilotReport && (
              <TumorBoardSummary
                report={copilotReport}
                panelName={panelResponse.panel_name}
              />
            )}

            {!copilotReport && isGeneratingReport && (
              <div className="flex items-center gap-3 py-4 text-sm text-[#3c4f3d]/60">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3c4f3d]/30 border-t-[#3c4f3d]" />
                Generating report with Claude…
              </div>
            )}

            <CopilotChat
              annotatedVariants={panelResponse.annotated_variants}
              panelName={panelResponse.panel_name}
              onAsk={handleChat}
            />
          </>
        )}
      </div>
    </main>
  );
}

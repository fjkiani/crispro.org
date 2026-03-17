"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { CopilotResponse } from "~/utils/panel-api";

interface TumorBoardSummaryProps {
  report: CopilotResponse;
  panelName?: string | null;
}

/** Simple markdown-to-HTML renderer for the subset used in Co-Pilot reports */
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic *text*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // H3 ### heading
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-[#3c4f3d] mt-4 mb-1">$1</h3>')
    // H2 ## heading
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-[#3c4f3d] mt-5 mb-2 border-b border-[#3c4f3d]/20 pb-1">$1</h2>')
    // H1 # heading
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-[#3c4f3d] mt-4 mb-2">$1</h1>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm text-[#3c4f3d]/80">$1</li>')
    // Horizontal rule ---
    .replace(/^---+$/gm, '<hr class="border-[#3c4f3d]/10 my-3"/>')
    // Paragraph breaks (double newline)
    .replace(/\n\n/g, '</p><p class="text-sm text-[#3c4f3d]/80 mb-2">')
    // Single newline → br
    .replace(/\n/g, "<br/>");
}

function handlePrint() {
  window.print();
}

function handleCopy(text: string) {
  void navigator.clipboard.writeText(text);
}

export function TumorBoardSummary({ report, panelName }: TumorBoardSummaryProps) {
  const content = report.report_markdown ?? report.answer ?? "";
  const modeLabel =
    report.mode === "tumor_board"
      ? "Tumor Board Note"
      : report.mode === "triage_report"
      ? "Triage Report"
      : "Co-Pilot Response";

  return (
    <Card className="w-full border border-[#3c4f3d]/20 print:shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap print:pb-0">
        <div>
          <CardTitle className="text-[#3c4f3d] text-lg font-semibold">
            {modeLabel}
          </CardTitle>
          {panelName && (
            <p className="text-sm text-[#3c4f3d]/60 mt-0.5">{panelName}</p>
          )}
          <div className="flex gap-3 mt-1 text-xs text-[#3c4f3d]/40">
            <span>Model: {report.model_used}</span>
            <span>Tokens in: {report.input_tokens.toLocaleString()}</span>
            <span>Tokens out: {report.output_tokens.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(content)}
            className="border-[#3c4f3d]/30 text-[#3c4f3d] hover:bg-[#3c4f3d]/10 text-xs"
          >
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-[#3c4f3d]/30 text-[#3c4f3d] hover:bg-[#3c4f3d]/10 text-xs"
          >
            Print / Export PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Disclaimer banner */}
        <div className="mb-4 rounded-md border border-[#de8246]/40 bg-[#de8246]/5 px-4 py-2">
          <p className="text-xs text-[#de8246] font-medium">{report.disclaimer}</p>
        </div>

        {/* Rendered report */}
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{
            __html: `<p class="text-sm text-[#3c4f3d]/80 mb-2">${renderMarkdown(content)}</p>`,
          }}
        />
      </CardContent>
    </Card>
  );
}

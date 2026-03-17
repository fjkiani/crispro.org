"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { getClassificationColorClasses, getRiskColorClasses } from "~/utils/coloring-utils";
import { getPriorityColorClasses } from "~/utils/coloring-utils";
import type { AnnotatedVariant, PanelAnalysisResponse } from "~/utils/panel-api";

interface PanelVariantsTableProps {
  response: PanelAnalysisResponse;
  onGenerateReport: (mode: "triage_report" | "tumor_board") => void;
  isGeneratingReport: boolean;
}

type SortKey = "priority" | "gene" | "splice" | "delta";

function priorityOrder(p: string): number {
  if (p === "High") return 0;
  if (p === "Medium") return 1;
  if (p === "Low") return 2;
  return 3;
}

export function PanelVariantsTable({
  response,
  onGenerateReport,
  isGeneratingReport,
}: PanelVariantsTableProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...response.annotated_variants].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "priority") {
      cmp =
        priorityOrder(a.composite?.priority ?? "") -
        priorityOrder(b.composite?.priority ?? "");
    } else if (sortKey === "gene") {
      cmp = a.input.gene_symbol.localeCompare(b.input.gene_symbol);
    } else if (sortKey === "splice") {
      const sMap: Record<string, number> = { "High Risk": 0, "Moderate Risk": 1, "Low/Unknown Risk": 2 };
      cmp = (sMap[a.evo2?.splice_risk ?? ""] ?? 3) - (sMap[b.evo2?.splice_risk ?? ""] ?? 3);
    } else if (sortKey === "delta") {
      cmp = (a.evo2?.delta_score ?? 0) - (b.evo2?.delta_score ?? 0);
    }
    return sortAsc ? cmp : -cmp;
  });

  const SortButton = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[#3c4f3d]/70 hover:text-[#3c4f3d]"
    >
      {label}
      <span className="text-[10px]">
        {sortKey === field ? (sortAsc ? "▲" : "▼") : "⇅"}
      </span>
    </button>
  );

  return (
    <Card className="w-full border border-[#3c4f3d]/20">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-[#3c4f3d] text-lg font-semibold">
            {response.panel_name ?? "Panel Results"}
          </CardTitle>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[#3c4f3d]/70">High: {response.high_priority_count}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[#3c4f3d]/70">Medium: {response.medium_priority_count}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-[#3c4f3d]/70">Low: {response.low_priority_count}</span>
            </span>
            <span className="text-[#3c4f3d]/40">
              {response.processing_time_seconds.toFixed(1)}s
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            disabled={isGeneratingReport}
            onClick={() => onGenerateReport("triage_report")}
            className="border-[#3c4f3d]/30 text-[#3c4f3d] hover:bg-[#3c4f3d]/10 text-xs"
          >
            {isGeneratingReport ? "Generating…" : "Triage Report"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isGeneratingReport}
            onClick={() => onGenerateReport("tumor_board")}
            className="border-[#de8246]/40 text-[#de8246] hover:bg-[#de8246]/10 text-xs"
          >
            {isGeneratingReport ? "Generating…" : "Tumor Board Note"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#3c4f3d]/10 bg-[#e9eeea]/60">
              <TableHead className="w-[90px]">
                <SortButton label="Priority" field="priority" />
              </TableHead>
              <TableHead>
                <SortButton label="Gene / Locus" field="gene" />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortButton label="Evo2 Δ" field="delta" />
              </TableHead>
              <TableHead className="hidden md:table-cell">Prediction</TableHead>
              <TableHead>
                <SortButton label="Splice Risk" field="splice" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">Cancer Tier</TableHead>
              <TableHead className="hidden lg:table-cell">Pathways</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {sorted.map((av, idx) => (
              <>
                <TableRow
                  key={idx}
                  className="cursor-pointer hover:bg-[#e9eeea]/40 border-b border-[#3c4f3d]/5"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                >
                  {/* Priority */}
                  <TableCell>
                    {av.composite ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${getPriorityColorClasses(av.composite.priority)}`}
                      >
                        {av.composite.priority}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Error</span>
                    )}
                  </TableCell>

                  {/* Gene / Locus */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#3c4f3d] text-sm">
                        {av.input.gene_symbol}
                      </span>
                      <span className="text-xs text-[#3c4f3d]/50 font-mono">
                        {av.input.chr}:{av.input.pos} {av.input.ref}&gt;{av.input.alt}
                      </span>
                    </div>
                  </TableCell>

                  {/* Delta score */}
                  <TableCell className="hidden md:table-cell">
                    {av.evo2 ? (
                      <span
                        className={`text-sm font-mono ${
                          av.evo2.delta_score < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {av.evo2.delta_score >= 0 ? "+" : ""}
                        {av.evo2.delta_score.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Prediction */}
                  <TableCell className="hidden md:table-cell">
                    {av.evo2 ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                          ${getClassificationColorClasses(av.evo2.prediction)}`}
                      >
                        {av.evo2.prediction === "Likely pathogenic" ? "Pathogenic" : "Benign"}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Splice risk */}
                  <TableCell>
                    {av.evo2 ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                          ${getRiskColorClasses(av.evo2.splice_risk)}`}
                      >
                        {av.evo2.splice_risk.replace(" Risk", "").replace("No exon boundaries found in this region", "No data")}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Cancer tier */}
                  <TableCell className="hidden lg:table-cell">
                    {av.cancer_annotation?.is_cancer_gene ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                          ${av.cancer_annotation.cancer_gene_tier === "Tier1"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"}`}
                      >
                        {av.cancer_annotation.cancer_gene_tier}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Pathways */}
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {av.cancer_annotation?.pathways.slice(0, 2).map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px]
                                     bg-[#3c4f3d]/10 text-[#3c4f3d]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  {/* Expand arrow */}
                  <TableCell>
                    <span className="text-[#3c4f3d]/40 text-xs select-none">
                      {expandedIdx === idx ? "▲" : "▼"}
                    </span>
                  </TableCell>
                </TableRow>

                {/* Expanded detail row */}
                {expandedIdx === idx && (
                  <TableRow key={`${idx}-detail`} className="bg-[#e9eeea]/30">
                    <TableCell colSpan={8} className="py-3 px-4">
                      {av.error ? (
                        <p className="text-sm text-red-600">Error: {av.error}</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Score breakdown */}
                          {av.composite && (
                            <div>
                              <p className="text-xs font-semibold text-[#3c4f3d] uppercase tracking-wide mb-2">
                                Score Breakdown (composite: {av.composite.raw_score.toFixed(3)})
                              </p>
                              <div className="space-y-1.5">
                                {Object.entries(av.composite.score_components).map(([key, val]) => {
                                  const labels: Record<string, string> = {
                                    evo2_pathogenicity: "Evo2 Pathogenicity (×0.35)",
                                    splice_severity: "Splice Severity (×0.30)",
                                    cancer_gene_tier: "Cancer Gene Tier (×0.20)",
                                    evo2_confidence: "Evo2 Confidence (×0.15)",
                                  };
                                  return (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="text-xs text-[#3c4f3d]/60 w-48 shrink-0">
                                        {labels[key] ?? key}
                                      </span>
                                      <div className="flex-1 h-2 bg-[#3c4f3d]/10 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-[#3c4f3d] rounded-full"
                                          style={{ width: `${val * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-mono text-[#3c4f3d]/70 w-8 text-right">
                                        {val.toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Evo2 + splice details */}
                          {av.evo2 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-[#3c4f3d] uppercase tracking-wide">
                                Model Details
                              </p>
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <dt className="text-[#3c4f3d]/60">Delta score</dt>
                                <dd className="font-mono">{av.evo2.delta_score.toFixed(6)}</dd>
                                <dt className="text-[#3c4f3d]/60">Confidence</dt>
                                <dd className="font-mono">{(av.evo2.classification_confidence * 100).toFixed(0)}%</dd>
                                <dt className="text-[#3c4f3d]/60">Splice boundary</dt>
                                <dd>{av.evo2.splice_position ?? "N/A"} ({av.evo2.splice_boundary ?? "—"})</dd>
                                <dt className="text-[#3c4f3d]/60">Cancer types</dt>
                                <dd>{av.cancer_annotation?.cancer_types.join(", ") ?? "—"}</dd>
                              </dl>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

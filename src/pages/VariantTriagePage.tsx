import { useState } from 'react';
import ChromosomeSelector from '../components/ChromosomeSelector';
import GeneSearch, { type SelectedGene } from '../components/GeneSearch';
import ClinVarTable from '../components/ClinVarTable';
import TriageCartPanel from '../components/TriageCartPanel';
import type { GeneBounds } from '../api/genomeApi';
import './VariantTriagePage.css';

type BrowseMode = 'chromosome' | 'gene';

interface ActiveTarget {
  chrom: string;
  bounds: GeneBounds;
  label: string; // e.g. "BRCA1" or "chr17"
}

// Default bounds for a full chromosome browse (~gene-region-sized window to avoid huge queries)
// We set a narrow default range so ClinVar doesn't time out; user can refine via gene search
const CHROM_DEFAULT_RANGE = 5_000_000; // 5 Mb window at chromosome start

const DEFAULT_GENOME = 'hg38';

export default function VariantTriagePage() {
  const [genome] = useState(DEFAULT_GENOME);
  const [browseMode, setBrowseMode] = useState<BrowseMode>('chromosome');
  const [activeTarget, setActiveTarget] = useState<ActiveTarget | null>(null);

  function handleChromSelect(chrom: string) {
    // Use a 5 Mb window at the start of the chromosome
    setActiveTarget({
      chrom,
      bounds: { min: 1, max: CHROM_DEFAULT_RANGE },
      label: chrom,
    });
  }

  function handleGeneSelect(info: SelectedGene) {
    setActiveTarget({
      chrom: info.chrom,
      bounds: info.bounds,
      label: info.gene.symbol,
    });
  }

  return (
    <div className="vt-page fade-in">
      {/* Header */}
      <section className="vt-hero">
        <div className="vt-hero-badge">RESEARCH USE ONLY</div>
        <h1 className="vt-title">Variant Triage</h1>
        <p className="vt-subtitle">
          Browse genes or chromosomes, discover ClinVar variants, and build a panel for Evo2-powered
          pathogenicity triage with AI-assisted clinical interpretation.
        </p>
      </section>

      {/* Browse mode tabs */}
      <section className="vt-section glass">
        <div className="vt-section-header">
          <h2 className="vt-section-title">Build Your Triage Panel</h2>
          <p className="vt-section-desc">
            Select a gene or chromosome to see known ClinVar variants, then add them to your panel.
          </p>
        </div>

        <div className="vt-tabs">
          <button
            className={`vt-tab${browseMode === 'chromosome' ? ' vt-tab--active' : ''}`}
            onClick={() => setBrowseMode('chromosome')}
          >
            Browse by Chromosome
          </button>
          <button
            className={`vt-tab${browseMode === 'gene' ? ' vt-tab--active' : ''}`}
            onClick={() => setBrowseMode('gene')}
          >
            Search by Gene
          </button>
        </div>

        <div className="vt-browse-body">
          {browseMode === 'chromosome' ? (
            <div className="vt-chrom-browse">
              <p className="vt-browse-hint">
                Select a chromosome to view ClinVar variants in its first 5 Mb region. For a specific
                gene, use the <strong>Search by Gene</strong> tab.
              </p>
              <ChromosomeSelector
                genomeId={genome}
                selectedChrom={activeTarget?.label === activeTarget?.chrom ? (activeTarget?.chrom ?? null) : null}
                onSelect={handleChromSelect}
              />
            </div>
          ) : (
            <div className="vt-gene-browse">
              <GeneSearch genomeId={genome} onGeneSelected={handleGeneSelect} />
            </div>
          )}
        </div>
      </section>

      {/* ClinVar variants for selected target */}
      {activeTarget && (
        <section className="vt-section glass vt-clinvar-section fade-up">
          <ClinVarTable
            chrom={activeTarget.chrom}
            bounds={activeTarget.bounds}
            genomeId={genome}
            geneSymbol={activeTarget.label}
          />
        </section>
      )}

      {!activeTarget && (
        <div className="vt-no-selection">
          <div className="vt-no-selection-icon">🔬</div>
          <p>Select a chromosome or search for a gene above to see ClinVar variants.</p>
        </div>
      )}

      {/* Floating cart panel */}
      <TriageCartPanel />
    </div>
  );
}

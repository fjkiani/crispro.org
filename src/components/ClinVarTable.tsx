import { useEffect, useState } from 'react';
import { fetchClinVarVariants, type ClinVarVariant, type GeneBounds } from '../api/genomeApi';
import { useCart } from '../context/CartContext';
import type { CartItem } from '../types/triage';
import './ClinVarTable.css';

interface Props {
  chrom: string;
  bounds: GeneBounds;
  genomeId: string;
  geneSymbol: string;
}

const CLASSIFICATION_CLASS: Record<string, string> = {
  'Pathogenic': 'clinvar-badge--pathogenic',
  'Likely pathogenic': 'clinvar-badge--likely-pathogenic',
  'Benign': 'clinvar-badge--benign',
  'Likely benign': 'clinvar-badge--likely-benign',
  'Uncertain significance': 'clinvar-badge--vus',
  'Conflicting interpretations': 'clinvar-badge--conflicting',
};

function classificationClass(sig: string): string {
  for (const key of Object.keys(CLASSIFICATION_CLASS)) {
    if (sig.toLowerCase().includes(key.toLowerCase())) return CLASSIFICATION_CLASS[key];
  }
  return 'clinvar-badge--unknown';
}

/** Try to parse position from a ClinVar location string like "17:43,119,628" */
function parsePosition(location: string): number | null {
  // Remove commas, grab the number after colon if present
  const clean = location.replace(/,/g, '');
  const match = clean.match(/:(\d+)/) ?? clean.match(/^(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

export default function ClinVarTable({ chrom, bounds, genomeId, geneSymbol }: Props) {
  const [variants, setVariants] = useState<ClinVarVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, removeFromCart, isInCart } = useCart();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setVariants([]);
    fetchClinVarVariants(chrom, bounds, genomeId)
      .then(setVariants)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Failed to load ClinVar variants')
      )
      .finally(() => setLoading(false));
  }, [chrom, bounds, genomeId]);

  function handleToggle(v: ClinVarVariant) {
    if (isInCart(v.clinvar_id)) {
      removeFromCart(v.clinvar_id);
      return;
    }
    const pos = parsePosition(v.location);
    if (!pos) return; // can't add without a position

    const item: CartItem = {
      clinvar_id: v.clinvar_id,
      title: v.title,
      classification: v.classification,
      gene_symbol: v.gene_sort || geneSymbol,
      chromosome: `chr${v.chromosome}`,
      pos,
      ref: '', // ClinVar summary doesn't provide ref/alt directly; backend handles missing
      alt: '',
      genome: genomeId,
    };
    addToCart(item);
  }

  if (loading) {
    return (
      <div className="clinvar-loading">
        <span className="clinvar-spinner" />
        Loading ClinVar variants for {geneSymbol}…
      </div>
    );
  }

  if (error) {
    return (
      <div className="clinvar-error">
        <strong>Error loading variants:</strong> {error}
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="clinvar-empty">
        No ClinVar variants found for <strong>{geneSymbol}</strong> in the selected region.
      </div>
    );
  }

  return (
    <div className="clinvar-table-wrap">
      <div className="clinvar-table-header">
        <span className="clinvar-table-title">
          ClinVar Variants — <strong>{geneSymbol}</strong>
        </span>
        <span className="clinvar-count">{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="clinvar-scroll">
        <table className="clinvar-table">
          <thead>
            <tr>
              <th>Variant</th>
              <th>Type</th>
              <th>Clinical Significance</th>
              <th>Position</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const inCart = isInCart(v.clinvar_id);
              const pos = parsePosition(v.location);
              const canAdd = pos !== null;
              return (
                <tr key={v.clinvar_id} className={inCart ? 'clinvar-row--in-cart' : ''}>
                  <td className="clinvar-cell-title">{v.title}</td>
                  <td>
                    <span className="clinvar-type">{v.variation_type}</span>
                  </td>
                  <td>
                    <span className={`clinvar-badge ${classificationClass(v.classification)}`}>
                      {v.classification}
                    </span>
                  </td>
                  <td className="clinvar-cell-pos">
                    {v.location}
                  </td>
                  <td className="clinvar-cell-action">
                    <button
                      className={`clinvar-add-btn${inCart ? ' clinvar-add-btn--remove' : ''}`}
                      onClick={() => handleToggle(v)}
                      disabled={!canAdd && !inCart}
                      title={!canAdd ? 'Position could not be parsed from ClinVar data' : undefined}
                    >
                      {inCart ? '✓ Added' : '+ Triage'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

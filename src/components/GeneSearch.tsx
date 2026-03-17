import { useState, useRef } from 'react';
import { searchGenes, fetchGeneBounds, type GeneResult } from '../api/genomeApi';
import './GeneSearch.css';

interface SelectedGene {
  gene: GeneResult;
  chrom: string;
  bounds: { min: number; max: number };
}

interface Props {
  genomeId: string;
  onGeneSelected: (info: SelectedGene) => void;
}

export default function GeneSearch({ genomeId, onGeneSelected }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeneResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingGene, setLoadingGene] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(value: string) {
    setQuery(value);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchGenes(value.trim());
        setResults(found);
      } catch {
        setError('Gene search failed. Try again.');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  async function handleSelectGene(gene: GeneResult) {
    setResults([]);
    setQuery(gene.symbol);
    setLoadingGene(gene.gene_id);
    setError(null);
    try {
      const info = await fetchGeneBounds(gene.gene_id);
      if (!info) {
        setError(`Could not find genomic location for ${gene.symbol}.`);
        return;
      }
      // Determine chromosome from gene result or bounds response
      const chrom = gene.chrom || `chr${info.chrom}`;
      onGeneSelected({ gene, chrom, bounds: info.bounds });
    } catch {
      setError(`Failed to load ${gene.symbol} location.`);
    } finally {
      setLoadingGene(null);
    }
  }

  return (
    <div className="gene-search">
      <div className="gene-search-input-wrap">
        <input
          className="gene-search-input"
          type="text"
          placeholder="Search gene symbol (e.g. BRCA1, TP53)"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          spellCheck={false}
        />
        {searching && <span className="gene-search-spinner" />}
      </div>

      {error && <div className="gene-search-error">{error}</div>}

      {results.length > 0 && (
        <ul className="gene-search-results">
          {results.map((g) => (
            <li
              key={g.gene_id || g.symbol}
              className="gene-search-result"
              onClick={() => handleSelectGene(g)}
            >
              {loadingGene === g.gene_id ? (
                <span className="gene-search-spinner gene-search-spinner--inline" />
              ) : null}
              <span className="gene-result-symbol">{g.symbol}</span>
              <span className="gene-result-name">{g.name}</span>
              <span className="gene-result-chrom">{g.chrom}</span>
            </li>
          ))}
        </ul>
      )}

      {!searching && query.length >= 2 && results.length === 0 && !error && (
        <p className="gene-search-empty">No genes found for "{query}"</p>
      )}

      <p className="gene-search-hint">
        Try: <button className="gene-search-example" onClick={() => handleInput('BRCA1')}>BRCA1</button>
        {', '}
        <button className="gene-search-example" onClick={() => handleInput('TP53')}>TP53</button>
        {', '}
        <button className="gene-search-example" onClick={() => handleInput('KRAS')}>KRAS</button>
      </p>

      {/* suppress unused warning for genomeId - it's passed for future use */}
      <span data-genome={genomeId} style={{ display: 'none' }} />
    </div>
  );
}

export type { SelectedGene };

import { useEffect, useState } from 'react';
import { fetchChromosomes, type Chromosome } from '../api/genomeApi';
import './ChromosomeSelector.css';

interface Props {
  genomeId: string;
  selectedChrom: string | null;
  onSelect: (chrom: string) => void;
}

export default function ChromosomeSelector({ genomeId, selectedChrom, onSelect }: Props) {
  const [chromosomes, setChromosomes] = useState<Chromosome[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!genomeId) return;
    setLoading(true);
    setError(null);
    fetchChromosomes(genomeId)
      .then(setChromosomes)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load chromosomes'))
      .finally(() => setLoading(false));
  }, [genomeId]);

  if (loading) {
    return (
      <div className="chrom-loading">
        <span className="chrom-spinner" />
        Loading chromosomes…
      </div>
    );
  }

  if (error) {
    return <div className="chrom-error">{error}</div>;
  }

  return (
    <div className="chrom-grid">
      {chromosomes.map((c) => (
        <button
          key={c.name}
          className={`chrom-btn${selectedChrom === c.name ? ' chrom-btn--active' : ''}`}
          onClick={() => onSelect(c.name)}
          title={`${c.name} (${(c.size / 1e6).toFixed(0)} Mb)`}
        >
          {c.name.replace('chr', '')}
        </button>
      ))}
    </div>
  );
}

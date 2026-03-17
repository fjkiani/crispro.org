// Genome & ClinVar API wrappers — adapted from evo2-frontend/src/utils/genome-api.ts

export interface GenomeAssembly {
  id: string;
  name: string;
  active: boolean;
}

export interface Chromosome {
  name: string;
  size: number;
}

export interface GeneResult {
  symbol: string;
  name: string;
  chrom: string;
  gene_id: string;
}

export interface GeneBounds {
  min: number;
  max: number;
}

export interface ClinVarVariant {
  clinvar_id: string;
  title: string;
  variation_type: string;
  classification: string;
  gene_sort: string;
  chromosome: string;
  location: string;
}

export async function fetchGenomes(): Promise<GenomeAssembly[]> {
  const res = await fetch('https://api.genome.ucsc.edu/list/ucscGenomes');
  if (!res.ok) throw new Error('Failed to fetch genome list from UCSC');

  const data = await res.json();
  if (!data.ucscGenomes) throw new Error('Unexpected UCSC response');

  // Return only human genomes (hg*)
  return Object.entries(data.ucscGenomes)
    .filter(([id]) => id.startsWith('hg'))
    .map(([id, info]: [string, unknown]) => {
      const g = info as { description?: string; active?: boolean };
      return { id, name: g.description || id, active: !!g.active };
    })
    .sort((a, b) => b.id.localeCompare(a.id)); // newest first
}

export async function fetchChromosomes(genomeId: string): Promise<Chromosome[]> {
  const res = await fetch(`https://api.genome.ucsc.edu/list/chromosomes?genome=${genomeId}`);
  if (!res.ok) throw new Error('Failed to fetch chromosomes from UCSC');

  const data = await res.json();
  if (!data.chromosomes) throw new Error('Unexpected UCSC chromosomes response');

  const list: Chromosome[] = [];
  for (const [name, size] of Object.entries(data.chromosomes)) {
    // Filter out scaffolds
    if (name.includes('_') || name.includes('Un') || name.includes('random')) continue;
    list.push({ name, size: size as number });
  }

  list.sort((a, b) => {
    const an = a.name.replace('chr', '');
    const bn = b.name.replace('chr', '');
    const isNumA = /^\d+$/.test(an);
    const isNumB = /^\d+$/.test(bn);
    if (isNumA && isNumB) return Number(an) - Number(bn);
    if (isNumA) return -1;
    if (isNumB) return 1;
    return an.localeCompare(bn);
  });

  return list;
}

export async function searchGenes(query: string): Promise<GeneResult[]> {
  const params = new URLSearchParams({
    terms: query,
    df: 'chromosome,Symbol,description,map_location,type_of_gene',
    ef: 'chromosome,Symbol,description,map_location,type_of_gene,GenomicInfo,GeneID',
  });

  const res = await fetch(
    `https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?${params}`
  );
  if (!res.ok) throw new Error('NCBI gene search failed');

  const data = await res.json();
  const results: GeneResult[] = [];

  if (data[0] > 0) {
    const fieldMap = data[2];
    const geneIds: string[] = fieldMap.GeneID || [];
    for (let i = 0; i < Math.min(10, data[0]); i++) {
      if (i >= data[3].length) continue;
      try {
        const display = data[3][i];
        let chrom: string = display[0] || '';
        if (chrom && !chrom.startsWith('chr')) chrom = `chr${chrom}`;
        results.push({
          symbol: display[2] || '',
          name: display[3] || '',
          chrom,
          gene_id: geneIds[i] || '',
        });
      } catch {
        continue;
      }
    }
  }
  return results;
}

export async function fetchGeneBounds(
  geneId: string
): Promise<{ bounds: GeneBounds; chrom: string } | null> {
  try {
    const res = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.result?.[geneId]) return null;

    const detail = data.result[geneId];
    if (!detail.genomicinfo?.[0]) return null;

    const info = detail.genomicinfo[0];
    const min = Math.min(info.chrstart, info.chrstop);
    const max = Math.max(info.chrstart, info.chrstop);
    const chrom = info.chraccver
      ? info.chraccver
      : detail.chromosome
        ? `chr${detail.chromosome}`
        : '';

    return { bounds: { min, max }, chrom: chrom || `chr${detail.chromosome || ''}` };
  } catch {
    return null;
  }
}

export async function fetchClinVarVariants(
  chrom: string,
  bounds: GeneBounds,
  genomeId: string
): Promise<ClinVarVariant[]> {
  const chromNum = chrom.replace(/^chr/i, '');
  const min = Math.min(bounds.min, bounds.max);
  const max = Math.max(bounds.min, bounds.max);
  const posField = genomeId === 'hg19' ? 'chrpos37' : 'chrpos38';
  const term = `${chromNum}[chromosome] AND ${min}:${max}[${posField}]`;

  const searchRes = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?` +
      new URLSearchParams({ db: 'clinvar', term, retmode: 'json', retmax: '50' })
  );
  if (!searchRes.ok) throw new Error('ClinVar search failed');

  const searchData = await searchRes.json();
  const ids: string[] = searchData.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryRes = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?` +
      new URLSearchParams({ db: 'clinvar', id: ids.join(','), retmode: 'json' })
  );
  if (!summaryRes.ok) throw new Error('ClinVar summary fetch failed');

  const summaryData = await summaryRes.json();
  const variants: ClinVarVariant[] = [];

  if (summaryData.result?.uids) {
    for (const id of summaryData.result.uids) {
      const v = summaryData.result[id];
      variants.push({
        clinvar_id: id,
        title: v.title || '',
        variation_type: (v.obj_type || 'Unknown')
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' '),
        classification: v.germline_classification?.description || 'Unknown',
        gene_sort: v.gene_sort || '',
        chromosome: chromNum,
        location: v.location_sort ? parseInt(v.location_sort).toLocaleString() : 'Unknown',
      });
    }
  }

  return variants;
}

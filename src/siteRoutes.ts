/**
 * Indexable paths for SEO / sitemap.xml.
 * Add new top-level app routes here so `npm run build` regenerates the sitemap.
 */
export type SitemapEntry = {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** 0.0–1.0 */
  priority: number;
};

export const INDEXABLE_ROUTES: readonly SitemapEntry[] = [
  { path: '/', changefreq: 'weekly', priority: 1 },
  { path: '/platinum-window', changefreq: 'weekly', priority: 0.9 },
  { path: '/progression-arbiter', changefreq: 'weekly', priority: 0.9 },
  { path: '/zeta-core', changefreq: 'weekly', priority: 0.9 },
  { path: '/about', changefreq: 'monthly', priority: 0.85 },
  { path: '/pae-onc', changefreq: 'monthly', priority: 0.75 },
] as const;

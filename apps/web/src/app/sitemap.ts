import { MetadataRoute } from 'next';
import { apiGet } from '@/lib/api';
import type { BookSummary } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
  const base: MetadataRoute.Sitemap = [
    { url: `${site}/`, changeFrequency: 'daily' },
    { url: `${site}/catalogue`, changeFrequency: 'daily' },
    { url: `${site}/abonnement`, changeFrequency: 'monthly' },
  ];
  try {
    const r = await apiGet<{ items: BookSummary[] }>('/books?limit=200');
    return base.concat(
      r.items.map((b) => ({
        url: `${site}/livre/${b.slug}`,
        changeFrequency: 'weekly',
      })),
    );
  } catch {
    return base;
  }
}

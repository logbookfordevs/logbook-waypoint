import type { MetadataRoute } from 'next';

import { documentationPages } from '@/lib/docs-content';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/docs`, changeFrequency: 'weekly', priority: 0.8 },
    ...documentationPages.map((page) => ({
      url: `${siteUrl}/docs/${page.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}

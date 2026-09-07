import type { MetadataRoute } from 'next';

import { documentationPages } from '@/lib/docs-content';
import { siteUrl } from '@/lib/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/docs`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.4 },
    ...documentationPages.map((page) => ({
      url: `${siteUrl}/docs/${page.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}

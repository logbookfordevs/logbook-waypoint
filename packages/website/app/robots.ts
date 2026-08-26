import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site-config';
const isProductionDomainConfigured = process.env.NEXT_PUBLIC_SITE_URL !== undefined;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isProductionDomainConfigured
      ? { userAgent: '*', allow: '/' }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const isProductionDomainConfigured = process.env.NEXT_PUBLIC_SITE_URL !== undefined;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isProductionDomainConfigured
      ? { userAgent: '*', allow: '/' }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

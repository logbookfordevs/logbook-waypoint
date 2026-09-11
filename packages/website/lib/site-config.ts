import type { Metadata } from 'next';

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://waypoint.logbookfordevs.com';

const socialImageAlt = 'Logbook Waypoint — Pin the point. Chart the change.';

export function createSocialMetadata({
  description,
  title,
  url,
}: {
  description: string;
  title: string;
  url: string;
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      description,
      images: [{
        alt: socialImageAlt,
        height: 630,
        url: '/opengraph-image',
        width: 1200,
      }],
      locale: 'en_US',
      siteName: 'Logbook Waypoint',
      title,
      type: 'website',
      url,
    },
    twitter: {
      card: 'summary_large_image',
      description,
      images: [{ alt: socialImageAlt, url: '/twitter-image' }],
      title,
    },
  };
}

export const chromeWebStoreUrl =
  'https://chromewebstore.google.com/detail/logbook-waypoint/fgondknhkpekdhbbkgodokmpnpadfedo';

export const signalChartUrl =
  'https://tot.page/I3pC-z9cCejNITMc7Mk96Q/index.html@b5f1d9e0955ce3411ccf9709e3d05bd89415a8bd';

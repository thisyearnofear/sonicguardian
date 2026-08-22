import type { Metadata } from 'next';
import {
  GITHUB_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from './site';

export function createSiteMetadata(overrides?: Partial<Metadata>): Metadata {
  const titleDefault = `${SITE_NAME} | ${SITE_TAGLINE}`;
  const ogImage = absoluteUrl('/opengraph-image');

  const base: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
      default: titleDefault,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: 'Sonic Guardian', url: GITHUB_URL }],
    creator: 'Sonic Guardian',
    publisher: SITE_NAME,
    category: 'technology',
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: SITE_URL,
      siteName: SITE_NAME,
      title: titleDefault,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleDefault,
      description: SITE_DESCRIPTION,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: SITE_NAME,
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      'github-repo': GITHUB_URL,
    },
  };

  return {
    ...base,
    ...overrides,
    openGraph: { ...base.openGraph, ...overrides?.openGraph },
    twitter: { ...base.twitter, ...overrides?.twitter },
    alternates: { ...base.alternates, ...overrides?.alternates },
  };
}

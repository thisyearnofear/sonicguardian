/** Public site metadata — used by layout, OG image, sitemap, and manifest. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://sonicguardian.vercel.app';

export const SITE_NAME = 'Sonic Guardian';

export const SITE_TAGLINE = 'Private human authority for Bitcoin and agents';

export const SITE_DESCRIPTION =
  'Turn a memorable musical secret into zero-knowledge authorship on Starknet. Prove human authority without revealing your pattern — authorize recovery privately via STRK20.';

export const SITE_KEYWORDS = [
  'Sonic Guardian',
  'Starknet',
  'STRK20',
  'zero-knowledge',
  'ZK acoustic signature',
  'Bitcoin recovery',
  'privacy',
  'sonic identity',
  'Pedersen commitment',
  'agent validation',
  'Proof of Privacy',
];

export const GITHUB_URL = 'https://github.com/thisyearnofear/sonicguardian';

export const HACKATHON_URL = 'https://strk20.starknet.io/hackathon';

export const THEME_COLOR = '#020617';

export const ROUTES = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/verify', changeFrequency: 'weekly' as const, priority: 0.9 },
];

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

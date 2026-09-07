/** Public site metadata — used by layout, OG image, sitemap, and manifest. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://sonicguardian.vercel.app';

export const SITE_NAME = 'Sonic Guardian';

export const SITE_TAGLINE = 'Musical wallet recovery';

export const SITE_DESCRIPTION =
  'Replace a seed phrase with a musical secret. Remember the music, keep a paper backup, and recover without revealing the pattern.';

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
  { path: '/pool', changeFrequency: 'weekly' as const, priority: 0.6 },
];

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

import { createSiteMetadata } from '@/lib/metadata';
import { absoluteUrl } from '@/lib/site';

const description =
  'Replay your sonic secret and prove human authority with zero-knowledge verification on Starknet — no pattern revealed on-chain.';

export const metadata = createSiteMetadata({
  title: 'Verify authorship',
  description,
  alternates: {
    canonical: absoluteUrl('/verify'),
  },
  openGraph: {
    url: absoluteUrl('/verify'),
    title: 'Verify authorship | Sonic Guardian',
    description,
  },
  twitter: {
    title: 'Verify authorship | Sonic Guardian',
    description,
  },
});

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

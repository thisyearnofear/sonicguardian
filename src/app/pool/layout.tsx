import { createSiteMetadata } from '@/lib/metadata';
import { absoluteUrl } from '@/lib/site';

const description =
  'Run the STRK20 privacy-pool loop: shield, private transfer, then unshield. Separate from wallet recovery.';

export const metadata = createSiteMetadata({
  title: 'Privacy pool',
  description,
  alternates: {
    canonical: absoluteUrl('/pool'),
  },
  openGraph: {
    url: absoluteUrl('/pool'),
    title: 'Privacy pool | Sonic Guardian',
    description,
  },
  twitter: {
    title: 'Privacy pool | Sonic Guardian',
    description,
  },
});

export default function PoolLayout({ children }: { children: React.ReactNode }) {
  return children;
}

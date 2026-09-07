import { createSiteMetadata } from '@/lib/metadata';
import { absoluteUrl } from '@/lib/site';

const description =
  'Replay the musical secret you remember. Recover with any two keys — the music, this device, or your paper backup.';

export const metadata = createSiteMetadata({
  title: 'Recover',
  description,
  alternates: {
    canonical: absoluteUrl('/verify'),
  },
  openGraph: {
    url: absoluteUrl('/verify'),
    title: 'Recover | Sonic Guardian',
    description,
  },
  twitter: {
    title: 'Recover | Sonic Guardian',
    description,
  },
});

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

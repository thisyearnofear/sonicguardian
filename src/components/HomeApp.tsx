'use client';

import dynamic from 'next/dynamic';
import { AppLoadingShell } from '@/components/AppLoadingShell';

const SonicGuardian = dynamic(() => import('@/components/SonicGuardian'), {
  ssr: false,
  loading: () => <AppLoadingShell variant="mint" />,
});

export function HomeApp() {
  return <SonicGuardian />;
}

'use client';

import dynamic from 'next/dynamic';
import { AppLoadingShell } from '@/components/AppLoadingShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const PoolApp = dynamic(
  () => import('@/components/PoolApp').then((m) => m.PoolApp),
  {
    ssr: false,
    loading: () => <AppLoadingShell variant="pool" />,
  },
);

export default function PoolPage() {
  return (
    <ErrorBoundary>
      <PoolApp />
    </ErrorBoundary>
  );
}

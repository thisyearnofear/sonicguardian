'use client';

import dynamic from 'next/dynamic';
import { AppLoadingShell } from '@/components/AppLoadingShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const VerifyRouteApp = dynamic(
  () => import('@/components/VerifyRouteApp').then((m) => m.VerifyRouteApp),
  {
    ssr: false,
    loading: () => <AppLoadingShell variant="verify" />,
  },
);

export default function VerifyPage() {
  return (
    <ErrorBoundary>
      <VerifyRouteApp />
    </ErrorBoundary>
  );
}

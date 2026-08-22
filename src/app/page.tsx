import { Suspense } from 'react';
import { HomeApp } from '@/components/HomeApp';
import { AppLoadingShell } from '@/components/AppLoadingShell';

export default function Home() {
  return (
    <Suspense fallback={<AppLoadingShell />}>
      <HomeApp />
    </Suspense>
  );
}

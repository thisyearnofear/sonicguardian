'use client';

import dynamic from 'next/dynamic';

const SonicGuardian = dynamic(() => import('@/components/SonicGuardian'), {
  ssr: false,
});

export default function Home() {
  const handleRecoverySuccess = (hash: string) => {
    console.log('Recovery successful with hash:', hash);
  };

  const handleRecoveryFailure = () => {
    console.log('Recovery failed');
  };

  return (
    <SonicGuardian
      onRecovery={handleRecoverySuccess}
      onFailure={handleRecoveryFailure}
    />
  );
}

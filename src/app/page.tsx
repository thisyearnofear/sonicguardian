'use client';

import SonicGuardian from '@/components/SonicGuardian';

export default function Home() {
  const handleRecoverySuccess = (hash: string) => {
    console.log('Recovery successful with hash:', hash);
    // In a real implementation, this would trigger wallet key rotation
  };

  const handleRecoveryFailure = () => {
    console.log('Recovery failed');
    // Handle recovery failure
  };

  return (
    <SonicGuardian
      onRecovery={handleRecoverySuccess}
      onFailure={handleRecoveryFailure}
    />
  );
}

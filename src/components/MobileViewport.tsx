'use client';

import { useEffect } from 'react';

/**
 * Sets dynamic viewport height (--vh) for mobile browsers and enables smooth scrolling.
 */
export function MobileViewport({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    setVh();
    window.addEventListener('resize', setVh, { passive: true });
    window.addEventListener('orientationchange', setVh, { passive: true });

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  return <>{children}</>;
}

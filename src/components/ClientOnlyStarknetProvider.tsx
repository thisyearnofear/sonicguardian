'use client';

import React, { useEffect, useState } from 'react';
import { StarknetProvider } from './StarknetProvider';

export function ClientOnlyStarknetProvider({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return <>{children}</>;
    }

    return <StarknetProvider>{children}</StarknetProvider>;
}

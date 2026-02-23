'use client';

import React from 'react';
import { StarknetConfig, argent, braavos, useInjectedConnectors, publicProvider } from '@starknet-react/core';
import { mainnet, sepolia } from '@starknet-react/chains';

export function StarknetProvider({ children }: { children: React.ReactNode }) {
    const { connectors } = useInjectedConnectors({
        recommended: [argent(), braavos()],
        includeRecommended: 'onlyIfNoConnectors',
        order: 'random'
    });

    return (
        <StarknetConfig
            chains={[sepolia, mainnet]}
            provider={publicProvider()}
            connectors={connectors}
        >
            {children}
        </StarknetConfig>
    );
}

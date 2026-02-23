'use client';

import React from 'react';
import { StarknetConfig, argent, braavos, useInjectedConnectors, publicProvider } from '@starknet-react/core';
import { mainnet, sepolia } from '@starknet-react/chains';

export function StarknetProvider({ children }: { children: React.ReactNode }) {
    const { connectors } = useInjectedConnectors({
        recommended: [argent(), braavos()],
        includeRecommended: 'always',
        order: 'random'
    });

    return (
        <StarknetConfig
            chains={[mainnet, sepolia]}
            provider={publicProvider()}
            connectors={connectors}
            autoConnect
        >
            {children}
        </StarknetConfig>
    );
}

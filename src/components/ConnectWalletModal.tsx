'use client';

import React, { useEffect, useState } from 'react';
import { useConnect } from '@starknet-react/core';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { connect, connectors } = useConnect();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full max-w-md bg-[color:var(--background)] rounded-3xl border border-[color:var(--color-border)] shadow-2xl transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Connect Wallet</h2>
            <p className="text-sm text-[color:var(--color-muted)]">Select your preferred Starknet wallet</p>
          </div>

          {/* Connectors */}
          <div className="grid gap-3">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => {
                  connect({ connector });
                  onClose();
                }}
                className="w-full group flex items-center justify-between px-6 py-4 rounded-2xl bg-[color:var(--color-foreground)]/5 hover:bg-[color:var(--color-primary)]/10 border border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]/30 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  {/* Icon Placeholder (or actual icons if available in connector) */}
                  <div className="w-10 h-10 rounded-xl bg-[color:var(--color-foreground)]/10 flex items-center justify-center group-hover:bg-[color:var(--color-primary)]/20 transition-colors">
                    <span className="text-xl">{connector.name.charAt(0)}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">{connector.name}</div>
                    <div className="text-[10px] text-[color:var(--color-muted)] font-mono uppercase tracking-widest">Starknet</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[color:var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">Connect →</span>
              </button>
            ))}
          </div>

          {/* Xverse Pro Tip */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent border border-orange-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-4xl">₿</span>
            </div>
            
            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-orange-500/20 rounded-full text-[10px]">💡</span>
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Pro Tip</p>
              </div>
              
              <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
                Use <span className="font-bold text-white/90">Xverse Wallet</span> for Bitcoin integration. 
                Xverse supports Starknet and enables seamless <span className="text-orange-300 italic">BTC ↔ STRK</span> swaps.
              </p>
              
              <a 
                href="https://www.xverse.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-[10px] text-orange-400 font-bold uppercase tracking-widest rounded-xl border border-orange-500/20 transition-all group/btn"
              >
                Download Xverse 
                <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
              </a>
            </div>
          </div>

          {/* Footer */}
          <button 
            onClick={onClose}
            className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

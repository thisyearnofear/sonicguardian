'use client';

import React from 'react';

type BannerTone = 'neutral' | 'success' | 'error' | 'pending' | 'warning';

function inferTone(message: string): BannerTone {
  if (/^(✅|✨|🎉)/.test(message) || /verified|success|anchored|copied/i.test(message)) {
    return 'success';
  }
  if (/^(❌|⚠️)/.test(message) || /failed|error|invalid/i.test(message)) {
    return message.startsWith('⚠️') ? 'warning' : 'error';
  }
  if (/^(🔒|🔮|📦|🔐|🌐|Generating|Committing|Verifying|Playing|Initializing)/.test(message)) {
    return 'pending';
  }
  return 'neutral';
}

interface StatusBannerProps {
  message: string;
  className?: string;
  children?: React.ReactNode;
}

export function StatusBanner({ message, className = '', children }: StatusBannerProps) {
  const tone = inferTone(message);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`status-banner status-banner-${tone} ${className}`}
      data-testid="status-banner"
    >
      <p className="text-sm leading-relaxed">{message}</p>
      {children}
    </div>
  );
}

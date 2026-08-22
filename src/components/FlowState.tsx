'use client';

import React from 'react';

type FlowStateVariant = 'empty' | 'success' | 'pending';

interface FlowStateProps {
  variant: FlowStateVariant;
  icon: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

export function FlowState({
  variant,
  icon,
  title,
  description,
  children,
  className = '',
}: FlowStateProps) {
  return (
    <div
      className={`flow-state flow-state-${variant} text-center space-y-3 ${className}`}
      data-testid={`flow-state-${variant}`}
    >
      <div className="flow-state-icon" aria-hidden>
        {icon}
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-bold tracking-tight">{title}</p>
        <p className="text-sm text-[color:var(--color-muted)] leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

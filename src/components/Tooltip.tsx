'use client';

import { getTooltipText } from '@/lib/tooltips';

interface TooltipProps {
  text?: string;
  id?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ text, id, children, position = 'top', delay = 200 }: TooltipProps) {
  const tooltipText = id ? getTooltipText(id) : text;
  
  if (!tooltipText) {
    return <>{children}</>;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-0 left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-b-black/90';
      case 'left':
        return 'right-0 top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-l-black/90';
      case 'right':
        return 'left-0 top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-r-black/90';
      case 'top':
      default:
        return 'bottom-0 left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-t-black/90';
    }
  };

  return (
    <div className="group relative inline-flex items-center">
      {children}
      <div 
        className={`absolute ${getPositionClasses()} px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {tooltipText}
        <div className={`absolute ${getArrowClasses()}`} />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Mint', testId: 'nav-mint' },
  { href: '/verify', label: 'Verify', testId: 'nav-verify' },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center p-0.5 rounded-xl bg-[color:var(--color-foreground)]/5 border border-[color:var(--color-border)]"
      aria-label="Primary"
    >
      {NAV.map(({ href, label, testId }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            data-testid={testId}
            className={`nav-pill ${active ? 'nav-pill-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

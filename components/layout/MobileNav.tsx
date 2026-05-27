'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';

/**
 * Lightweight drawer — no Radix Sheet to keep the dependency surface small.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => setOpen(false), [pathname]);

  // Lock scroll while drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full w-72 border-r border-border bg-background p-4 shadow-xl md:hidden">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold tracking-tight">Bless</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
                const isActive =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent/60'
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}

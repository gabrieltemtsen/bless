'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';
import { BlessLogo } from '@/components/brand/BlessLogo';
import { BackTheDev } from '@/components/wallet/BackTheDev';
import { NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';

/**
 * Lightweight drawer — no Radix Sheet to keep the dependency surface small.
 *
 * IMPORTANT: the drawer must be portalled to <body>. The app's <header>
 * uses `backdrop-blur`, which under the CSS spec creates a new containing
 * block for *fixed-positioned* descendants. If we render the drawer inline
 * inside Header it gets trapped — `position: fixed; height: 100%` computes
 * against the 56px header instead of the viewport, so the panel only fills
 * the top strip and page content bleeds through underneath.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Only portal client-side (document is undefined during SSR).
  useEffect(() => setMounted(true), []);

  // Close on route change.
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="-ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="md:hidden">
            {/* Dim + click-out backdrop */}
            <div
              className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden
            />

            {/* Drawer panel */}
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="fixed left-0 top-0 z-[70] flex h-screen w-[min(20rem,85vw)] flex-col border-r border-border bg-background shadow-2xl"
            >
              <header className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-2">
                  <BlessLogo width={24} height={24} />
                  <span className="font-semibold tracking-tight">Bless</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <X className="size-5" />
                </button>
              </header>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
                {NAV.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'text-foreground hover:bg-accent/60'
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <footer className="border-t border-border/60 p-4">
                <BackTheDev />
              </footer>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}

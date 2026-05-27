'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BackTheDev } from '@/components/wallet/BackTheDev';
import { NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden flex-col border-r border-border/60 bg-sidebar/40 p-3 md:flex">
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
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'hover:bg-sidebar-accent/60'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">How it works</p>
        <p className="leading-relaxed">
          Bless someone for anything worth saying thanks for — a kindness, a
          task done, a gift, a chain paid forward. Travels only along the
          people you&apos;ve trusted in Circles. If they bless someone back
          within 48h, the chain grows.
        </p>
      </div>

      <div className="mt-auto pt-6">
        <BackTheDev />
      </div>
    </aside>
  );
}

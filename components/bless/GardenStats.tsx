'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Flower2, Sprout, Coins, Users, Trophy } from 'lucide-react';
import { computeGardenStats } from '@/lib/chain-stats';
import { formatCrc } from '@/lib/format';
import type { Chain } from '@/lib/types';

/**
 * Garden insights bar — aggregate stats across every chain, shown above the
 * feed. Pure/presentational: it reads the same `chains` the feed already
 * fetched, so there's no extra round-trip.
 */
export function GardenStats({ chains }: { chains: Chain[] }) {
  const g = useMemo(() => computeGardenStats(chains), [chains]);
  if (chains.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-gradient-to-br from-amber-50/70 via-rose-50/50 to-violet-50/60 p-4 md:flex-row md:items-center md:gap-2">
      <Tile
        icon={<Sprout className="size-4 text-amber-600" />}
        value={String(g.totalChains)}
        label="chains planted"
      />
      <Divider />
      <Tile
        icon={<Flower2 className="size-4 text-rose-500" />}
        value={String(g.activeChains)}
        label="still blooming"
      />
      <Divider />
      <Tile
        icon={<Coins className="size-4 text-violet-600" />}
        value={formatCrc(g.totalCrcMoved)}
        label="CRC moved"
      />
      <Divider />
      <Tile
        icon={<Users className="size-4 text-emerald-600" />}
        value={String(g.uniqueAvatars)}
        label="people touched"
      />
      {g.longest && (
        <>
          <Divider />
          <Link
            href={`/chain/${g.longest.id}`}
            className="group flex flex-1 items-center gap-2 rounded-2xl px-2 py-1 transition-colors hover:bg-white/60"
          >
            <Trophy className="size-4 shrink-0 text-amber-500" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-none tabular-nums">
                {g.longest.links} links
              </span>
              <span className="block truncate text-[11px] text-muted-foreground group-hover:underline">
                longest: {g.longest.title}
              </span>
            </span>
          </Link>
        </>
      )}
    </div>
  );
}

function Tile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2">
      {icon}
      <span>
        <span className="block text-lg font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </span>
        <span className="block text-[11px] text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-8 w-px bg-border/70 md:block" />;
}

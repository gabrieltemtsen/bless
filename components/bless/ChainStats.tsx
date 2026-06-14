'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  GitBranch,
  Users,
  Network,
  Timer,
  Coins,
  Sparkles,
} from 'lucide-react';
import { computeChainStats } from '@/lib/chain-stats';
import { getChainReach, type ChainReach } from '@/lib/circles';
import { formatCrc } from '@/lib/format';
import type { Chain, Hex } from '@/lib/types';

/**
 * The stats strip for a single chain. Local link math is instant; the
 * trust-graph *reach* (how many avatars the chain could spread to next) is
 * filled in from the Circles SDK once it resolves.
 */
export function ChainStats({ chain }: { chain: Chain }) {
  const stats = useMemo(() => computeChainStats(chain), [chain]);
  const [reach, setReach] = useState<ChainReach | null>(null);

  const avatars = useMemo(() => {
    const set = new Set<string>();
    for (const l of chain.links) {
      set.add(l.from.toLowerCase());
      set.add(l.to.toLowerCase());
    }
    return Array.from(set) as Hex[];
  }, [chain]);

  useEffect(() => {
    let cancelled = false;
    getChainReach(avatars)
      .then((r) => !cancelled && setReach(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [avatars]);

  const momentum =
    stats.medianForwardHours === null
      ? '—'
      : stats.medianForwardHours < 1
        ? `${Math.round(stats.medianForwardHours * 60)}m`
        : `${stats.medianForwardHours.toFixed(1)}h`;

  const frontier = reach?.resolved ? formatCrc(reach.frontier) : '…';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Stat
        icon={<GitBranch className="size-4" />}
        label="Hops"
        value={String(stats.hops)}
        hint={`${stats.links} link${stats.links === 1 ? '' : 's'}`}
      />
      <Stat
        icon={<Users className="size-4" />}
        label="People"
        value={String(stats.uniqueAvatars)}
        hint="distinct avatars"
      />
      <Stat
        icon={<Network className="size-4" />}
        label="Trust reach"
        value={frontier}
        hint="could spread to"
        accent
      />
      <Stat
        icon={<Timer className="size-4" />}
        label="Momentum"
        value={momentum}
        hint="median to forward"
      />
      <Stat
        icon={<Coins className="size-4" />}
        label="CRC moved"
        value={formatCrc(stats.totalCrc)}
        hint="across the chain"
      />
      <Stat
        icon={<Sparkles className="size-4" />}
        label="Held now"
        value={stats.livePresentValue.toFixed(3)}
        hint="after demurrage"
        accent
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        'flex flex-col gap-1 rounded-2xl border p-3 ' +
        (accent
          ? 'border-rose-200/70 bg-gradient-to-br from-rose-50/80 to-violet-50/60'
          : 'border-border bg-card')
      }
    >
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-xl font-semibold leading-none tracking-tight tabular-nums">
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground/80">{hint}</span>
    </div>
  );
}

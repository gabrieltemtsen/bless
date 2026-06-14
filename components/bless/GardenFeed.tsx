'use client';

import { useEffect, useState } from 'react';
import { Flower2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChainCard } from '@/components/bless/ChainCard';
import { GardenStats } from '@/components/bless/GardenStats';
import type { Chain } from '@/lib/types';

export function GardenFeed() {
  const [chains, setChains] = useState<Chain[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/chains', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { chains } = (await res.json()) as { chains: Chain[] };
        if (!cancelled) setChains(chains);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>
    );
  }
  if (!chains) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-3xl" />
        ))}
      </div>
    );
  }
  if (chains.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-background/60 px-6 py-12 text-center">
        <Flower2 className="size-8 text-rose-300" />
        <h3 className="text-base font-semibold">The garden is still bare.</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Be the first to start a chain. Send a small blessing and a story to
          someone who&apos;s trusted you on Circles — and watch where it grows.
        </p>
        <Link href="/bless">
          <Button size="lg">Plant the first seed</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <GardenStats chains={chains} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((c) => (
          <ChainCard key={c.id} chain={c} />
        ))}
      </div>
    </div>
  );
}

'use client';

import { Sprout, Flower2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileChip } from '@/components/profile/ProfileChip';
import { LiveValuePill } from '@/components/bless/LiveValuePill';
import { formatCrc, formatRelative } from '@/lib/format';
import { deriveStatus } from '@/lib/status';
import type { Chain } from '@/lib/types';

/**
 * Animated, blooming "vine" of a blessing's lineage.
 *
 * A single gradient rail runs down the left; each link is a bloom on the vine
 * that grows in with a staggered delay. The root is a sprout, the current
 * holder is the live bud (with a real-time demurrage readout), and a wilted
 * chain fades its rail to grey.
 */
export function ChainTree({ chain }: { chain: Chain }) {
  const status = deriveStatus(chain);
  const holder = status.currentHolder.toLowerCase();

  return (
    <ol className="relative flex flex-col">
      {/* The vine — a gradient rail behind every node. */}
      <span
        aria-hidden
        className={
          'pointer-events-none absolute bottom-6 left-[19px] top-6 w-[2px] rounded-full ' +
          (status.isWilted
            ? 'bg-gradient-to-b from-stone-300/70 to-stone-200/40'
            : 'bg-gradient-to-b from-amber-300 via-rose-300 to-violet-400')
        }
      />

      {chain.links.map((link, idx) => {
        const isRoot = idx === 0;
        const isLast = idx === chain.links.length - 1;
        const isHeldHere = isLast && link.to.toLowerCase() === holder;
        const gapFromPrev =
          idx > 0 ? link.createdAt - chain.links[idx - 1].createdAt : null;

        return (
          <li
            key={link.txHash}
            className="bless-grow relative flex gap-4 pb-6 last:pb-0"
            style={{ animationDelay: `${idx * 90}ms` }}
          >
            {/* Bloom marker on the vine. */}
            <div className="relative z-10 flex flex-col items-center">
              <span
                className={
                  'flex size-10 items-center justify-center rounded-full border shadow-sm ' +
                  (status.isWilted
                    ? 'border-stone-200 bg-stone-50 text-stone-400'
                    : isRoot
                      ? 'border-amber-200 bg-amber-50 text-amber-600'
                      : isHeldHere
                        ? 'border-rose-300 bg-rose-50 text-rose-600 bless-pulse'
                        : 'border-violet-200 bg-violet-50 text-violet-600')
                }
              >
                {isRoot ? (
                  <Sprout className="size-4" />
                ) : isHeldHere && !status.isWilted ? (
                  <Flower2 className="size-4 bless-spin-slow" />
                ) : (
                  <Flower2 className="size-4" />
                )}
              </span>
            </div>

            <div className="flex-1 pt-0.5">
              {/* Momentum chip between links. */}
              {gapFromPrev !== null && (
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  passed on after {humanGap(gapFromPrev)}
                </p>
              )}

              <Card className="overflow-hidden transition-shadow hover:shadow-[0_4px_0_rgba(0,0,0,0.03),0_18px_36px_-14px_rgba(120,40,90,0.28)]">
                <div className="flex flex-col gap-3 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="muted" className="font-mono">
                      {isRoot ? 'seed' : `#${link.index + 1}`}
                    </Badge>
                    {isHeldHere && !status.isWilted ? (
                      <LiveValuePill amount={link.amount} sinceMs={link.createdAt} showLost />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {formatCrc(link.amount)} CRC
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <ProfileChip address={link.from} variant="md" />
                    <span className="text-xs text-muted-foreground">blessed</span>
                    <ProfileChip address={link.to} variant="md" />
                  </div>

                  <blockquote className="rounded-2xl bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 px-4 py-3 text-sm leading-relaxed text-foreground/90">
                    <span aria-hidden className="mr-1 text-rose-300">
                      &ldquo;
                    </span>
                    {link.story}
                    <span aria-hidden className="ml-1 text-rose-300">
                      &rdquo;
                    </span>
                  </blockquote>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{formatRelative(link.createdAt)}</span>
                    <a
                      href={`https://gnosisscan.io/tx/${link.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[10px] underline-offset-2 hover:text-foreground hover:underline"
                      title={link.txHash}
                    >
                      tx {link.txHash.slice(0, 10)}…
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function humanGap(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d} day${d === 1 ? '' : 's'}`;
  }
  if (h >= 1) {
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const m = Math.max(1, Math.floor(ms / 60_000));
  return `${m} min`;
}

'use client';

import { ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileChip } from '@/components/profile/ProfileChip';
import { formatCrc, formatRelative } from '@/lib/format';
import type { Chain } from '@/lib/types';

/**
 * Vertical tree visualization of a blessing's lineage.
 * Each link is a card: who sent → what they wrote → who received.
 */
export function ChainTree({ chain }: { chain: Chain }) {
  return (
    <ol className="relative flex flex-col gap-0">
      {chain.links.map((link, idx) => {
        const isLast = idx === chain.links.length - 1;
        return (
          <li key={link.txHash} className="flex flex-col items-stretch">
            <Card className="relative overflow-hidden">
              {/* Index ribbon */}
              <div className="absolute right-4 top-4">
                <Badge variant="muted" className="font-mono">
                  #{link.index + 1}
                </Badge>
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <ProfileChip address={link.from} variant="md" />
                  <span className="text-xs text-muted-foreground">
                    blessed
                  </span>
                  <ProfileChip address={link.to} variant="md" />
                </div>

                <blockquote className="rounded-2xl bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 px-4 py-3 text-sm leading-relaxed text-foreground/90">
                  <span aria-hidden className="mr-1 text-rose-300">“</span>
                  {link.story}
                  <span aria-hidden className="ml-1 text-rose-300">”</span>
                </blockquote>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{formatCrc(link.amount)} CRC · {formatRelative(link.createdAt)}</span>
                  <a
                    href={`https://gnosisscan.io/tx/${link.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[10px] underline-offset-2 hover:underline"
                    title={link.txHash}
                  >
                    tx {link.txHash.slice(0, 10)}…
                  </a>
                </div>
              </div>
            </Card>

            {!isLast && (
              <div className="flex justify-center py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
                  <ArrowDown className="size-3.5" />
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

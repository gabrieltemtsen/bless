'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CountdownPill } from '@/components/bless/CountdownPill';
import { ProfileChip } from '@/components/profile/ProfileChip';
import { deriveStatus } from '@/lib/status';
import { formatCrc, formatRelative } from '@/lib/format';
import type { Chain } from '@/lib/types';

export function ChainCard({ chain }: { chain: Chain }) {
  const status = deriveStatus(chain);
  const first = chain.links[0];
  const last = chain.links[chain.links.length - 1];

  return (
    <Link
      href={`/chain/${chain.id}`}
      className="group block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full transition-transform group-hover:-translate-y-0.5 group-hover:shadow-[0_4px_0_rgba(0,0,0,0.03),0_18px_36px_-12px_rgba(50,30,80,0.25)]">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline" className="font-mono uppercase tracking-wider">
              <Sparkles className="size-3" /> {chain.links.length} link
              {chain.links.length === 1 ? '' : 's'}
            </Badge>
            <CountdownPill deadlineMs={status.forwardDeadline} />
          </div>

          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            {chain.title || first.story}
          </h3>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <ProfileChip address={first.from} variant="sm" hideAddress />
            <ArrowRight className="size-4 text-muted-foreground" />
            <div className="justify-self-end">
              <ProfileChip address={last.to} variant="sm" hideAddress />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCrc(first.amount)} CRC</span>
            <span>started {formatRelative(first.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

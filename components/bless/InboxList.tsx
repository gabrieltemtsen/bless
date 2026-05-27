'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRightCircle, Flower2, Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CountdownPill } from '@/components/bless/CountdownPill';
import { ProfileChip } from '@/components/profile/ProfileChip';
import { deriveStatus } from '@/lib/status';
import { formatCrc, formatRelative } from '@/lib/format';
import type { Chain, Hex } from '@/lib/types';

interface InboxPayload {
  incoming: Chain[]; // chains where I'm the current holder (action required)
  sent: Chain[]; // chains I'm part of as a previous link
}

export function InboxList({ address }: { address: Hex }) {
  const [data, setData] = useState<InboxPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/inbox/${address}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as InboxPayload;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (err) {
    return (
      <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <SectionHeader
          icon={<Inbox className="size-4" />}
          title="Waiting on you"
          subtitle="Forward each within 48h or the chain wilts."
        />
        {data.incoming.length === 0 ? (
          <EmptyState
            icon={<Flower2 className="size-5 text-rose-400" />}
            text="No active blessings in your inbox yet."
          />
        ) : (
          data.incoming.map((c) => (
            <IncomingRow key={c.id} chain={c} address={address} />
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          icon={<ArrowRightCircle className="size-4" />}
          title="Chains you’ve touched"
          subtitle="Blessings you started or forwarded — see where they’ve travelled."
        />
        {data.sent.length === 0 ? (
          <EmptyState
            icon={<Flower2 className="size-5 text-rose-400" />}
            text="You haven't sent a blessing yet. Try the Garden or start a new chain."
          />
        ) : (
          data.sent.map((c) => (
            <SentRow key={c.id} chain={c} address={address} />
          ))
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          {icon} {title}
        </h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function IncomingRow({ chain, address }: { chain: Chain; address: Hex }) {
  const status = deriveStatus(chain);
  const last = chain.links[chain.links.length - 1];
  const isHolder = status.currentHolder.toLowerCase() === address.toLowerCase();

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CountdownPill deadlineMs={status.forwardDeadline} />
            <span>·</span>
            <span>from</span>
            <ProfileChip address={last.from} variant="sm" hideAddress />
          </div>
          <p className="line-clamp-2 text-sm">
            <span className="text-rose-400">“</span>
            {last.story}
            <span className="text-rose-400">”</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCrc(last.amount)} CRC · received {formatRelative(last.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 md:flex-row md:items-center">
          {isHolder && !status.isWilted && (
            <Link
              href={`/forward/${chain.id}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              Forward →
            </Link>
          )}
          <Link
            href={`/chain/${chain.id}`}
            className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"
          >
            View chain
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function SentRow({ chain, address }: { chain: Chain; address: Hex }) {
  const status = deriveStatus(chain);
  const myLinks = chain.links.filter(
    (l) => l.from.toLowerCase() === address.toLowerCase()
  );
  const lastMine = myLinks[myLinks.length - 1] ?? chain.links[0];

  return (
    <Link href={`/chain/${chain.id}`} className="block">
      <Card className="transition-colors hover:bg-accent/30">
        <CardContent className="flex items-center gap-4 p-4">
          <Badge variant="outline" className="font-mono">
            #{chain.links.length}
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-medium">
              {chain.title || chain.links[0].story}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              you forwarded {formatCrc(lastMine.amount)} CRC ·{' '}
              {formatRelative(lastMine.createdAt)}
            </p>
          </div>
          <CountdownPill deadlineMs={status.forwardDeadline} />
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
      {icon}
      {text}
    </div>
  );
}

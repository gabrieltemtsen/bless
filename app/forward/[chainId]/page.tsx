import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlessingComposer } from '@/components/bless/BlessingComposer';
import { CountdownPill } from '@/components/bless/CountdownPill';
import { ProfileChip } from '@/components/profile/ProfileChip';
import { ForwardGate } from '@/components/bless/ForwardGate';
import { HostHint } from '@/components/wallet/HostHint';
import { deriveStatus } from '@/lib/status';
import { getChain } from '@/lib/store';
import { formatCrc } from '@/lib/format';

interface PageProps {
  params: Promise<{ chainId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ForwardPage({ params }: PageProps) {
  const { chainId } = await params;
  const chain = await getChain(chainId);
  if (!chain) return notFound();

  const status = deriveStatus(chain);
  const last = chain.links[chain.links.length - 1];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        href={`/chain/${chain.id}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to chain
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted" className="font-mono">link #{last.index + 1}</Badge>
            <CountdownPill deadlineMs={status.forwardDeadline} />
          </div>
          <h1 className="text-xl font-semibold leading-tight tracking-tight">
            Pass it on
          </h1>
          <p className="text-sm text-muted-foreground">
            {last.from === last.to
              ? 'You blessed yourself; that doesn’t count.'
              : 'You received this blessing — give it new legs.'}
          </p>
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 p-4 text-sm">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              From{' '}
            </p>
            <div className="flex items-center justify-between gap-3">
              <ProfileChip address={last.from} variant="sm" hideAddress />
              <span className="font-mono text-xs text-muted-foreground">
                {formatCrc(last.amount)} CRC
              </span>
            </div>
            <blockquote className="mt-3 text-foreground/90">
              <span aria-hidden className="mr-1 text-rose-300">“</span>
              {last.story}
              <span aria-hidden className="ml-1 text-rose-300">”</span>
            </blockquote>
          </div>
        </CardContent>
      </Card>

      <HostHint />

      <Card>
        <CardContent className="p-6 md:p-8">
          {/* Client-side gate: only renders the composer for the current holder. */}
          <ForwardGate
            chainId={chain.id}
            holder={status.currentHolder}
            amount={last.amount}
            isWilted={status.isWilted}
          />
        </CardContent>
      </Card>
    </div>
  );
}

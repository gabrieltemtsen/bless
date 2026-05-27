import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChainTree } from '@/components/bless/ChainTree';
import { CountdownPill } from '@/components/bless/CountdownPill';
import { ProfileChip } from '@/components/profile/ProfileChip';
import { deriveStatus } from '@/lib/status';
import { getChain } from '@/lib/store';
import { formatCrc } from '@/lib/format';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ChainPage({ params }: PageProps) {
  const { id } = await params;
  const chain = await getChain(id);
  if (!chain) return notFound();

  const status = deriveStatus(chain);
  const first = chain.links[0];
  const totalCrc = chain.links.reduce((acc, l) => acc + Number(l.amount), 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to the garden
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono uppercase">
              <Sparkles className="size-3" /> {chain.links.length} link
              {chain.links.length === 1 ? '' : 's'}
            </Badge>
            <CountdownPill deadlineMs={status.forwardDeadline} />
            <Badge variant="muted">{formatCrc(totalCrc)} CRC moved total</Badge>
          </div>

          <h1 className="text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            {chain.title || first.story}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">started by</span>
            <ProfileChip address={first.from} variant="md" />
            <span className="text-muted-foreground">· currently held by</span>
            <ProfileChip address={status.currentHolder} variant="md" />
          </div>

          {!status.isWilted && (
            <Link href={`/forward/${chain.id}`} className="self-start">
              <Button>Forward this blessing →</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <ChainTree chain={chain} />

      <p className="text-center text-xs text-muted-foreground">
        Every transfer is a real ERC-1155 <code>safeTransferFrom</code> on
        Circles Hub v2 (Gnosis). The story metadata lives off-chain so it stays
        easy to read.
      </p>
    </div>
  );
}

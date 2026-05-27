'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlessingComposer } from '@/components/bless/BlessingComposer';
import { ProfileChip } from '@/components/profile/ProfileChip';
import { useWallet } from '@/hooks/use-wallet';
import type { Hex } from '@/lib/types';

/**
 * Reads the wallet on the client (which only exists inside the host) and
 * shows the composer only if the connected user is the current holder.
 */
export function ForwardGate({
  chainId,
  holder,
  amount,
  isWilted,
}: {
  chainId: string;
  holder: Hex;
  amount: string;
  isWilted: boolean;
}) {
  const { address, isConnected } = useWallet();

  if (isWilted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">
        <ShieldAlert className="size-5" />
        <div>
          <p className="font-medium">This chain has wilted.</p>
          <p className="text-xs">
            The 48-hour window passed. The holder keeps the CRC, but the chain
            stops growing here.
          </p>
        </div>
        <Link href={`/chain/${chainId}`}>
          <Button variant="outline">View chain</Button>
        </Link>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="rounded-2xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
        Connect inside the Circles host to forward this blessing.
      </div>
    );
  }

  if (address.toLowerCase() !== holder.toLowerCase()) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/60 px-4 py-6 text-center text-sm">
        <p>Only the current holder can forward this chain.</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            holder: <ProfileChip address={holder} variant="sm" hideAddress />
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            you: <ProfileChip address={address} variant="sm" hideAddress />
          </span>
        </div>
        <Link href={`/chain/${chainId}`}>
          <Button variant="outline">View chain history</Button>
        </Link>
      </div>
    );
  }

  return (
    <BlessingComposer
      mode={{ kind: 'forward', chainId }}
      defaultAmount={amount}
      amountLocked
      title="Add your story"
      subtitle="One sentence. Then pass it to someone you trust."
    />
  );
}

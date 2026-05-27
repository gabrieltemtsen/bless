'use client';

import { ExternalLink } from 'lucide-react';
import { useWallet } from '@/components/wallet/WalletProvider';

/**
 * Friendly banner shown when the user has loaded the miniapp in a plain
 * browser tab instead of inside the Circles host. Standalone use is fine
 * for browsing, but the wallet stays disconnected so writes are disabled.
 */
export function HostHint() {
  const { isMiniappHost, isConnected } = useWallet();
  if (isMiniappHost || isConnected) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">You&apos;re browsing standalone.</p>
      <p className="mt-1 leading-relaxed text-amber-900/90">
        Open Bless inside the{' '}
        <a
          href="https://circles.gnosis.io/playground"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-2"
        >
          Circles host
          <ExternalLink className="size-3" />
        </a>{' '}
        to send and forward real blessings with your Circles avatar.
      </p>
    </div>
  );
}

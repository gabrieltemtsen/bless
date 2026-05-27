'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/components/wallet/WalletProvider';

/**
 * Shown on every page when the user is *browsing standalone* (i.e. opened
 * the deployed URL in a normal browser tab rather than inside the Circles
 * host). The Garden and chain detail pages render fine without a wallet —
 * we just want a loud, single-click way to hop into the host so real
 * blessings can be sent.
 *
 * The playground URL is built from `window.location.origin` so the CTA
 * always reopens *this* deployment inside the host, regardless of whether
 * the user is on production, a preview deploy, or a fork.
 */
export function HostHint() {
  const { isMiniappHost, isConnected } = useWallet();
  const [playgroundUrl, setPlaygroundUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const here = window.location.origin + '/';
    setPlaygroundUrl(
      `https://circles.gnosis.io/playground?url=${encodeURIComponent(here)}`
    );
  }, []);

  if (isMiniappHost || isConnected) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-rose-50 to-amber-100 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold tracking-tight text-amber-900">
            <Sparkles className="-mt-0.5 mr-1 inline-block size-4 text-amber-700" />
            You&apos;re browsing standalone — open Bless inside Circles to act.
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-900/85">
            Read the Garden, follow any chain, tap profiles — all without a
            wallet. To <strong>send</strong> a blessing, <strong>forward</strong>{' '}
            one, or <strong>trust the dev</strong>, hop into the Circles host
            with your avatar.
          </p>
        </div>

        {playgroundUrl && (
          <a
            href={playgroundUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
          >
            <Button
              size="lg"
              className="bg-amber-600 text-white shadow-md hover:bg-amber-700"
            >
              <Sparkles className="size-4" />
              Open in Circles host
              <ExternalLink className="size-3" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

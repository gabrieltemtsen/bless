'use client';

import { useEffect, useState } from 'react';
import { Check, Heart, Loader2 } from 'lucide-react';
import { ProfileChip } from '@/components/profile/ProfileChip';
import { useWallet } from '@/hooks/use-wallet';
import { buildTrustTx, isTrusted } from '@/lib/circles';
import { CREATOR } from '@/lib/creator';
import { cn } from '@/lib/utils';

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done' }
  | { kind: 'error'; error: string };

type Variant = 'card' | 'pill';

/**
 * "Trust the dev on Circles" affordance — opt-in, never bombarding.
 *
 * Two visual shapes share the same trust state + tx logic:
 *  - `card`: a built-by credit block (sidebar / drawer footer)
 *  - `pill`: a compact header pill, visible on every page so visitors who
 *    care to back the maker can do it without hunting
 *
 * Action states (both variants):
 *  - not connected           → nothing actionable (card shows a tiny hint;
 *                              pill hides entirely so the header stays clean)
 *  - viewing as the creator  → no button (you can't trust yourself)
 *  - connected, not trusting → "Trust gabriel" button (the live ask)
 *  - connected, trusting     → "Trusted gabriel · cheers" acknowledgement
 *  - sending                 → spinner with "Trusting…"
 *
 * The on-chain check uses Hub v2 `isTrusted(you, gabriel)`, cached
 * implicitly per-component-mount so we don't re-hit RPC repeatedly.
 */
export function BackTheDev({
  variant = 'card',
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { address, isConnected } = useWallet();
  const [trustState, setTrustState] = useState<'unknown' | 'no' | 'yes'>(
    'unknown'
  );
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const isSelf =
    !!address && address.toLowerCase() === CREATOR.address.toLowerCase();

  useEffect(() => {
    if (!address || isSelf) {
      setTrustState('unknown');
      return;
    }
    let cancelled = false;
    isTrusted(address, CREATOR.address).then((ok) => {
      if (!cancelled) setTrustState(ok ? 'yes' : 'no');
    });
    return () => {
      cancelled = true;
    };
  }, [address, isSelf]);

  async function handleTrust() {
    try {
      setStatus({ kind: 'sending' });
      const tx = buildTrustTx({ trustReceiver: CREATOR.address });
      const { sendTransactions } = await import('@aboutcircles/miniapp-sdk');
      const hashes = await sendTransactions([tx]);
      if (!hashes[0]) throw new Error('Host returned no tx hash');
      setStatus({ kind: 'done' });
      setTrustState('yes');
    } catch (err) {
      setStatus({
        kind: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  const isTrusting = trustState === 'yes' || status.kind === 'done';
  const isSending = status.kind === 'sending';

  // ────────── PILL VARIANT (header) ──────────
  if (variant === 'pill') {
    // Keep header clean when there's nothing the user can do.
    if (isSelf) return null;
    if (!isConnected) return null;
    if (trustState === 'unknown' && !isTrusting) return null;

    if (isTrusting) {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800',
            className
          )}
          title={`You trust ${CREATOR.name} on Circles · thanks!`}
        >
          <Check className="size-3.5" />
          <span>
            Trusted {CREATOR.name} <span aria-hidden>· cheers</span>
          </span>
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={handleTrust}
        disabled={isSending}
        title={`Trust ${CREATOR.name} on Circles — purely optional`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 px-3 py-1 text-xs font-medium text-rose-700 shadow-sm transition-all hover:from-rose-100 hover:to-amber-100 hover:shadow disabled:opacity-60',
          className
        )}
      >
        {isSending ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Trusting…
          </>
        ) : (
          <>
            <Heart className="size-3.5 fill-current" /> Trust {CREATOR.name}
          </>
        )}
      </button>
    );
  }

  // ────────── CARD VARIANT (sidebar / drawer) ──────────

  let action: React.ReactNode = null;

  if (isSelf) {
    action = null; // creator viewing their own app — just the credit
  } else if (!isConnected) {
    action = (
      <span className="text-[10px] text-muted-foreground">Connect to trust</span>
    );
  } else if (isTrusting) {
    action = (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
        <Check className="size-3" /> Trusted · cheers
      </span>
    );
  } else if (trustState === 'no') {
    action = (
      <button
        type="button"
        onClick={handleTrust}
        disabled={isSending}
        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-60"
        title={`Trust ${CREATOR.name} on Circles — purely optional`}
      >
        {isSending ? (
          <>
            <Loader2 className="size-3 animate-spin" /> Trusting…
          </>
        ) : (
          <>
            <Heart className="size-3" /> Trust {CREATOR.name}
          </>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-background/60 p-3 text-xs',
        className
      )}
    >
      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        built by
      </div>
      <div className="flex items-center justify-between gap-2">
        <a
          href={CREATOR.profileUrl}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ProfileChip address={CREATOR.address} variant="sm" hideAddress />
        </a>
        {action}
      </div>
      {status.kind === 'error' && (
        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-[10px] text-red-700">
          {status.error}
        </p>
      )}
    </div>
  );
}

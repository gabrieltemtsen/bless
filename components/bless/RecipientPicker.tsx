'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileChip } from '@/components/profile/ProfileChip';
import { useWallet } from '@/hooks/use-wallet';
import { isTrustedBy } from '@/lib/circles';
import { shortenAddress } from '@/lib/format';
import { cn } from '@/lib/utils';
import { isAddress } from 'viem';

type Hex = `0x${string}`;

interface TrustRow {
  address: Hex;
}

/**
 * Lists the people the connected user has trusted (so any blessing they
 * forward will actually be accepted by the recipient's trust circle), plus
 * lets the user paste an arbitrary address — but warns if it's not trusted.
 */
export function RecipientPicker({
  value,
  onChange,
  excludeAddress,
}: {
  value: Hex | null;
  onChange: (addr: Hex | null) => void;
  /** Don't list this address (e.g. the sender themselves). */
  excludeAddress?: Hex;
}) {
  const { address } = useWallet();
  const [trusts, setTrusts] = useState<TrustRow[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pastedTrustOk, setPastedTrustOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    (async () => {
      try {
        const { Sdk } = await import('@aboutcircles/sdk');
        const sdk = new Sdk();
        // Circles v2 acceptance rule for direct ERC1155 transfers:
        //   the *recipient* must trust the *issuer* of the token being sent.
        // We're sending the sender's own personal CRC, so the recipient must
        // have trusted the sender. That means we want people who've trusted
        // *us* — `trustedBy` and `mutuallyTrusts` rows. Anything else and
        // Hub v2 will revert the transfer at simulation time.
        const rel = await sdk.rpc.trust.getAggregatedTrustRelations(address);
        if (cancelled) return;
        const rows: TrustRow[] = (rel ?? [])
          .filter(
            (r) => r.relation === 'trustedBy' || r.relation === 'mutuallyTrusts'
          )
          .map((r) => ({ address: r.objectAvatar.toLowerCase() as Hex }));
        setTrusts(rows);
      } catch (err) {
        setLoadErr(err instanceof Error ? err.message : 'Failed to load trust list');
        setTrusts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const filtered = useMemo(() => {
    if (!trusts) return [];
    const q = query.trim().toLowerCase();
    return trusts.filter((t) => {
      if (excludeAddress && t.address === excludeAddress.toLowerCase()) return false;
      if (!q) return true;
      return t.address.includes(q);
    });
  }, [trusts, query, excludeAddress]);

  const pasteCandidate = useMemo(() => {
    const q = query.trim();
    if (!isAddress(q)) return null;
    return q.toLowerCase() as Hex;
  }, [query]);

  // If the user pasted a custom address, check whether *they* trust *us* —
  // that's the on-chain prerequisite for accepting our CRC.
  useEffect(() => {
    setPastedTrustOk(null);
    if (!pasteCandidate || !address) return;
    let cancelled = false;
    isTrustedBy(address, pasteCandidate).then((ok) => {
      if (!cancelled) setPastedTrustOk(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [pasteCandidate, address]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a name or paste an address…"
          className="pl-9"
        />
      </div>

      {loadErr && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Couldn&apos;t load your trust list ({loadErr}). You can still paste an
          address below.
        </p>
      )}

      {/* Custom paste row */}
      {pasteCandidate && (
        <PickerRow
          address={pasteCandidate}
          selected={value === pasteCandidate}
          onSelect={() => onChange(pasteCandidate)}
          subtitle={
            pastedTrustOk === null
              ? 'Checking trust…'
              : pastedTrustOk
              ? 'They trust you ✓'
              : '⚠ They haven’t trusted you — transfer will revert'
          }
          warn={pastedTrustOk === false}
        />
      )}

      {/* Trust list */}
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {trusts === null && (
          <>
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </>
        )}
        {trusts && filtered.length === 0 && !pasteCandidate && (
          <div className="rounded-2xl border border-dashed border-border bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
            <AlertCircle className="mx-auto mb-1 size-4" />
            {trusts.length === 0
              ? "Nobody trusts you yet. Ask a friend to add your address in the Circles app, then come back — they have to trust you before they can receive your CRC."
              : 'No matches — try pasting an address.'}
          </div>
        )}
        {filtered.map((row) => (
          <PickerRow
            key={row.address}
            address={row.address}
            selected={value === row.address}
            onSelect={() => onChange(row.address)}
          />
        ))}
      </div>

      {value && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Selected: <span className="font-mono">{shortenAddress(value)}</span>
        </p>
      )}
    </div>
  );
}

function PickerRow({
  address,
  selected,
  onSelect,
  subtitle,
  warn,
}: {
  address: Hex;
  selected: boolean;
  onSelect: () => void;
  subtitle?: string;
  warn?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center justify-between rounded-2xl border bg-background px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
          : 'border-border hover:bg-accent/40'
      )}
    >
      <ProfileChip address={address} variant="md" />
      {subtitle && (
        <span
          className={cn(
            'ml-3 shrink-0 text-xs',
            warn ? 'text-amber-700' : 'text-muted-foreground'
          )}
        >
          {subtitle}
        </span>
      )}
    </button>
  );
}

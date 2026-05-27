'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/components/wallet/WalletProvider';
import { shortenAddress } from '@/lib/format';
import { cn } from '@/lib/utils';

type Profile = { name?: string; imageUrl?: string };
const cache = new Map<string, Profile>();

async function loadProfile(address: `0x${string}`): Promise<Profile> {
  const key = address.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  try {
    const { Sdk } = await import('@aboutcircles/sdk');
    const sdk = new Sdk();
    const view = await sdk.rpc.profile.getProfileView(address);
    let name = view.profile?.name ?? undefined;
    let imageUrl: string | undefined;
    if (view.avatarInfo?.cidV0) {
      try {
        const full = (await sdk.rpc.profile.getProfileByCid(
          view.avatarInfo.cidV0
        )) as { name?: string; imageUrl?: string; previewImageUrl?: string } | null;
        if (full) {
          name = full.name ?? name;
          imageUrl = full.previewImageUrl ?? full.imageUrl;
        }
      } catch {
        /* ignore IPFS fetch failures */
      }
    }
    const result = { name, imageUrl };
    cache.set(key, result);
    return result;
  } catch {
    const empty = {};
    cache.set(key, empty);
    return empty;
  }
}

export function WalletStatus() {
  const { address, isConnected } = useWallet();
  const [profile, setProfile] = useState<Profile | null>(
    address ? cache.get(address.toLowerCase()) ?? null : null
  );

  useEffect(() => {
    if (!address) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    loadProfile(address).then((p) => !cancelled && setProfile(p));
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!address) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <span className="inline-block size-1.5 rounded-full bg-muted-foreground" aria-hidden />
        Not connected
      </span>
    );
  }

  const name = profile?.name?.trim();
  const initial = (name?.slice(0, 1) || address.slice(2, 3)).toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-1 py-0.5 pr-3 text-xs font-medium transition-colors',
        isConnected
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-border bg-muted text-muted-foreground'
      )}
      title={address}
    >
      {profile?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.imageUrl}
          alt=""
          className="size-6 rounded-full border border-white object-cover"
        />
      ) : (
        <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-rose-200 to-violet-200 text-[10px] font-semibold text-foreground/80">
          {initial}
        </span>
      )}
      <span className="truncate max-w-[140px]">
        {name || shortenAddress(address)}
      </span>
    </span>
  );
}

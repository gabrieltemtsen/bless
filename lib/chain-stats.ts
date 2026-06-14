/**
 * Derived analytics for a blessing chain.
 *
 * Everything here is computed from a `Chain`'s links — no network needed — so
 * the Garden, chain cards, and chain detail page can all show rich stats
 * without extra round-trips. Trust-graph *reach* (how far a chain has spread
 * across distinct Circles avatars) is layered on top of this with a live SDK
 * read; see `lib/circles.ts → getChainReach`.
 */

import type { Chain } from './types';
import { presentValue } from './demurrage';
import { deriveStatus } from './status';

export interface ChainStats {
  /** Number of forwards (links − 1); 0 means a freshly planted seed. */
  hops: number;
  /** Total links including the root. */
  links: number;
  /** Distinct avatars that have touched the chain (senders ∪ recipients). */
  uniqueAvatars: number;
  /** Total CRC moved across every link (nominal, summed). */
  totalCrc: number;
  /** Demurraged present value of the CRC currently held by the last holder. */
  livePresentValue: number;
  /** Nominal CRC sitting with the current holder (last link amount). */
  heldNominal: number;
  /**
   * Momentum — median hours between consecutive forwards. Low = a chain that
   * moves fast; `null` when there haven't been two forwards yet.
   */
  medianForwardHours: number | null;
  /** Hours the chain has been alive (root → now). */
  ageHours: number;
  /** Whether the chain is still within its forward window. */
  isActive: boolean;
  /** Whether the chain has wilted. */
  isWilted: boolean;
}

export function computeChainStats(chain: Chain, now: number = Date.now()): ChainStats {
  const links = chain.links;
  const status = deriveStatus(chain, now);
  const last = links[links.length - 1];

  const avatars = new Set<string>();
  for (const l of links) {
    avatars.add(l.from.toLowerCase());
    avatars.add(l.to.toLowerCase());
  }

  const totalCrc = links.reduce((acc, l) => acc + Number(l.amount), 0);

  // Gaps between successive link creations → momentum.
  const gapsHours: number[] = [];
  for (let i = 1; i < links.length; i++) {
    gapsHours.push((links[i].createdAt - links[i - 1].createdAt) / 3_600_000);
  }
  const medianForwardHours =
    gapsHours.length === 0 ? null : median(gapsHours);

  const heldNominal = Number(last.amount);
  const livePresentValue = presentValue(heldNominal, last.createdAt, now);

  return {
    hops: links.length - 1,
    links: links.length,
    uniqueAvatars: avatars.size,
    totalCrc,
    livePresentValue,
    heldNominal,
    medianForwardHours,
    ageHours: (now - links[0].createdAt) / 3_600_000,
    isActive: status.isActive,
    isWilted: status.isWilted,
  };
}

/** Aggregate stats across the whole Garden — used by the insights bar. */
export interface GardenStats {
  totalChains: number;
  activeChains: number;
  wiltedChains: number;
  totalCrcMoved: number;
  totalLinks: number;
  uniqueAvatars: number;
  /** The chain with the most links, if any. */
  longest: { id: string; title: string; links: number } | null;
}

export function computeGardenStats(chains: Chain[], now: number = Date.now()): GardenStats {
  const avatars = new Set<string>();
  let active = 0;
  let wilted = 0;
  let totalCrc = 0;
  let totalLinks = 0;
  let longest: GardenStats['longest'] = null;

  for (const c of chains) {
    const status = deriveStatus(c, now);
    if (status.isWilted) wilted++;
    else active++;
    totalLinks += c.links.length;
    for (const l of c.links) {
      totalCrc += Number(l.amount);
      avatars.add(l.from.toLowerCase());
      avatars.add(l.to.toLowerCase());
    }
    if (!longest || c.links.length > longest.links) {
      longest = { id: c.id, title: c.title || c.links[0].story, links: c.links.length };
    }
  }

  return {
    totalChains: chains.length,
    activeChains: active,
    wiltedChains: wilted,
    totalCrcMoved: totalCrc,
    totalLinks,
    uniqueAvatars: avatars.size,
    longest,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

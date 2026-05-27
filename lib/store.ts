/**
 * Chain storage adapter.
 *
 * Two implementations:
 *  - In-memory map (default) — perfect for local dev and demos.
 *  - Upstash Redis (when env vars are present) — survives serverless
 *    cold starts on Vercel.
 *
 * The interface is async on both sides so swapping is invisible to callers.
 */

import { Redis } from '@upstash/redis';
import type { Chain, Hex } from './types';
import { FORWARD_WINDOW_MS } from './types';

const memStore: Map<string, Chain> = (globalThis as unknown as {
  __blessMem?: Map<string, Chain>;
}).__blessMem ?? new Map<string, Chain>();
(globalThis as unknown as { __blessMem?: Map<string, Chain> }).__blessMem = memStore;

const redis: Redis | null = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
})();

const KEY_CHAIN = (id: string) => `bless:chain:${id}`;
const KEY_INDEX = 'bless:chains'; // sorted set of chain ids by createdAt
const KEY_INBOX = (addr: string) => `bless:inbox:${addr.toLowerCase()}`;
const KEY_SENT = (addr: string) => `bless:sent:${addr.toLowerCase()}`;

export async function putChain(chain: Chain): Promise<void> {
  const rootTs = chain.links[0]?.createdAt ?? Date.now();
  if (redis) {
    await redis.set(KEY_CHAIN(chain.id), JSON.stringify(chain));
    await redis.zadd(KEY_INDEX, { score: rootTs, member: chain.id });
    for (const link of chain.links) {
      await redis.zadd(KEY_INBOX(link.to), {
        score: link.createdAt,
        member: chain.id,
      });
      await redis.zadd(KEY_SENT(link.from), {
        score: link.createdAt,
        member: chain.id,
      });
    }
  } else {
    memStore.set(chain.id, chain);
  }
}

export async function getChain(id: string): Promise<Chain | null> {
  if (redis) {
    const raw = await redis.get<string | Chain>(KEY_CHAIN(id));
    if (!raw) return null;
    return typeof raw === 'string' ? (JSON.parse(raw) as Chain) : raw;
  }
  return memStore.get(id) ?? null;
}

export async function listRecentChains(limit = 24): Promise<Chain[]> {
  if (redis) {
    // Newest first.
    const ids = (await redis.zrange<string[]>(KEY_INDEX, 0, limit - 1, {
      rev: true,
    })) ?? [];
    const chains: Chain[] = [];
    for (const id of ids) {
      const c = await getChain(id);
      if (c) chains.push(c);
    }
    return chains;
  }
  return Array.from(memStore.values())
    .sort((a, b) => (b.links[0]?.createdAt ?? 0) - (a.links[0]?.createdAt ?? 0))
    .slice(0, limit);
}

/** Chains where `address` is the current holder (= last link's recipient). */
export async function listInbox(address: Hex): Promise<Chain[]> {
  const all = await listRelatedTo(address);
  return all.filter(
    (c) => c.links[c.links.length - 1]?.to.toLowerCase() === address.toLowerCase()
  );
}

/** Chains where `address` ever sent or received a link. */
export async function listRelatedTo(address: Hex): Promise<Chain[]> {
  if (redis) {
    const [inboxIds, sentIds] = await Promise.all([
      redis.zrange<string[]>(KEY_INBOX(address), 0, 99, { rev: true }),
      redis.zrange<string[]>(KEY_SENT(address), 0, 99, { rev: true }),
    ]);
    const ids = new Set<string>([...(inboxIds ?? []), ...(sentIds ?? [])]);
    const chains: Chain[] = [];
    for (const id of ids) {
      const c = await getChain(id);
      if (c) chains.push(c);
    }
    return chains.sort(
      (a, b) =>
        (b.links[b.links.length - 1]?.createdAt ?? 0) -
        (a.links[a.links.length - 1]?.createdAt ?? 0)
    );
  }
  const lower = address.toLowerCase();
  return Array.from(memStore.values())
    .filter((c) =>
      c.links.some(
        (l) => l.from.toLowerCase() === lower || l.to.toLowerCase() === lower
      )
    )
    .sort(
      (a, b) =>
        (b.links[b.links.length - 1]?.createdAt ?? 0) -
        (a.links[a.links.length - 1]?.createdAt ?? 0)
    );
}

/** True if Upstash KV is configured. UI uses this to show a soft warning in dev. */
export const isPersistent = !!redis;

/** Re-export so callers can construct deadlines. */
export { FORWARD_WINDOW_MS };

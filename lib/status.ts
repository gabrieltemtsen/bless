import type { Chain, ChainStatus, ChainWithStatus } from './types';
import { FORWARD_WINDOW_MS } from './types';

export function deriveStatus(chain: Chain, now: number = Date.now()): ChainStatus {
  const last = chain.links[chain.links.length - 1];
  const currentHolder = last.to;
  const forwardDeadline = last.createdAt + FORWARD_WINDOW_MS;
  const isWilted = now > forwardDeadline;
  return {
    currentHolder,
    forwardDeadline,
    isWilted,
    isActive: !isWilted,
  };
}

export function withStatus(chain: Chain, now: number = Date.now()): ChainWithStatus {
  return { ...chain, status: deriveStatus(chain, now) };
}

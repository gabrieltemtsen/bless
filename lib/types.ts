/**
 * Data model for the Bless pay-it-forward chain.
 *
 * A *chain* is a tree of blessings. The root is the original blesser.
 * Each *link* is a forward: someone in the chain sent CRC to someone they
 * trust, along with a story addition. Links form a tree because a single
 * recipient could theoretically split a blessing (v2 feature) — for v1
 * each link has exactly one child.
 *
 * State is stored off-chain; the *txHash* on each link is the verifiable
 * on-chain receipt that the CRC actually moved. We never claim the CRC
 * back — expiry is purely social: a chain that goes 48h without a forward
 * is rendered as "wilted" in the UI, the holder keeps the CRC, and the
 * shame of breaking a chain is the only enforcement.
 */

export type Hex = `0x${string}`;

export interface ChainLink {
  /** Sequential index within the chain (0 = root blessing). */
  index: number;
  /** Who sent this link. */
  from: Hex;
  /** Who received it — becomes the current holder until they forward. */
  to: Hex;
  /** CRC amount (human-readable string, e.g. "5"). */
  amount: string;
  /** The story the sender wrote when creating this link. */
  story: string;
  /** Tx hash of the on-chain ERC1155 safeTransferFrom (Hub v2). */
  txHash: Hex;
  /** ms since epoch when this link was forged. */
  createdAt: number;
}

export interface Chain {
  /** Short slug used in URLs (e.g. "k7p2qm"). */
  id: string;
  /** Title — defaults to first link's story snippet but blesser can override. */
  title: string;
  /** All links in order. links[0] is the root, last is the most recent forward. */
  links: ChainLink[];
}

/** Derived state. Computed at read time so we always see fresh status. */
export interface ChainStatus {
  /** Whoever currently holds the blessing. */
  currentHolder: Hex;
  /** ms-since-epoch deadline by which currentHolder must forward. */
  forwardDeadline: number;
  /** True if currentHolder missed the 48h window. */
  isWilted: boolean;
  /** Whether the chain is still actively growing. */
  isActive: boolean;
}

export interface ChainWithStatus extends Chain {
  status: ChainStatus;
}

/** What the client POSTs to /api/chains to start a new blessing. */
export interface StartChainBody {
  to: Hex;
  amount: string;
  story: string;
  title?: string;
  txHash: Hex;
  /** Sender signs `start:{to}:{amount}:{txHash}` with miniapp-sdk signMessage. */
  signature: string;
  /** The exact message that was signed (so server can verify). */
  signedMessage: string;
  /** Sender address (must match signer). */
  from: Hex;
}

/** What the client POSTs to /api/chains/{id}/forward. */
export interface ForwardChainBody {
  to: Hex;
  amount: string;
  story: string;
  txHash: Hex;
  signature: string;
  signedMessage: string;
  from: Hex;
}

/** Forward-window in milliseconds. */
export const FORWARD_WINDOW_MS = 48 * 60 * 60 * 1000;

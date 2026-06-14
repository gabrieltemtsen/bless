/**
 * Circles protocol helpers — built around Hub v2 on Gnosis Chain.
 *
 * For writes from inside the Circles host iframe we never instantiate a
 * signer ourselves; instead we *encode* the calldata here and let the
 * miniapp-sdk's `sendTransactions()` route it through the host's Safe.
 *
 * For reads we use a plain viem public client against the Gnosis RPC.
 */

import {
  createPublicClient,
  encodeFunctionData,
  http,
  isAddress,
  parseUnits,
  type Address,
  type Hex,
} from 'viem';
import { gnosis } from 'viem/chains';
import { TransferBuilder } from '@aboutcircles/sdk-transfers';
import { circlesConfig } from '@aboutcircles/sdk-utils';

/** Hub v2 contract, the ERC1155 that holds every personal CRC token. */
export const HUB_V2_ADDRESS: Address =
  '0xc12C1E50ABB450d6205Ea2C3Fa861b3B834d13e8';

/** CRC has 18 decimals. */
export const CRC_DECIMALS = 18;

/** Read-only viem client pointed at Gnosis Chain. */
export const publicClient = createPublicClient({
  chain: gnosis,
  transport: http('https://rpc.gnosischain.com'),
});

/**
 * The ERC1155 token id of an avatar's personal CRC is the avatar address
 * cast to uint256 (i.e. its 20 bytes left-padded into 32).
 */
export function addressToTokenId(address: Address): bigint {
  return BigInt(address);
}

/** Minimal Hub v2 ABI fragment — only what this app actually calls. */
const HUB_V2_ABI = [
  {
    type: 'function',
    name: 'safeTransferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'isTrusted',
    stateMutability: 'view',
    inputs: [
      { name: 'truster', type: 'address' },
      { name: 'trustee', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'trust',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_trustReceiver', type: 'address' },
      { name: '_expiry', type: 'uint96' },
    ],
    outputs: [],
  },
] as const;

/**
 * Hub v2 `trust(address, uint96 expiry)` interprets `expiry` as a unix
 * timestamp (seconds). `uint96.max` is the largest legal value and lands
 * roughly in the year 2.5 quintillion CE — i.e. forever. We use it as
 * the "indefinite trust" sentinel.
 */
export const INDEFINITE_TRUST_EXPIRY: bigint = (1n << 96n) - 1n;

/**
 * Build the calldata for trusting `receiver` indefinitely — handed to the
 * Circles host's `sendTransactions()` to be routed through the user's Safe.
 */
export function buildTrustTx(args: {
  trustReceiver: Address;
  expiry?: bigint;
}): { to: Address; data: Hex; value: string } {
  const expiry = args.expiry ?? INDEFINITE_TRUST_EXPIRY;
  const data = encodeFunctionData({
    abi: HUB_V2_ABI,
    functionName: 'trust',
    args: [args.trustReceiver, expiry],
  });
  return { to: HUB_V2_ADDRESS, data, value: '0' };
}

/**
 * Build the calldata for transferring `amount` CRC of `from`'s personal
 * token to `to`, ready to hand to `sendTransactions()`.
 *
 * NOTE: This is the *strict* path — it requires the sender to hold their
 * own personal CRC and the recipient to have trusted the sender. Prefer
 * `buildPathTransferTxs` for the user-friendly version that routes through
 * the trust graph using whatever CRC the sender happens to hold.
 */
export function buildBlessingTx(args: {
  from: Address;
  to: Address;
  amount: string | number; // human units (e.g. "5" CRC)
}): { to: Address; data: Hex; value: string } {
  const amountWei = parseUnits(String(args.amount), CRC_DECIMALS);
  const tokenId = addressToTokenId(args.from);
  const data = encodeFunctionData({
    abi: HUB_V2_ABI,
    functionName: 'safeTransferFrom',
    args: [args.from, args.to, tokenId, amountWei, '0x'],
  });
  return { to: HUB_V2_ADDRESS, data, value: '0' };
}

/**
 * Lazy singleton — the SDK's TransferBuilder needs the Circles chain config
 * (RPC URL, contract addresses) to talk to the pathfinder and encode flow
 * matrices. We only need one per session.
 */
const GNOSIS_CHAIN_ID = 100;
let _transferBuilder: TransferBuilder | null = null;
function getTransferBuilder(): TransferBuilder {
  if (!_transferBuilder) {
    _transferBuilder = new TransferBuilder(circlesConfig[GNOSIS_CHAIN_ID]);
  }
  return _transferBuilder;
}

/**
 * Build a *path-based* CRC transfer using the Circles trust graph.
 *
 * Why this exists: a direct `safeTransferFrom` of the sender's personal
 * token only works if (a) the sender has minted their own CRC recently and
 * (b) the recipient has trusted them. Most real Circles balances are made
 * up of *other people's* personal tokens received through trust hops —
 * those are economically equivalent to your own CRC but ignored by a
 * strict transfer.
 *
 * `operateFlowMatrix` (Hub v2) lets us hand the Hub a pre-computed flow
 * across the trust graph: "use 2 CRC of Alice's token I hold, push it to
 * Bob who trusts Alice, etc." The pathfinder service computes the matrix;
 * the SDK's TransferBuilder turns it into calldata. The result is one or
 * more transactions (it may also include unwrap/wrap steps for ERC-20
 * wrapped CRC the user happens to hold) that we hand to the host's Safe.
 *
 * Returns an array — every entry must be sent in order via `sendTransactions`.
 */
export async function buildPathTransferTxs(args: {
  from: Address;
  to: Address;
  amount: string | number;
}): Promise<Array<{ to: Address; data: Hex; value: string }>> {
  const amountWei = parseUnits(String(args.amount), CRC_DECIMALS);
  const builder = getTransferBuilder();
  const txs = await builder.constructAdvancedTransfer(
    args.from,
    args.to,
    amountWei
  );
  // The miniapp host's sendTransactions expects `value` as a string; the
  // SDK returns bigint. Map across the array preserving the rest verbatim.
  return txs.map((t) => ({
    to: t.to,
    data: t.data,
    value: t.value.toString(),
  }));
}

/**
 * Pre-flight: can we currently push `amount` CRC from `from` to `to`
 * through the trust graph? We answer by *building* the transaction (which
 * runs pathfinding + flow matrix construction) and reporting whether it
 * succeeded. The built txs are returned too, so the caller can reuse them
 * instead of re-running the pathfinder.
 *
 * Returns `{ ok: false, reason }` when no path exists or pathfinding caps
 * below the requested amount — both surface as throws from the SDK and we
 * can't easily distinguish without parsing the error string, so we just
 * report the message.
 */
export async function tryBuildPathTransfer(args: {
  from: Address;
  to: Address;
  amount: string | number;
}): Promise<
  | { ok: true; txs: Array<{ to: Address; data: Hex; value: string }> }
  | { ok: false; reason: string }
> {
  try {
    const txs = await buildPathTransferTxs(args);
    return { ok: true, txs };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

/** True if `truster` has trusted `trustee` in the Circles v2 trust graph. */
export async function isTrusted(truster: Address, trustee: Address): Promise<boolean> {
  if (!isAddress(truster) || !isAddress(trustee)) return false;
  try {
    return (await publicClient.readContract({
      address: HUB_V2_ADDRESS,
      abi: HUB_V2_ABI,
      functionName: 'isTrusted',
      args: [truster, trustee],
    })) as boolean;
  } catch {
    return false;
  }
}

/**
 * Asks the question that actually matters for *sending* CRC: does
 * `recipient` trust `sender`? In Circles v2 a direct ERC-1155 transfer of
 * `sender`'s personal CRC is rejected by the Hub unless the recipient has
 * trusted the sender — trust direction is "I'll accept your CRC".
 */
export function isTrustedBy(sender: Address, recipient: Address): Promise<boolean> {
  return isTrusted(recipient, sender);
}

/**
 * Pre-flight balance check — true if `holder` owns at least `amount` CRC of
 * `tokenIssuer`'s personal token. Pass `tokenIssuer = holder` to ask about
 * your own personal CRC balance.
 */
export async function hasCrcBalance(
  holder: Address,
  tokenIssuer: Address,
  amount: string | number
): Promise<{ ok: boolean; balanceWei: bigint; neededWei: bigint }> {
  const neededWei = parseUnits(String(amount), CRC_DECIMALS);
  try {
    const balanceWei = (await publicClient.readContract({
      address: HUB_V2_ADDRESS,
      abi: HUB_V2_ABI,
      functionName: 'balanceOf',
      args: [holder, addressToTokenId(tokenIssuer)],
    })) as bigint;
    return { ok: balanceWei >= neededWei, balanceWei, neededWei };
  } catch {
    return { ok: false, balanceWei: 0n, neededWei };
  }
}

/** Verify an EIP-1271 signature against a Safe — used to authenticate API writes. */
export async function verifyHostSignature(args: {
  signer: Address;
  message: string;
  signature: Hex;
}): Promise<boolean> {
  try {
    return await publicClient.verifyMessage({
      address: args.signer,
      message: args.message,
      signature: args.signature,
    });
  } catch {
    return false;
  }
}

/** Sanity-check a tx hash before we trust it. */
export function isTxHash(value: string): value is Hex {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

// ─── Diagnostics ────────────────────────────────────────────────────────────
//
// When a blessing fails, "I have CRC, why can't I send it?" can mean at
// least four very different things in Circles v2. These helpers answer the
// question without guessing.
//
//   1. The user is registered in v1 only, or holds v1 CRC that has never
//      been migrated. v1 CRC is a separate ERC-20 per user and the Hub v2
//      pathfinder will not see it.
//   2. The user is registered in v2 but holds zero of any v2 token a path
//      to the recipient can use. Trust graph is the blocker.
//   3. The recipient is not a registered v2 avatar at all — there is no
//      receiving end on the Hub.
//   4. The user holds wrapped ERC-20 CRC that needs an unwrap step. The
//      SDK handles this when it knows about the wrapped balance.
//
// We surface a structured object so the UI (and our logs) can tell the
// user *which* case they're in rather than dumping the raw pathfinder
// error.

/**
 * Minimal v1 Hub ABI — just enough to look up a user's v1 token contract.
 * V1 Hub on Gnosis: 0x29b9a7fBb8995b2423a71cC17cf9810798F6C543
 */
const V1_HUB_ADDRESS: Address = '0x29b9a7fBb8995b2423a71cC17cf9810798F6C543';
const V1_HUB_ABI = [
  {
    type: 'function',
    name: 'userToToken',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;
const ERC20_BALANCE_OF_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface SenderDiagnosis {
  /** Is the sender registered as a v2 avatar (human/group/org)? */
  isV2Registered: boolean;
  /** Type of v2 registration, if any. */
  v2Type?: string;
  /** Wei of the sender's own personal v2 CRC token. */
  ownPersonalV2Wei: bigint;
  /**
   * Wei of v1 CRC the sender holds in their own v1 token, if v1 is set up.
   * `null` when there's no v1 token configured for this address.
   */
  v1BalanceWei: bigint | null;
  /** v1 personal token address if one exists. */
  v1Token?: Address;
  /**
   * Counts from the trust graph aggregation:
   *   - trustsCount: avatars the sender trusts (incoming-flow potential)
   *   - trustedByCount: avatars that trust the sender (outgoing-flow potential)
   *   - mutuallyTrustsCount: both directions
   */
  trustsCount: number;
  trustedByCount: number;
  mutuallyTrustsCount: number;
}

/**
 * Inspect the sender's Circles state to figure out which failure mode
 * they're in. All fields default to safe values on RPC errors so a partial
 * failure doesn't crash the UI.
 */
export async function diagnoseSender(address: Address): Promise<SenderDiagnosis> {
  const out: SenderDiagnosis = {
    isV2Registered: false,
    ownPersonalV2Wei: 0n,
    v1BalanceWei: null,
    trustsCount: 0,
    trustedByCount: 0,
    mutuallyTrustsCount: 0,
  };

  // V2 registration + balance + trust aggregation all live in the Circles SDK's
  // off-chain indexer. We use the no-runner Sdk for reads.
  try {
    const { Sdk } = await import('@aboutcircles/sdk');
    const sdk = new Sdk();
    const avatar = await sdk.getAvatar(address).catch(() => null);
    if (avatar && avatar.avatarInfo) {
      out.isV2Registered = avatar.avatarInfo.version === 2;
      out.v2Type = avatar.avatarInfo.type;
    }
    // Trust aggregation works even if avatar isn't fully resolved.
    const rel = await sdk.rpc.trust.getAggregatedTrustRelations(address).catch(() => []);
    for (const r of rel ?? []) {
      if (r.relation === 'trusts') out.trustsCount++;
      else if (r.relation === 'trustedBy') out.trustedByCount++;
      else if (r.relation === 'mutuallyTrusts') out.mutuallyTrustsCount++;
    }
  } catch {
    // Indexer-side failure — leave the v2 fields at their defaults.
  }

  // Personal v2 token balance — direct Hub call, doesn't depend on indexer.
  try {
    out.ownPersonalV2Wei = (await publicClient.readContract({
      address: HUB_V2_ADDRESS,
      abi: HUB_V2_ABI,
      functionName: 'balanceOf',
      args: [address, addressToTokenId(address)],
    })) as bigint;
  } catch {
    /* keep 0n */
  }

  // V1 CRC — look up the user's v1 token contract via v1 Hub, then ERC-20
  // balanceOf on that token. If they never signed up to v1, userToToken
  // returns address(0) and we leave v1BalanceWei as null to mark "n/a".
  try {
    const v1Token = (await publicClient.readContract({
      address: V1_HUB_ADDRESS,
      abi: V1_HUB_ABI,
      functionName: 'userToToken',
      args: [address],
    })) as Address;
    if (v1Token && v1Token !== '0x0000000000000000000000000000000000000000') {
      out.v1Token = v1Token;
      const v1Balance = (await publicClient.readContract({
        address: v1Token,
        abi: ERC20_BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [address],
      })) as bigint;
      out.v1BalanceWei = v1Balance;
    }
  } catch {
    /* leave v1BalanceWei null */
  }

  return out;
}

export interface ReachabilityDiagnosis {
  /** Is the recipient a registered v2 avatar that can receive CRC? */
  recipientIsV2Registered: boolean;
  /** Pathfinder verdict — true iff a flow of at least `amount` exists. */
  reachable: boolean;
  /** Raw error from pathfinder when not reachable; useful in logs. */
  reason?: string;
}

/**
 * Ask the trust graph: can the sender currently push `amount` CRC to the
 * recipient? Combines an avatar-registration check (cheap, definitive) with
 * a pathfinder build attempt (the only way to truly know).
 */
export async function diagnoseReachability(
  sender: Address,
  recipient: Address,
  amount: string | number
): Promise<ReachabilityDiagnosis> {
  let recipientIsV2Registered = false;
  try {
    const { Sdk } = await import('@aboutcircles/sdk');
    const sdk = new Sdk();
    const avatar = await sdk.getAvatar(recipient).catch(() => null);
    recipientIsV2Registered = !!avatar?.avatarInfo && avatar.avatarInfo.version === 2;
  } catch {
    /* leave false */
  }

  const built = await tryBuildPathTransfer({ from: sender, to: recipient, amount });
  if (built.ok) {
    return { recipientIsV2Registered, reachable: true };
  }
  return {
    recipientIsV2Registered,
    reachable: false,
    reason: built.reason,
  };
}

/**
 * Turn a sender + reachability diagnosis into a human-readable explanation
 * naming the specific failure mode. Used both as an error message and as
 * the basis for a "what to do next" UI hint.
 */
export function explainBlessingFailure(
  sender: SenderDiagnosis,
  reach: ReachabilityDiagnosis,
  amountCrc: string | number
): string {
  if (!sender.isV2Registered) {
    if ((sender.v1BalanceWei ?? 0n) > 0n) {
      return (
        'Your account is registered in Circles v1 but not v2. The CRC you ' +
        'hold lives on v1 and can\'t be spent through the Hub v2 trust graph ' +
        'until you migrate. Open the Circles app and complete the v2 ' +
        'migration, then try again.'
      );
    }
    return (
      'Your address is not registered as a Circles v2 avatar yet. Open the ' +
      'Circles app and complete the signup before sending blessings.'
    );
  }

  if (!reach.recipientIsV2Registered) {
    return (
      'The recipient is not registered as a Circles v2 avatar, so the Hub ' +
      'has nowhere to deliver the CRC. Ask them to sign up in the Circles ' +
      'app first.'
    );
  }

  if (!reach.reachable) {
    const v1Hint =
      (sender.v1BalanceWei ?? 0n) > 0n
        ? ' You also have ' +
          (Number(sender.v1BalanceWei) / 1e18).toFixed(2) +
          ' CRC in v1 that is not usable here until migrated.'
        : '';
    return (
      'No route through the Circles trust graph reaches this recipient ' +
      'from any v2 CRC you currently hold (' +
      amountCrc +
      ' CRC requested). Either the recipient (or someone they trust) needs ' +
      'to trust an issuer of CRC in your wallet, or you need a bit of CRC ' +
      'from someone they already trust.' +
      v1Hint
    );
  }

  // Reachable + both registered — this code path should not normally hit;
  // surface the raw reason just in case the SDK errored after preflight.
  return reach.reason ?? 'Unknown blessing failure.';
}

// ─── Trust-graph reach ──────────────────────────────────────────────────────
//
// A blessing chain lives *on* the Circles trust graph, so a natural measure of
// how far it has spread is graph-shaped, not just "how many links." These
// helpers use the Circles SDK's aggregated trust relations
// (`getAggregatedTrustRelations`) — the same indexed view the Circles app uses
// — to answer two questions:
//
//   • Frontier: how many distinct avatars trust at least one participant, i.e.
//     how many people the chain could be forwarded to *next*.
//   • Cohesion: how many of the chain's own participants mutually trust each
//     other, i.e. how tightly knit the lineage already is.
//
// Docs: https://docs.aboutcircles.com → SDK → "Trust relations".

export interface ChainReach {
  /** Distinct chain participants we resolved trust data for. */
  participants: number;
  /**
   * Size of the union of everyone who trusts at least one participant
   * (excluding participants themselves) — the chain's spreadable frontier.
   */
  frontier: number;
  /** Trust edges among the participants themselves (cohesion). */
  internalTrustEdges: number;
  /** True when at least one SDK read succeeded (so the UI can show "—" else). */
  resolved: boolean;
}

interface AggregatedRelation {
  objectAvatar?: string;
  relation?: string;
}

/**
 * Compute the trust-graph reach of a set of chain participants.
 *
 * Resilient by design: each per-avatar SDK read is wrapped, so a single
 * indexer hiccup degrades the number rather than throwing. Runs the lookups
 * concurrently.
 */
export async function getChainReach(addresses: Address[]): Promise<ChainReach> {
  const participants = Array.from(
    new Set(addresses.map((a) => a.toLowerCase()))
  ) as Address[];
  const participantSet = new Set<string>(participants);

  const out: ChainReach = {
    participants: participants.length,
    frontier: 0,
    internalTrustEdges: 0,
    resolved: false,
  };
  if (participants.length === 0) return out;

  try {
    const { Sdk } = await import('@aboutcircles/sdk');
    const sdk = new Sdk();

    const frontier = new Set<string>();
    const results = await Promise.all(
      participants.map((addr) =>
        sdk.rpc.trust
          .getAggregatedTrustRelations(addr)
          .then((rels: AggregatedRelation[]) => ({ addr, rels: rels ?? [] }))
          .catch(() => ({ addr, rels: [] as AggregatedRelation[] }))
      )
    );

    let anyOk = false;
    for (const { addr, rels } of results) {
      if (rels.length > 0) anyOk = true;
      for (const r of rels) {
        const other = r.objectAvatar?.toLowerCase();
        if (!other) continue;
        // Someone who trusts this participant (could receive a forward).
        const trustsParticipant =
          r.relation === 'trustedBy' || r.relation === 'mutuallyTrusts';
        if (trustsParticipant && !participantSet.has(other)) {
          frontier.add(other);
        }
        // Edge between two people already in the chain.
        if (
          r.relation === 'mutuallyTrusts' &&
          participantSet.has(other) &&
          other > addr.toLowerCase() // count each undirected edge once
        ) {
          out.internalTrustEdges++;
        }
      }
    }

    out.frontier = frontier.size;
    out.resolved = anyOk;
  } catch {
    /* leave defaults; resolved stays false */
  }

  return out;
}

/**
 * Read the demurraged ("inflationary"→"static") present value of an avatar's
 * total CRC holdings via the SDK's balance view. Returned in human CRC units.
 * Falls back to `null` if the indexer can't be reached so callers can hide the
 * figure rather than show a wrong zero.
 */
export async function getTotalCrcBalance(address: Address): Promise<number | null> {
  if (!isAddress(address)) return null;
  try {
    const { Sdk } = await import('@aboutcircles/sdk');
    const sdk = new Sdk();
    const avatar = await sdk.getAvatar(address).catch(() => null);
    if (!avatar) return null;
    // `getTotalBalance` returns demurraged CRC (the figure the Circles wallet
    // shows). Different SDK minors expose it on the avatar or the rpc balance
    // module, so we try both.
    const maybe = avatar as unknown as {
      getTotalBalance?: () => Promise<number | string>;
    };
    if (typeof maybe.getTotalBalance === 'function') {
      const bal = await maybe.getTotalBalance();
      const n = typeof bal === 'string' ? Number(bal) : bal;
      return Number.isFinite(n) ? n : null;
    }
    return null;
  } catch {
    return null;
  }
}

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
] as const;

/**
 * Build the calldata for transferring `amount` CRC of `from`'s personal
 * token to `to`, ready to hand to `sendTransactions()`.
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

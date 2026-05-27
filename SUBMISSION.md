# Bless — garage submission copy

Drop these into the registration form at <https://garage.aboutcircles.com/register>.

## Name

Bless

## One-line pitch (≤140 chars)

A pay-it-forward CRC chain: pass a small blessing and a story to someone you trust within 48 hours — or the chain wilts.

## Longer pitch (≤500 chars)

Bless turns the Circles trust graph into a living record of small
kindnesses. You send a few CRC and one sentence to someone you trust.
They have 48 hours to add their own sentence and forward it to someone
*they* trust. Otherwise the chain wilts publicly. Every link is a real
ERC-1155 transfer on Hub v2; every story is rendered as a lineage tree.
Built with `@aboutcircles/miniapp-sdk` (host bridge) and
`@aboutcircles/sdk` (trust graph, profiles).

## Live URL

`https://<your-vercel-deploy>.vercel.app`

## Repo

`https://github.com/<you>/bless`

## What Circles primitives does this use?

- **Trust graph** — recipient picker queries `getAggregatedTrustRelations`
  and only lists addresses the sender already trusts. Custom addresses
  trigger an `isTrusted()` check and a visible warning when they're not.
- **Personal CRC** — every forward is an actual
  `Hub_v2.safeTransferFrom(sender, recipient, uint256(sender), amount, '0x')`,
  routed through the host's Safe via `sendTransactions()`.
- **EIP-1271 attestations** — every API write is gated by a host
  `signMessage()` call referencing the txHash + recipient + chainId,
  re-verified server-side with viem `publicClient.verifyMessage`.

## What's unique?

The 48-hour wilt-or-forward window turns a normal token transfer into a
social ritual. No escrow, no clawback — the CRC genuinely stays with
whoever held it last. The mechanism is purely the public record of broken
chains, which is exactly the kind of soft accountability the Circles
trust graph was built for.

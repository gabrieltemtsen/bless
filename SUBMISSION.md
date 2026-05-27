# Bless — garage submission copy

Drop these into the registration form at <https://garage.aboutcircles.com/register>.

## Name

Bless

## One-line pitch (≤140 chars)

Bless turns Circles trust into appreciation you can send. CRC + a sentence — for gratitude, a task done, a kindness. Chains grow for 48h.

## Longer pitch (≤500 chars)

Bless makes the Circles trust graph spendable as kindness. Send a few CRC
+ one sentence to someone who's trusted you on Circles — for gratitude,
a favour returned, a task done, a gift. If they bless someone back along
the chain within 48h, the chain grows into a public lineage of stories.
If not, your thanks stands on its own. Every link is a real ERC-1155
transfer on Hub v2. Built with `@aboutcircles/miniapp-sdk` (host bridge)
and `@aboutcircles/sdk` (trust graph, profiles).

## Live URL

`https://<your-vercel-deploy>.vercel.app`

## Repo

`https://github.com/<you>/bless`

## What Circles primitives does this use?

- **Trust graph** — Hub v2's acceptance rule is "I'll accept your CRC iff
  I've trusted you", so the recipient picker queries
  `getAggregatedTrustRelations` and filters for `trustedBy` +
  `mutuallyTrusts` — i.e. people who've trusted the sender. Custom paste
  addresses trigger an `isTrusted(recipient, sender)` check and a visible
  warning when they'll revert. Plus a one-tap **Trust gabriel** pill in
  the header so any visitor can extend the maker's circle.
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

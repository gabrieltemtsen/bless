# Bless — garage submission

**Name**
Bless

**Live**
https://bless-crc.vercel.app/

**Repo**
https://github.com/gabrieltemtsen/bless

## Pitch (short)

Bless turns Circles trust into appreciation you can send. CRC + one sentence to someone who's trusted you. For gratitude, a task done, a kindness, a gift. If they bless someone back within 48 hours, the chain grows.

## Pitch (longer)

Trust on Circles is the most underused thing on the protocol. It's already a real list of people who've vouched for each other. I built Bless to use that list for something humans actually want, which is saying thanks.

You send a small CRC blessing and one sentence to someone who's trusted you. They've got 48 hours to bless someone back along the chain. If they do, it grows into a public lineage of stories in the Garden. If they don't, it stops with them. Either way, no clawbacks, no shame. Every transfer is a real ERC-1155 `safeTransferFrom` on Hub v2 with a Gnosisscan link on every link, and the stories live off-chain so they stay easy to read.

People use it for whatever moves them. Gratitude. A favour returned. A small task done. A birthday gift. An apology. Pay-it-forward chains for the days you feel like it.

## Why it's a Circles app and not just any CRC app

A direct ERC-1155 transfer on Hub v2 reverts unless the recipient has already trusted the sender. Most apps would see that as a constraint to route around. Bless treats it as the point.

The recipient picker only surfaces people who've trusted you, pulled from the live trust graph. Custom paste addresses trigger an `isTrusted(recipient, sender)` check and a visible warning when they'd revert. There's a one-tap Trust pill in the header so visitors can grow the maker's circle from inside the app. The 48 hour forward window turns the transfer into a small social ritual.

## Stack

Next.js 15, React 19, TypeScript. `@aboutcircles/miniapp-sdk` handles the wallet bridge (`onWalletChange`, `signMessage`, `sendTransactions`). `@aboutcircles/sdk` covers profile lookups and trust graph reads. viem encodes the Hub v2 calldata and verifies the EIP-1271 signatures that gate every API write so signatures can't be replayed. Upstash Redis for chain persistence in production, with an in-memory fallback for local dev.

## Testing it

Open https://bless-crc.vercel.app/ in any browser. The Garden is fully browsable without a wallet, so you can read every chain and click through to its lineage tree. To actually send or forward, tap **Open in Circles host** at the top of the page to launch the playground with Bless pre-loaded.

If you haven't trusted me yet, the Trust pill in the header does it in one tap. Ping me after and I'll send a starter blessing so you can try forwarding it.

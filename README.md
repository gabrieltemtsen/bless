# Bless — pay-it-forward on Circles

> A blessing is a story that must keep walking.

**Bless** is a [Circles](https://aboutcircles.com) embedded mini-app for
**pay-it-forward CRC chains.** Send a few CRC and one true sentence to
someone you trust. They get 48 hours to add their own sentence and
forward it to someone *they* trust. If they let it sit, the chain
**wilts** — they keep the CRC, but the chain stops growing here, and
everyone in the Garden sees where it died.

It's a tiny mechanism for turning the Circles trust graph into a living
record of small kindnesses — and a quiet bit of social pressure to keep
them moving.

---

## Why Circles

Bless leans on the three primitives Circles is built around:

- **Trust graph as the spreading medium.** Hub v2's acceptance rule is
  "I'll accept your CRC iff I've trusted you" — so the recipient picker
  surfaces avatars that have trusted *you*, the sender. Anything else and
  the Hub will revert the transfer at simulation, which we also pre-flight
  on the client with `isTrusted(recipient, sender)` before ever asking the
  host to sign.
- **Personal CRC as the carrier.** Each forward is a real ERC-1155
  `safeTransferFrom` on the Circles Hub v2 (`0xc12C…d13e8`) — the sender's
  own personal token, identified by `uint256(senderAddress)`.
- **Demurrage as the urgency.** CRC decays by 7 %/year. Letting a blessing
  sit doesn't just break the chain socially — it literally loses value.

Story metadata (the actual sentences, the chain's title, the lineage)
lives off-chain in a tiny KV. The on-chain tx hash on every link is the
verifiable receipt; the off-chain story is the soul.

---

## How a chain flows

1. **Plant.** Open `/bless`, pick a trusted recipient, write one sentence,
   send a small amount of CRC. We submit one batched tx through the host's
   Safe via `sendTransactions()`, then your wallet signs the off-chain
   attestation that records the link.
2. **Hold.** The recipient now has 48 hours. The Garden page shows their
   blessing as **active** with a live countdown pill.
3. **Forward.** They open `/forward/<chainId>`, add their own sentence,
   and pass the same (or larger) amount to someone *they* trust. The chain
   grows by one link.
4. **Or wilt.** If 48 hours pass without a forward, the chain freezes.
   The CRC stays with whoever held it last — there's no escrow. The chain
   is rendered wilted in the Garden and on its detail page forever.

---

## Tech

| Layer | Used |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Wallet bridge | [`@aboutcircles/miniapp-sdk`](https://www.npmjs.com/package/@aboutcircles/miniapp-sdk) — `onWalletChange`, `signMessage`, `sendTransactions` |
| Circles data | [`@aboutcircles/sdk`](https://www.npmjs.com/package/@aboutcircles/sdk) — `getProfileView`, `getProfileByCid`, `getAggregatedTrustRelations` |
| Calldata | [viem](https://viem.sh) — `encodeFunctionData` for Hub v2 `safeTransferFrom`, EIP-1271 verification via `publicClient.verifyMessage` |
| Persistence | In-memory by default, **Upstash Redis** when env vars are set |
| Styling | Tailwind v4, shadcn-style hand-rolled primitives, Radix `Label` + `Separator` for accessibility |
| Icons | lucide-react |

### Files worth knowing

- `lib/circles.ts` — Hub v2 address, ABI fragment, `buildBlessingTx()`,
  `isTrusted()`, `verifyHostSignature()`.
- `lib/store.ts` — Tiny KV adapter with memory + Upstash backends; no
  schema migrations to write.
- `components/bless/RecipientPicker.tsx` — fetches your *incoming* trust
  list from the Circles SDK (the people who'll actually accept your CRC),
  lets you paste arbitrary addresses but warns visibly when they haven't
  trusted you yet.
- `components/bless/BlessingComposer.tsx` — the one form used by both
  starting a chain and forwarding one. Pre-flights two RPC reads
  (`isTrusted(recipient, sender)` and `balanceOf(sender, sender'sTokenId)`)
  to catch the two most common revert causes before the host sees them,
  then submits the on-chain tx, signs an attestation, and POSTs to our API.
- `app/api/chains/.../route.ts` — REST endpoints; every write is gated by
  an EIP-1271 host signature that references both the txHash and the
  recipient, so a leaked signature can't be replayed against anything else.

---

## Run it locally

```bash
pnpm install     # or npm install
pnpm dev
```

Open <http://localhost:3000>. Standalone, the wallet stays disconnected —
that's expected. To exercise the host bridge:

1. `pnpm build && pnpm start` (or deploy preview).
2. Open <https://circles.gnosis.io/playground?url=YOUR_URL>.
3. The badge in the header flips to your Circles avatar's short address;
   the composer's send button comes alive.

### Optional: persistent storage

Without any env vars, chains live in process memory — perfect for
demoing locally, but each Vercel cold start resets the Garden. Hook up
a free Upstash Redis (5 minutes, no card) for permanence:

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Add the same two to your Vercel project. Done.

---

## Deploy

```bash
vercel
```

The `next.config.ts` already sets
`Content-Security-Policy: frame-ancestors 'self' https://*.gnosis.io
https://*.vercel.app` so the Circles host can iframe you. If you deploy
to a custom domain, add it to that list.

### List in the Circles marketplace (optional)

Open a PR against
[`aboutcircles/CirclesMiniapps`](https://github.com/aboutcircles/CirclesMiniapps)
adding an entry to `static/miniapps.json`:

```json
{
  "slug": "bless",
  "name": "Bless",
  "url": "https://bless.your-domain.com/",
  "logo": "https://bless.your-domain.com/icon.svg",
  "description": "Pay-it-forward CRC blessings — 48h to pass the chain on, or it wilts.",
  "tags": ["social", "trust-graph"],
  "isHidden": false
}
```

---

## Roadmap (post-MVP)

- **On-chain registry contract** that emits `BlessingStarted` /
  `BlessingForwarded` events, so the story metadata is fully reconstructible
  without trusting our KV.
- **Pathfinder forwarding** — use Circles' transitive payment paths so a
  chain can travel through people who don't directly trust each other.
- **Group blessings** — wire `@aboutcircles/sdk` group primitives so a
  whole group can chip in to seed a chain.
- **Wilting hospice** — when a chain expires, give the holder a one-tap
  option to donate the CRC to a Circles-backed mutual-aid group.
- **Stories explorer** — a `?tag=` index that lets the community surface
  themes (gratitude, grief, joy, repair).

---

## Credit

Built for [garage.aboutcircles.com](https://garage.aboutcircles.com).
Boilerplate inspiration: `aboutcircles/embedded-miniapp-boilerplate`.

License: MIT.

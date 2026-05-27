'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RecipientPicker } from '@/components/bless/RecipientPicker';
import { useWallet } from '@/hooks/use-wallet';
import { buildBlessingTx, hasCrcBalance, isTrustedBy } from '@/lib/circles';
import { formatCrc } from '@/lib/format';

type Hex = `0x${string}`;

type Mode =
  | { kind: 'start' }
  | { kind: 'forward'; chainId: string };

type Status =
  | { kind: 'idle' }
  | { kind: 'preflight' }
  | { kind: 'signing' }
  | { kind: 'sending' }
  | { kind: 'recording' }
  | { kind: 'done'; chainId: string }
  | { kind: 'error'; error: string };

const BLOCK_EXPLORER = 'https://gnosisscan.io';

/**
 * Friendlier explanations for the most common host-side reverts. We can't
 * decode every selector, but we can guide the user toward the fix.
 */
function explainSendError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('useroperation reverted') || lower.includes('execution reverted')) {
    return (
      'The Circles Hub refused this transfer. The most likely cause is ' +
      'that the recipient hasn’t trusted you yet, or your account hasn’t ' +
      'minted any personal CRC. Both are easy fixes — open the Circles ' +
      'app, ask your recipient to trust your address, and mint your daily ' +
      'CRC if you haven’t.'
    );
  }
  if (lower.includes('user rejected') || lower.includes('rejected')) {
    return 'You declined the signature in the Circles host. Try again when ready.';
  }
  return raw;
}

interface BlessKind {
  emoji: string;
  label: string;
  prompt: string;
}

/**
 * Category presets — taps fill the story field with a starter line.
 * Each one is a real thing humans say to each other; trust just makes
 * it spendable.
 */
const BLESS_KINDS: BlessKind[] = [
  {
    emoji: '🙏',
    label: 'Gratitude',
    prompt: 'Thank you for ',
  },
  {
    emoji: '✨',
    label: 'A kindness',
    prompt: 'You didn’t have to, but you did — ',
  },
  {
    emoji: '💼',
    label: 'A task done',
    prompt: 'For the [task] you helped me with — properly done.',
  },
  {
    emoji: '🎁',
    label: 'A gift',
    prompt: 'Just because. Happy ',
  },
  {
    emoji: '🤝',
    label: 'An apology',
    prompt: 'I’m sorry for ',
  },
  {
    emoji: '🌱',
    label: 'Pay it forward',
    prompt: 'Passing on what was given to me. Your turn.',
  },
];

/**
 * Shared form for *starting a chain* and *forwarding an existing one*.
 *
 * Both flows are identical from the UX side: pick someone you trust,
 * write a note, send N CRC. The only difference is whether we POST to
 * /api/chains (new chain) or /api/chains/{id}/forward (existing chain).
 */
export function BlessingComposer({
  mode,
  defaultAmount = '5',
  amountLocked = false,
  title,
  subtitle,
}: {
  mode: Mode;
  defaultAmount?: string;
  amountLocked?: boolean;
  title: string;
  subtitle: string;
}) {
  const router = useRouter();
  const { address, isConnected, isMiniappHost } = useWallet();
  const [recipient, setRecipient] = useState<Hex | null>(null);
  const [story, setStory] = useState('');
  const [amount, setAmount] = useState(defaultAmount);
  const [chainTitle, setChainTitle] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const inFlight =
    status.kind === 'preflight' ||
    status.kind === 'signing' ||
    status.kind === 'sending' ||
    status.kind === 'recording';

  const disabled =
    !isConnected ||
    !address ||
    !recipient ||
    story.trim().length === 0 ||
    Number(amount) <= 0 ||
    inFlight;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !recipient) return;

    try {
      // 0. Pre-flight: avoid sending a UserOperation we know will revert.
      //    These two RPC reads catch the two most common host-side errors
      //    ("recipient hasn't trusted you" + "you have no CRC to send")
      //    before they reach the Circles host as raw simulation reverts.
      setStatus({ kind: 'preflight' });

      const [trusts, balance] = await Promise.all([
        isTrustedBy(address, recipient),
        hasCrcBalance(address, address, amount),
      ]);

      if (!trusts) {
        throw new Error(
          'This recipient hasn’t trusted you in Circles yet. Until they do, ' +
            'the Hub won’t let them receive your personal CRC. Ask them to add ' +
            'your address (' +
            address.slice(0, 6) +
            '…' +
            address.slice(-4) +
            ') in the Circles app, then try again.'
        );
      }
      if (!balance.ok) {
        throw new Error(
          'You only have ' +
            formatCrc(Number(balance.balanceWei) / 1e18) +
            ' CRC of your own personal token, but this blessing needs ' +
            amount +
            '. Mint your daily CRC in the Circles app first.'
        );
      }

      // 1. Build the on-chain CRC transfer (Hub v2 ERC1155 safeTransferFrom).
      const tx = buildBlessingTx({ from: address, to: recipient, amount });

      // 2. Submit it through the Circles host's Safe.
      setStatus({ kind: 'sending' });
      const { sendTransactions } = await import('@aboutcircles/miniapp-sdk');
      const txHashes = await sendTransactions([tx]);
      const txHash = txHashes[0] as Hex;
      if (!txHash) throw new Error('Host returned no tx hash');

      // 3. Ask the host to sign an off-chain attestation that lets our
      //    API trust this submission (we don't want random POSTs).
      setStatus({ kind: 'signing' });
      const verb = mode.kind === 'start' ? 'start' : `forward:${mode.chainId}`;
      const signedMessage = [
        `Bless ${verb}`,
        `From: ${address}`,
        `To: ${recipient}`,
        `Amount: ${amount}`,
        `Tx: ${txHash}`,
        `At: ${new Date().toISOString()}`,
      ].join('\n');
      const { signMessage } = await import('@aboutcircles/miniapp-sdk');
      const { signature } = await signMessage(signedMessage);

      // 4. Record the link in our chain store.
      setStatus({ kind: 'recording' });
      const url =
        mode.kind === 'start'
          ? '/api/chains'
          : `/api/chains/${mode.chainId}/forward`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: address,
          to: recipient,
          amount,
          story: story.trim(),
          title: chainTitle.trim() || undefined,
          txHash,
          signature,
          signedMessage,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`API ${res.status}: ${detail || res.statusText}`);
      }
      const { id } = (await res.json()) as { id: string };
      setStatus({ kind: 'done', chainId: id });
      // Reset story but stay on the chain page after navigating.
      router.push(`/chain/${id}`);
    } catch (err) {
      setStatus({
        kind: 'error',
        error: explainSendError(err instanceof Error ? err.message : 'Unknown error'),
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* Recipient */}
      <section className="flex flex-col gap-2">
        <Label>Send to someone you trust</Label>
        <p className="text-xs text-muted-foreground">
          Only addresses inside your Circles trust list show up — anyone else
          might not be able to spend the CRC you send them.
        </p>
        <RecipientPicker
          value={recipient}
          onChange={setRecipient}
          excludeAddress={address ?? undefined}
        />
      </section>

      {/* Amount */}
      <section className="flex flex-col gap-2">
        <Label htmlFor="amount">Amount in CRC</Label>
        <div className="flex items-center gap-3">
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={amountLocked}
            className="max-w-[140px] text-right font-mono text-base"
          />
          <span className="text-sm text-muted-foreground">CRC</span>
          {!amountLocked && (
            <div className="ml-auto flex gap-1">
              {['1', '5', '12'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/80 hover:bg-accent"
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Your daily mint is 24 CRC (1/hour). Most chains start at 1–12 CRC.
        </p>
      </section>

      {/* Story */}
      <section className="flex flex-col gap-2">
        <Label htmlFor="story">Why this blessing?</Label>
        <div className="flex flex-wrap gap-1.5">
          {BLESS_KINDS.map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => setStory(k.prompt)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:border-rose-200 hover:bg-rose-50"
            >
              <span aria-hidden>{k.emoji}</span> {k.label}
            </button>
          ))}
        </div>
        <Textarea
          id="story"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          maxLength={280}
          placeholder="One short sentence the recipient will read — and the chain will carry…"
          rows={3}
        />
        <p className="text-right text-[10px] text-muted-foreground">
          {story.length}/280
        </p>
      </section>

      {/* Optional title — only when starting */}
      {mode.kind === 'start' && (
        <section className="flex flex-col gap-2">
          <Label htmlFor="title">Name this chain (optional)</Label>
          <Input
            id="title"
            value={chainTitle}
            onChange={(e) => setChainTitle(e.target.value)}
            maxLength={64}
            placeholder='e.g. "Coffee karma" or "For Mrs. Jain"'
          />
        </section>
      )}

      {/* Action */}
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={disabled} size="lg">
          {status.kind === 'preflight' && (
            <>
              <Loader2 className="animate-spin" /> Checking the trust graph…
            </>
          )}
          {status.kind === 'signing' && (
            <>
              <Loader2 className="animate-spin" /> Waiting for your signature…
            </>
          )}
          {status.kind === 'sending' && (
            <>
              <Loader2 className="animate-spin" /> Sending CRC…
            </>
          )}
          {status.kind === 'recording' && (
            <>
              <Loader2 className="animate-spin" /> Saving your story…
            </>
          )}
          {(status.kind === 'idle' || status.kind === 'error' || status.kind === 'done') && (
            <>
              <Sparkles />
              {mode.kind === 'start' ? 'Send the blessing' : 'Forward this blessing'}
            </>
          )}
        </Button>

        {!isMiniappHost && !isConnected && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            You&apos;re viewing standalone — open this app inside the Circles
            host to actually send CRC.
          </p>
        )}

        {status.kind === 'error' && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
            {status.error}
          </p>
        )}
      </div>
    </form>
  );
}

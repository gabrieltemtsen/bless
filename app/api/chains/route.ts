import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { isTxHash, verifyHostSignature } from '@/lib/circles';
import { listRecentChains, putChain } from '@/lib/store';
import { shortId } from '@/lib/format';
import type { Chain, Hex, StartChainBody } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/chains — Garden feed. */
export async function GET() {
  const chains = await listRecentChains(48);
  return NextResponse.json({ chains });
}

/** POST /api/chains — start a new blessing chain. */
export async function POST(req: Request) {
  let body: StartChainBody;
  try {
    body = (await req.json()) as StartChainBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { from, to, amount, story, title, txHash, signature, signedMessage } = body;

  // Input validation.
  if (!isAddress(from) || !isAddress(to)) {
    return NextResponse.json({ error: 'Invalid addresses' }, { status: 400 });
  }
  if (from.toLowerCase() === to.toLowerCase()) {
    return NextResponse.json(
      { error: 'Cannot bless yourself' },
      { status: 400 }
    );
  }
  if (!isTxHash(txHash)) {
    return NextResponse.json({ error: 'Invalid txHash' }, { status: 400 });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }
  const trimmedStory = (story ?? '').trim();
  if (trimmedStory.length === 0 || trimmedStory.length > 500) {
    return NextResponse.json(
      { error: 'Story must be 1–500 chars' },
      { status: 400 }
    );
  }

  // Verify the sender actually signed this submission.
  const sigOk = await verifyHostSignature({
    signer: from as Hex,
    message: signedMessage,
    signature: signature as Hex,
  });
  if (!sigOk) {
    return NextResponse.json(
      { error: 'Signature does not match sender' },
      { status: 401 }
    );
  }
  // The signed message must reference the same txHash & recipient, otherwise
  // a sender could relay any random tx + a valid signature for a different one.
  if (
    !signedMessage.includes(txHash) ||
    !signedMessage.toLowerCase().includes((to as string).toLowerCase())
  ) {
    return NextResponse.json(
      { error: 'Signed message does not match payload' },
      { status: 400 }
    );
  }

  const id = shortId(6);
  const chain: Chain = {
    id,
    title: (title ?? '').trim() || trimmedStory.slice(0, 60),
    links: [
      {
        index: 0,
        from: from as Hex,
        to: to as Hex,
        amount: String(amt),
        story: trimmedStory,
        txHash: txHash as Hex,
        createdAt: Date.now(),
      },
    ],
  };
  await putChain(chain);
  return NextResponse.json({ id, chain });
}

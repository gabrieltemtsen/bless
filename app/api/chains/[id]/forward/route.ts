import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { isTxHash, verifyHostSignature } from '@/lib/circles';
import { getChain, putChain } from '@/lib/store';
import { FORWARD_WINDOW_MS, type ForwardChainBody, type Hex } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: ForwardChainBody;
  try {
    body = (await req.json()) as ForwardChainBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { from, to, amount, story, txHash, signature, signedMessage } = body;
  if (!isAddress(from) || !isAddress(to)) {
    return NextResponse.json({ error: 'Invalid addresses' }, { status: 400 });
  }
  if (from.toLowerCase() === to.toLowerCase()) {
    return NextResponse.json({ error: 'Cannot forward to yourself' }, { status: 400 });
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
    return NextResponse.json({ error: 'Story must be 1–500 chars' }, { status: 400 });
  }

  const chain = await getChain(id);
  if (!chain) {
    return NextResponse.json({ error: 'Chain not found' }, { status: 404 });
  }
  const last = chain.links[chain.links.length - 1];

  // Only the current holder may forward.
  if (last.to.toLowerCase() !== (from as string).toLowerCase()) {
    return NextResponse.json(
      { error: 'You are not the current holder of this chain' },
      { status: 403 }
    );
  }

  // Enforce the 48h window.
  if (Date.now() > last.createdAt + FORWARD_WINDOW_MS) {
    return NextResponse.json(
      { error: 'This chain has wilted — the 48h window has passed.' },
      { status: 410 }
    );
  }

  // Verify the host signature.
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
  if (
    !signedMessage.includes(txHash) ||
    !signedMessage.toLowerCase().includes((to as string).toLowerCase()) ||
    !signedMessage.includes(id)
  ) {
    return NextResponse.json(
      { error: 'Signed message does not match payload' },
      { status: 400 }
    );
  }

  chain.links.push({
    index: chain.links.length,
    from: from as Hex,
    to: to as Hex,
    amount: String(amt),
    story: trimmedStory,
    txHash: txHash as Hex,
    createdAt: Date.now(),
  });
  await putChain(chain);

  return NextResponse.json({ id: chain.id, chain });
}

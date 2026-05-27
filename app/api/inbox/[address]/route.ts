import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { listRelatedTo } from '@/lib/store';
import type { Chain, Hex } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  if (!isAddress(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }
  const lower = (address as Hex).toLowerCase();
  const all = await listRelatedTo(address as Hex);

  const incoming: Chain[] = [];
  const sent: Chain[] = [];
  for (const c of all) {
    const last = c.links[c.links.length - 1];
    if (last.to.toLowerCase() === lower) {
      incoming.push(c);
    } else {
      sent.push(c);
    }
  }
  return NextResponse.json({ incoming, sent });
}

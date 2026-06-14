'use client';

import { useEffect, useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANNUAL_DEMURRAGE, presentValue } from '@/lib/demurrage';

/**
 * Shows the *live* demurraged value of a held blessing, ticking down in real
 * time. Demurrage is Circles' core economic primitive (~7%/yr), so a blessing
 * left sitting visibly loses value — the protocol made tangible.
 */
export function LiveValuePill({
  amount,
  sinceMs,
  className,
  showLost = false,
}: {
  amount: string | number;
  sinceMs: number;
  className?: string;
  showLost?: boolean;
}) {
  const nominal = Number(amount);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!Number.isFinite(nominal) || nominal <= 0) return null;

  const value = presentValue(nominal, sinceMs, now);
  const lost = nominal - value;
  const lostPct = nominal > 0 ? (lost / nominal) * 100 : 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-2.5 py-0.5 text-xs font-medium text-amber-800',
        className
      )}
      title={`Demurrage ≈ ${(ANNUAL_DEMURRAGE * 100).toFixed(1)}%/yr · ${lost.toFixed(
        4
      )} CRC lost so far`}
    >
      <TrendingDown className="size-3 shrink-0" />
      <span className="font-mono tabular-nums">{value.toFixed(4)}</span>
      <span className="text-amber-700/70">CRC now</span>
      {showLost && lostPct > 0 && (
        <span className="text-amber-700/60">· −{lostPct.toFixed(3)}%</span>
      )}
    </span>
  );
}

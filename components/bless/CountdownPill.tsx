'use client';

import { useEffect, useState } from 'react';
import { Clock4, Flower2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCountdown } from '@/lib/format';

export function CountdownPill({
  deadlineMs,
  className,
}: {
  deadlineMs: number;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const remaining = deadlineMs - now;
  const isExpired = remaining <= 0;
  const isUrgent = !isExpired && remaining < 6 * 3_600_000;

  if (isExpired) {
    return (
      <Badge variant="muted" className={className}>
        <Flower2 className="size-3" /> wilted
      </Badge>
    );
  }
  return (
    <Badge
      variant={isUrgent ? 'warning' : 'success'}
      className={className}
      title={`Forward by ${new Date(deadlineMs).toLocaleString()}`}
    >
      <Clock4 className="size-3" /> {formatCountdown(deadlineMs, now)}
    </Badge>
  );
}

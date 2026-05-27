import Link from 'next/link';
import { Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <Flower2 className="size-10 text-rose-300" />
      <h1 className="text-2xl font-semibold">This chain isn’t here</h1>
      <p className="text-sm text-muted-foreground">
        It may have wilted before it was planted — or the link is wrong.
      </p>
      <Link href="/">
        <Button>Back to the garden</Button>
      </Link>
    </div>
  );
}

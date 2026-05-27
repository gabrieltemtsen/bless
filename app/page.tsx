import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HostHint } from '@/components/wallet/HostHint';
import { GardenFeed } from '@/components/bless/GardenFeed';

export default function GardenPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <HostHint />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-amber-50 via-rose-50 to-violet-100 px-6 py-10 md:px-12 md:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-amber-200/60 blur-3xl bless-float"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-10 size-56 rounded-full bg-violet-200/60 blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-medium text-rose-700">
            <Heart className="size-3.5 fill-current" /> trust, made spendable
          </span>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
            Bless someone — for{' '}
            <span className="bg-gradient-to-br from-rose-500 via-amber-500 to-violet-600 bg-clip-text text-transparent">
              anything worth saying thanks for.
            </span>
          </h1>
          <p className="max-w-2xl text-base text-foreground/70 md:text-lg">
            Circles is a currency built on people trusting people. Bless turns
            that trust into kindness you can send. A gratitude. A task done. A
            kindness returned. A favour paid forward. CRC + one sentence,
            travelling along the people you&apos;ve actually trusted in real
            life. If the recipient is moved to bless someone back within{' '}
            <strong className="text-foreground">48 hours</strong>, the chain
            grows. If not, your thanks just stands on its own — still real,
            still seen.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/bless">
              <Button size="lg">
                <Sparkles /> Send a blessing
              </Button>
            </Link>
            <Link href="/inbox">
              <Button size="lg" variant="outline">
                Open your inbox
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The garden — live chain feed */}
      <section className="flex flex-col gap-3">
        <header>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Heart className="size-5 fill-rose-400 text-rose-400" /> The garden
          </h2>
          <p className="text-sm text-muted-foreground">
            Every blessing currently alive, freshest first. Tap one to see who
            it&apos;s travelled through.
          </p>
        </header>
        <GardenFeed />
      </section>
    </div>
  );
}

import Link from 'next/link';
import { Flower2, Sparkles } from 'lucide-react';
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
            <Flower2 className="size-3.5" /> built on Circles · Gnosis Chain
          </span>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
            A blessing is a story{' '}
            <span className="bg-gradient-to-br from-rose-500 via-amber-500 to-violet-600 bg-clip-text text-transparent">
              that must keep walking.
            </span>
          </h1>
          <p className="max-w-2xl text-base text-foreground/70 md:text-lg">
            Send a few CRC and a sentence to someone you trust. They have{' '}
            <strong className="text-foreground">48 hours</strong> to add their
            own story and forward it to someone <em>they</em> trust. Otherwise
            the chain wilts — kindness is a fragile thing. The Circles trust
            graph is the soil it grows in.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/bless">
              <Button size="lg">
                <Sparkles /> Start a blessing
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
            <Flower2 className="size-5 text-rose-500" /> The garden
          </h2>
          <p className="text-sm text-muted-foreground">
            Every chain currently alive, freshest first. Tap any bloom to see its lineage.
          </p>
        </header>
        <GardenFeed />
      </section>
    </div>
  );
}

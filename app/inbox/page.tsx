'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InboxList } from '@/components/bless/InboxList';
import { HostHint } from '@/components/wallet/HostHint';
import { useWallet } from '@/hooks/use-wallet';

export default function InboxPage() {
  const { address, isConnected } = useWallet();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Your blessings</h1>
        <p className="text-sm text-muted-foreground">
          Anything that needs a reply — and every chain you&apos;ve ever touched.
        </p>
      </header>

      <HostHint />

      {!isConnected || !address ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect to see your inbox</CardTitle>
            <CardDescription>
              The Circles host pushes your avatar address to the app. Open this
              miniapp from inside circles.gnosis.io to see the blessings sitting
              with you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">Back to the garden</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <InboxList address={address} />
      )}
    </div>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import { BlessingComposer } from '@/components/bless/BlessingComposer';
import { HostHint } from '@/components/wallet/HostHint';

export const metadata = {
  title: 'Start a blessing · Bless',
};

export default function StartBlessingPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Plant a new chain</h1>
        <p className="text-sm text-muted-foreground">
          Pick someone you already trust, write one true sentence, and let a
          little CRC carry it forward.
        </p>
      </header>

      <HostHint />

      <Card>
        <CardContent className="p-6 md:p-8">
          <BlessingComposer
            mode={{ kind: 'start' }}
            title="Compose your blessing"
            subtitle="They'll have 48 hours to add their own story and pass it on — or the chain wilts."
          />
        </CardContent>
      </Card>
    </div>
  );
}

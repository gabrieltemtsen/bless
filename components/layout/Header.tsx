import Link from 'next/link';
import { BlessLogo } from '@/components/brand/BlessLogo';
import { MobileNav } from '@/components/layout/MobileNav';
import { BackTheDev } from '@/components/wallet/BackTheDev';
import { WalletStatus } from '@/components/wallet/WalletStatus';

export function Header() {
  return (
    <header className="sticky top-0 z-20 col-span-full flex h-14 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <BlessLogo width={26} height={26} />
          <span className="hidden text-base sm:inline">Bless</span>
        </Link>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          · trust, made spendable
        </span>
      </div>
      <div className="flex items-center gap-3">
        {/* "Trust gabriel" lives in the header so visitors who want to
            back the maker can do it from any page — and the sidebar
            credit is still there for the desktop browsing case. */}
        <BackTheDev variant="pill" className="hidden sm:inline-flex" />
        <WalletStatus />
      </div>
    </header>
  );
}

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { AppShell } from '@/components/layout/AppShell';
import { WalletProvider } from '@/components/wallet/WalletProvider';

const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bless — appreciation, on Circles trust',
  description:
    'Send a small CRC blessing + one sentence to someone you trust. For gratitude, a task done, a kindness, a gift. If they bless someone back within 48h, the chain grows.',
  openGraph: {
    title: 'Bless — appreciation, on Circles trust',
    description:
      'Trust, made spendable. Bless people on Circles for anything worth saying thanks for.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <WalletProvider>
          <AppShell>{children}</AppShell>
        </WalletProvider>
      </body>
    </html>
  );
}

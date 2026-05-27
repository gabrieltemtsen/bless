import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { AppShell } from '@/components/layout/AppShell';
import { WalletProvider } from '@/components/wallet/WalletProvider';

const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bless — pay-it-forward on Circles',
  description:
    'A Circles mini-app for pay-it-forward CRC blessings. Receive a blessing, add your story, forward to someone you trust within 48 hours — or the chain wilts.',
  openGraph: {
    title: 'Bless — pay-it-forward on Circles',
    description:
      'Receive a blessing, add your story, forward it within 48 hours to someone you trust.',
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

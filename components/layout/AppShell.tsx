import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-rows-[3.5rem_1fr] md:grid-cols-[240px_1fr]">
      <Header />
      <Sidebar />
      <main className="relative overflow-x-hidden">
        {/* Soft floral wash behind every page */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,rgba(255,170,140,0.18),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(160,140,230,0.18),transparent_50%),radial-gradient(circle_at_50%_120%,rgba(255,210,170,0.20),transparent_55%)]"
        />
        <div className="px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}

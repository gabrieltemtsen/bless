import { Flower2, Inbox, Send, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV: NavItem[] = [
  { href: '/', label: 'Garden', icon: Flower2 },
  { href: '/bless', label: 'Start a blessing', icon: Sparkles },
  { href: '/inbox', label: 'Your blessings', icon: Inbox },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: '/about', label: 'About', icon: Send },
];

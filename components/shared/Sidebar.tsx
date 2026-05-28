'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, HandshakeIcon, CalendarCheck,
  Bell, MessageSquare, Settings, LogOut, Menu, X, History,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/buyers', label: 'Buyers', icon: Users },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/deals', label: 'Deals', icon: HandshakeIcon },
  { href: '/visits', label: 'Site Visits', icon: CalendarCheck },
  { href: '/followups', label: 'Follow-ups', icon: Bell },
  { href: '/history', label: 'History', icon: History },
  { href: '/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  brokerName: string;
  brokerEmail: string;
}

export function Sidebar({ brokerName, brokerEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const NavLinks = () => (
    <>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-primary-500 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar min-h-screen fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700">
          <Image src="/logo.jpg" alt="Makaan Sathi" width={36} height={36} className="rounded-lg flex-shrink-0 object-cover" />
          <span className="text-white font-bold text-base leading-tight">Makaan Sathi</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-slate-700">
          <div className="px-4 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">{brokerName}</p>
            <p className="text-slate-400 text-xs truncate">{brokerEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header + bottom nav */}
      <div className="md:hidden">
        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 bg-sidebar h-14 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="Makaan Sathi" width={28} height={28} className="rounded-lg object-cover" />
            <span className="text-white font-bold">Makaan Sathi</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-300 p-1">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 mt-14">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="relative bg-sidebar w-60 min-h-full pt-4 px-3">
              <nav className="space-y-1">
                <NavLinks />
              </nav>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <button onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile bottom nav (primary 5 items) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-sidebar border-t border-slate-700 z-30 flex">
          {NAV.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={cn('flex-1 flex flex-col items-center py-2 gap-0.5 text-xs', active ? 'text-primary-400' : 'text-slate-400')}>
                <Icon className="h-5 w-5" />
                <span className="truncate w-full text-center px-0.5">{label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, BarChart2, ShieldAlert, Award, LogOut, type LucideIcon } from 'lucide-react';
import { clearSession, getSession, type Role, type Session } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Incidents Portal', icon: FileText, roles: ['admin'], isActive: (p) => p === '/' },
  { href: '/sections', label: 'Sections Audit', icon: BarChart2, roles: ['admin', 'client'], isActive: (p) => p.startsWith('/sections') },
  { href: '/hse-scorecard', label: 'HSE Scorecard', icon: Award, roles: ['admin'], isActive: (p) => p === '/hse-scorecard' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSessionState] = useState<Session | null>(null);

  // The cookie is read only on the client side (to prevent hydration mismatch).
  useEffect(() => {
    setSessionState(getSession());
  }, []);

  const visibleItems = session ? NAV_ITEMS.filter((n) => n.roles.includes(session.role)) : [];

  const handleSignOut = () => {
    clearSession();
    router.replace('/login');
    router.refresh();
  };

  return (
    <>
      {/* ===== Mobile top bar ===== */}
      <header className="md:hidden bg-zinc-950 text-white border-b border-zinc-900 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span className="font-bold tracking-wider text-sm">BONDVILLE</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto">
          {visibleItems.map(({ href, label, icon: Icon, isActive }) => (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                isActive(pathname) ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ===== Desktop sidebar ===== */}
      <aside className="hidden md:flex md:sticky md:top-0 md:h-screen w-64 shrink-0 flex-col bg-zinc-950 text-white p-6 shadow-2xl border-r border-zinc-900">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-zinc-900">
          <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold tracking-wider text-white text-base leading-none">BONDVILLE</h2>
            <span className="text-[10px] tracking-widest uppercase text-red-500 font-semibold mt-1 block">
              EHS Portal
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2 flex-1">
          {visibleItems.map(({ href, label, icon: Icon, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-4 py-3 rounded-lg transition font-medium text-sm ${
                  active
                    ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-red-500'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User Session Info + Sign out */}
        <div className="pt-4 border-t border-zinc-900 text-xs text-zinc-500 space-y-3">
          <div>
            <p className="uppercase tracking-wider text-[10px]">Logged in as:</p>
            <p className="text-zinc-200 font-semibold mt-0.5 tracking-wide">
              {session?.name ?? '—'}
            </p>
            {session && (
              <p className="text-[10px] uppercase tracking-wider text-red-500 mt-0.5">{session.role}</p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/60 transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
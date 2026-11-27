'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  BarChart2,
  ShieldAlert,
  Award,
  Users,
  ShieldCheck,
  ClipboardList,
  FileWarning,
  Building2,
  LogOut,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

type NavGroup = 'main' | 'admin';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  group: NavGroup;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Incidents Portal', icon: FileText, roles: ['admin'], group: 'main', isActive: (p) => p === '/' },
  { href: '/sections', label: 'Sections Audit', icon: BarChart2, roles: ['admin', 'client'], group: 'main', isActive: (p) => p.startsWith('/sections') && !p.startsWith('/sections-manage') },
  { href: '/hse-scorecard', label: 'HSE Scorecard', icon: Award, roles: ['admin'], group: 'main', isActive: (p) => p === '/hse-scorecard' },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck, roles: ['admin'], group: 'main', isActive: (p) => p === '/compliance' },
  { href: '/compliance/audits', label: 'Audit Register', icon: ClipboardList, roles: ['admin'], group: 'main', isActive: (p) => p.startsWith('/compliance/audits') },
  { href: '/compliance/nc', label: 'NC Tracker', icon: FileWarning, roles: ['admin'], group: 'main', isActive: (p) => p.startsWith('/compliance/nc') },
  { href: '/sections-manage', label: 'Section Management', icon: Building2, roles: ['admin'], group: 'admin', isActive: (p) => p.startsWith('/sections-manage') },
  { href: '/users', label: 'User Management', icon: Users, roles: ['admin'], group: 'admin', isActive: (p) => p.startsWith('/users') },
];

interface SessionUser {
  full_name: string;
  role: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [adminOpen, setAdminOpen] = useState(true);

  // Load session from localStorage with a safe fallback
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('bondville_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({
          full_name: parsed.name || parsed.email || 'Admin User',
          role: parsed.role || 'admin',
        });
      } else {
        // Fallback default for testing if localStorage is empty
        setUser({ full_name: 'BSS (Turnaround Coordinator)', role: 'admin' });
      }
    } catch {
      setUser({ full_name: 'Admin User', role: 'admin' });
    }
  }, []);

  // Wait for the session before rendering links, so clients never see admin items flash
  const visibleItems = user ? NAV_ITEMS.filter((n) => n.roles.includes(user.role)) : [];
  const mainItems = visibleItems.filter((n) => n.group === 'main');
  const adminItems = visibleItems.filter((n) => n.group === 'admin');

  // Keep the admin group open when one of its pages is active
  const adminHasActive = adminItems.some((n) => n.isActive(pathname));
  const showAdminGroup = adminOpen || adminHasActive;

  const isAdmin = user?.role === 'admin';
  const initial = (user?.full_name ?? 'A').trim().charAt(0).toUpperCase();

  const handleSignOut = () => {
    try {
      localStorage.removeItem('bondville_user');
    } catch {
      /* ignore */
    }
    router.replace('/login');
    router.refresh();
  };

  const renderDesktopLink = ({ href, label, icon: Icon, isActive }: NavItem) => {
    const active = isActive(pathname);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
          active
            ? 'bg-white/20 text-white shadow-sm'
            : 'text-white/90 hover:bg-white/10 hover:text-white'
        }`}
      >
        <image src={Icon} alt="" className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* ===== Mobile top bar ===== */}
      <header className="md:hidden bg-gradient-to-r from-[#d4001a] to-[#9b0013] text-white px-4 py-3 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <ShieldAlert className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold lowercase tracking-wide">bondville</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {visibleItems.map(({ href, label, icon: Icon, isActive }) => (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                isActive(pathname)
                  ? 'bg-white text-red-700'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ===== Desktop sidebar ===== */}
      <aside className="relative hidden md:flex md:sticky md:top-0 md:h-screen w-64 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-[#d4001a] via-[#bd0016] to-[#8f0012] text-white shadow-2xl">
        {/* Watermark */}
        <ShieldAlert
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 text-white/[0.07]"
          strokeWidth={1.25}
        />

        {/* Brand */}
        <div className="relative flex flex-col items-center px-6 pb-6 pt-8">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-red-950/30">
            <ShieldAlert className="h-8 w-8 text-red-600" strokeWidth={2.25} />
          </div>
          <h2 className="text-2xl font-extrabold lowercase leading-none tracking-tight">bondville</h2>
          <span className="mt-1 text-[11px] font-medium text-white/70">EHS Portal</span>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {mainItems.map(renderDesktopLink)}

          {adminItems.length > 0 && (
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setAdminOpen((v) => !v)}
                aria-expanded={showAdminGroup}
                className="flex w-full items-center gap-3 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/70 hover:text-white"
              >
                <span>Admin</span>
                <span className="h-px flex-1 bg-white/25" />
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAdminGroup ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>
              {showAdminGroup && <div className="mt-1 space-y-1">{adminItems.map(renderDesktopLink)}</div>}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="relative space-y-3 px-4 pb-4">
          {user && (
            <div className="rounded-xl bg-black/20 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${isAdmin ? 'bg-emerald-400' : 'bg-amber-300'}`}
                />
                <p className="text-xs font-semibold">
                  {isAdmin ? 'Editing open (Admin)' : 'View only'}
                </p>
              </div>
              <p className="mt-0.5 pl-4 text-[10px] text-white/60">
                {isAdmin ? 'Admin: edit any time' : 'Editing is restricted'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-red-700">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-tight">{user?.full_name ?? 'Loading…'}</p>
              {user && <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">{user.role}</p>}
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
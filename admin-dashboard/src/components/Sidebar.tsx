'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart2, ShieldAlert, Award } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-950 text-white hidden md:flex flex-col p-6 shadow-2xl min-h-screen border-r border-zinc-900">
      {/* Brand / Logo */}
      <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-zinc-900">
        <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="font-bold tracking-wider text-white text-base leading-none">BONDVILLE</h2>
          <span className="text-[10px] tracking-widest uppercase text-red-500 font-semibold mt-1 block">EHS Portal</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-2 flex-1">
        <Link 
          href="/" 
          className={`flex items-center px-4 py-3 rounded-lg transition font-medium text-sm ${
            pathname === '/' 
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <FileText className={`w-5 h-5 mr-3 ${pathname === '/' ? 'text-white' : 'text-red-500'}`} /> Incidents Portal
        </Link>
        
        <Link 
          href="/sections" 
          className={`flex items-center px-4 py-3 rounded-lg transition font-medium text-sm ${
            pathname.startsWith('/sections') 
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <BarChart2 className={`w-5 h-5 mr-3 ${pathname.startsWith('/sections') ? 'text-white' : 'text-red-500'}`} /> Sections Audit
        </Link>

        <Link 
          href="/hse-scorecard" 
          className={`flex items-center px-4 py-3 rounded-lg transition font-medium text-sm ${
            pathname === '/hse-scorecard' 
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <Award className={`w-5 h-5 mr-3 ${pathname === '/hse-scorecard' ? 'text-white' : 'text-red-500'}`} /> HSE Scorecard
        </Link>
      </nav>

      {/* User Session Info */}
      <div className="pt-4 border-t border-zinc-900 text-xs text-zinc-500">
        <p className="uppercase tracking-wider text-[10px]">Logged in as:</p>
        <p className="text-zinc-200 font-semibold mt-0.5 tracking-wide">BSS (Turnaround Coordinator)</p>
      </div>
    </aside>
  );
}
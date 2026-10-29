'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart2, ShieldAlert } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col p-6 shadow-xl min-h-screen">
      {/* Brand / Logo */}
      <div className="flex items-center space-x-2 mb-8">
        <ShieldAlert className="w-8 h-8 text-blue-500" />
        <h2 className="text-xl font-bold tracking-wider text-white">EHS SYSTEM</h2>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-2 flex-1">
        <Link 
          href="/" 
          className={`flex items-center px-4 py-3 rounded-lg transition font-medium text-sm ${
            pathname === '/' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5 mr-3 text-blue-400" /> Incidents Portal
        </Link>
        
        <Link 
          href="/sections" 
          className={`flex items-center px-4 py-3 rounded-lg transition font-medium text-sm ${
            pathname === '/sections' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BarChart2 className="w-5 h-5 mr-3 text-blue-400" /> Sections Audit
        </Link>
      </nav>

      {/* User Session Info */}
      <div className="pt-4 border-t border-slate-800 text-xs text-gray-400">
        <p>Logged in as:</p>
        <p className="text-gray-200 font-semibold mt-0.5"> (BSS)</p>
      </div>
    </aside>
  );
}
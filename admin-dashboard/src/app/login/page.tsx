'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { homeForRole, setSession, type Session } from '@/lib/auth';

// ⚠️ DEMO ONLY: In production, replace these with a backend API, hashed passwords, and an httpOnly JWT cookie.
const DEMO_USERS: Record<string, { password: string; session: Session }> = {
  'admin@bondville.lk': {
    password: 'Admin@2026',
    session: { email: 'admin@bondville.lk', role: 'admin', name: 'BSS (Turnaround Coordinator)' },
  },
  'client@bondville.lk': {
    password: 'Client@2026',
    session: { email: 'client@bondville.lk', role: 'client', name: 'Client Auditor' },
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If an old localStorage session remains, it is cleared.
  useEffect(() => {
    localStorage.removeItem('bondville_user');
  }, []);

  const fillCredentials = (role: 'admin' | 'client') => {
    if (role === 'admin') {
      setEmail('admin@bondville.lk');
      setPassword('Admin@2026');
    } else {
      setEmail('client@bondville.lk');
      setPassword('Client@2026');
    }
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const user = DEMO_USERS[email.trim().toLowerCase()];

      if (user && user.password === password) {
        setSession(user.session);
        router.replace(homeForRole(user.session.role));
      } else {
        setError('Invalid credentials. Please use the quick fill buttons below.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Brand Header */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl items-center justify-center shadow-xl">
          <ShieldAlert className="w-6 h-6 text-red-600" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-wider text-white">BONDVILLE</h1>
        <p className="text-xs uppercase tracking-widest text-red-500 font-semibold">
          EHS Incident & Audit Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Secure Sign In</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enter your corporate credentials to access the dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Corporate Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="name@bondville.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-70 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-red-950 flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Credentials (Demo only – remove in production) */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-3">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block text-center">
            Quick Test Credentials (Click to Fill)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="px-3 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-medium transition flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-red-500" />
              <span>Fill Admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('client')}
              className="px-3 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-medium transition flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Fill Client</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-zinc-600">
        © 2026 Bondville (Pvt) Ltd. All rights reserved.
      </div>
    </div>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lato } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { homeForRole, setSession, type Session } from '@/lib/auth';

const lato = Lato({ subsets: ['latin'], weight: ['300', '400', '700'] });

// ⚠️ DEMO ONLY: In production, replace these with a backend API, hashed passwords, and an httpOnly JWT cookie.
const DEMO_USERS: Record<string, { password: string; session: Session }> = {
  'admin@bondville.lk': {
    password: 'Admin@2026',
    session: { email: 'admin@bondville.lk', role: 'admin', name: 'BSS' },
  },
  'client@bondville.lk': {
    password: 'Client@2026',
    session: { email: 'client@bondville.lk', role: 'client', name: 'Client Auditor' },
  },
};

const SHOW_DEMO = process.env.NODE_ENV !== 'production';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
        setError('Email or password is incorrect. Check your details and try again.');
        setIsLoading(false);
      }
    }, 600);
  };

  const inputClass =
    'w-full h-11 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 placeholder-neutral-400 transition focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10';

  return (
    <div
      className={`${lato.className} min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-neutral-50 via-white to-red-50 px-4 py-10`}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        {/* Login card */}
        <div className="w-full max-w-[360px] sm:max-w-[400px] rounded-2xl bg-white px-8 py-10 sm:px-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)]">
          {/* Logo: reduced gap below (was mb-4). Adjust mb-0 / -mb-2 to fine-tune. */}
          <div className="flex justify-center mb-0">
            <img src="/images/logo.png" alt="Bondville logo" className="h-20 w-auto object-contain" />
          </div>

          <h1 className="text-center text-2xl font-bold text-neutral-900 -mt-4">Log in</h1>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-800"
            >
              <AlertCircle className="w-4 h-4 mt-px shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-neutral-800 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="name@bondville.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-neutral-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-neutral-400 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-neutral-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-neutral-300 accent-red-600"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="font-bold text-neutral-800 hover:text-red-600 focus:outline-none focus-visible:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-600/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>Logging in…</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs font-light text-neutral-500">
        © 2026 Bondville (Pvt) Ltd. All rights reserved.
      </footer>
    </div>
  );
}
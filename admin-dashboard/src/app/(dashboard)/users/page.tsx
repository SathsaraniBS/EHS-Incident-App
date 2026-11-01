'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  UserPlus,
  Users as UsersIcon,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Wand2,
  KeyRound,
  X,
  CheckCircle2,
} from 'lucide-react';
import type { Role } from '@/lib/auth';

interface UserRow {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join('');
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Add-user modal
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Reset-password modal
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetPw, setResetPw] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || 'Failed to load users.');
        setUsers([]);
      } else {
        setUsers(data);
      }
    } catch {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openAdd = () => {
    setEmail('');
    setFullName('');
    setRole('client');
    setPassword('');
    setShowPw(false);
    setFormError('');
    setShowAdd(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, role, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.detail || 'Failed to create user.');
        return;
      }
      setShowAdd(false);
      setNotice(`User ${data.email} created. Share the password with them securely — it cannot be viewed again.`);
      loadUsers();
    } catch {
      setFormError('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const patchUser = async (id: number, body: Record<string, unknown>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Update failed.');
    return data as UserRow;
  };

  const toggleActive = async (u: UserRow) => {
    setError('');
    setNotice('');
    try {
      const updated = await patchUser(u.id, { is_active: !u.is_active });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const changeRole = async (u: UserRow, newRole: Role) => {
    setError('');
    setNotice('');
    try {
      const updated = await patchUser(u.id, { role: newRole });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || resetting) return;
    setResetting(true);
    setResetError('');
    try {
      await patchUser(resetTarget.id, { password: resetPw });
      setNotice(`Password reset for ${resetTarget.email}. Share the new password with them securely.`);
      setResetTarget(null);
      setResetPw('');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setResetting(false);
    }
  };

  const inputClass =
    'w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20';

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-4 lg:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Bondville EHS Division</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create accounts and manage access to the portal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadUsers}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 transition"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-red-700 transition"
          >
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-xs sm:text-sm text-slate-700">
          <thead className="bg-slate-100/80 text-[11px] sm:text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5">ID</th>
              <th className="px-4 py-3.5">Name</th>
              <th className="px-4 py-3.5">Email</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3.5 font-mono font-bold text-red-600">#{u.id}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="px-4 py-3.5 text-slate-700">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold focus:outline-none"
                    >
                      <option value="admin">admin</option>
                      <option value="client">client</option>
                    </select>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-bold ${
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setResetTarget(u);
                          setResetPw('');
                          setResetError('');
                        }}
                        className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-red-600" /> Reset password
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                          u.is_active
                            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add user modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add New User</h2>
              <button onClick={() => setShowAdd(false)} aria-label="Close">
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            {formError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3" autoComplete="off">
              <div>
                <label htmlFor="u-name" className="block text-xs font-bold text-slate-700 mb-1">
                  Full name
                </label>
                <input
                  id="u-name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Nimal Perera"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="u-email" className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="u-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@bondville.lk"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="u-role" className="block text-xs font-bold text-slate-700 mb-1">
                  Role
                </label>
                <select
                  id="u-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className={inputClass}
                >
                  <option value="client">client (Sections Audit only)</option>
                  <option value="admin">admin (full access + user management)</option>
                </select>
              </div>
              <div>
                <label htmlFor="u-pw" className="block text-xs font-bold text-slate-700 mb-1">
                  Temporary password (min 8 characters)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="u-pw"
                      type={showPw ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(generatePassword());
                      setShowPw(true);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Wand2 className="h-3.5 w-3.5 text-red-600" /> Generate
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-900">Reset password</h2>
              <button onClick={() => setResetTarget(null)} aria-label="Close">
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{resetTarget.email}</p>

            {resetError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                {resetError}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-3" autoComplete="off">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  minLength={8}
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  autoComplete="off"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setResetPw(generatePassword())}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Wand2 className="h-3.5 w-3.5 text-red-600" /> Generate
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {resetting ? 'Saving…' : 'Reset password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardList, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import {
  api,
  AUDIT_STATUSES,
  formatDate,
  statusBadge,
  type Audit,
  type AuditStatus,
} from '@/lib/compliance';
import { inputClass, Modal, Pager, SortTh, useTable } from '@/components/compliance/shared';

interface FormState {
  audit_code: string;
  factory_name: string;
  audit_type: string;
  auditor_name: string;
  scheduled_date: string;
  actual_start_date: string;
  end_date: string;
  status: AuditStatus;
}

const DEFAULT_FACTORY = 'Bondville (Pvt) Ltd - Horana';
const emptyForm = (): FormState => ({
  audit_code: '',
  factory_name: DEFAULT_FACTORY,
  audit_type: '',
  auditor_name: '',
  scheduled_date: '',
  actual_start_date: '',
  end_date: '',
  status: 'Scheduled',
});

const TABS = ['All', ...AUDIT_STATUSES] as const;

export default function AuditRegisterPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<(typeof TABS)[number]>('All');
  const [q, setQ] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Audit | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Audit | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAudits(await api<Audit[]>('audits'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return audits.filter(
      (a) =>
        (tab === 'All' || a.status === tab) &&
        (!s ||
          a.audit_code.toLowerCase().includes(s) ||
          a.audit_type.toLowerCase().includes(s) ||
          (a.auditor_name ?? '').toLowerCase().includes(s))
    );
  }, [audits, tab, q]);

  const t = useTable(filtered, 'scheduled_date', 'desc');

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (a: Audit) => {
    setEditing(a);
    setForm({
      audit_code: a.audit_code,
      factory_name: a.factory_name,
      audit_type: a.audit_type,
      auditor_name: a.auditor_name ?? '',
      scheduled_date: a.scheduled_date,
      actual_start_date: a.actual_start_date ?? '',
      end_date: a.end_date ?? '',
      status: a.status,
    });
    setFormError('');
    setFormOpen(true);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError('');
    const body = {
      audit_code: form.audit_code,
      factory_name: form.factory_name,
      audit_type: form.audit_type,
      auditor_name: form.auditor_name || null,
      scheduled_date: form.scheduled_date,
      actual_start_date: form.actual_start_date || null,
      end_date: form.end_date || null,
      status: form.status,
    };
    try {
      if (editing) {
        await api<Audit>(`audits/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api<Audit>('audits', { method: 'POST', body: JSON.stringify(body) });
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api<void>(`audits/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const sortProps = (label: string, field: string) => ({
    label,
    field,
    active: t.sortKey === field,
    onSort: t.toggleSort,
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-4 lg:p-8 space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Audit Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track audit schedules, ongoing assessments and closed reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 transition"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-red-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Audit
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((name) => (
            <button
              key={name}
              onClick={() => {
                setTab(name);
                t.setPage(1);
              }}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
                tab === name ? 'bg-red-600 text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              t.setPage(1);
            }}
            placeholder="Search ID, type or auditor…"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-100/80 text-[11px] sm:text-xs font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <SortTh {...sortProps('Audit ID', 'audit_code')} />
                <SortTh {...sortProps('Factory', 'factory_name')} />
                <SortTh {...sortProps('Audit Type', 'audit_type')} />
                <SortTh {...sortProps('Auditor', 'auditor_name')} />
                <SortTh {...sortProps('Scheduled', 'scheduled_date')} />
                <SortTh {...sortProps('Start', 'actual_start_date')} />
                <SortTh {...sortProps('End', 'end_date')} />
                <SortTh {...sortProps('Status', 'status')} />
                <th className="px-4 py-3.5 text-right uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">Loading audits...</td>
                </tr>
              ) : t.pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">No audits found.</td>
                </tr>
              ) : (
                t.pageRows.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-red-600">{a.audit_code}</td>
                    <td className="px-4 py-3.5">{a.factory_name}</td>
                    <td className="px-4 py-3.5">{a.audit_type}</td>
                    <td className="px-4 py-3.5">{a.auditor_name ?? '—'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(a.scheduled_date)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(a.actual_start_date)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(a.end_date)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${statusBadge(a.status)}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(a)}
                          className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5 text-red-600" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(a);
                            setDeleteError('');
                          }}
                          className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pager
          total={t.total}
          page={t.page}
          totalPages={t.totalPages}
          pageSize={t.pageSize}
          onPage={t.setPage}
          onPageSize={t.setPageSize}
        />
      </div>

      {/* Add / Edit modal */}
      {formOpen && (
        <Modal title={editing ? `Edit Audit ${editing.audit_code}` : 'Add Audit'} onClose={() => setFormOpen(false)}>
          {formError && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{formError}</div>
          )}
          <form onSubmit={handleSave} className="space-y-3" autoComplete="off">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit ID</label>
                <input required value={form.audit_code} onChange={(e) => set('audit_code', e.target.value)} placeholder="e.g. C1-9600" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value as AuditStatus)} className={inputClass}>
                  {AUDIT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Factory name</label>
              <input required value={form.factory_name} onChange={(e) => set('factory_name', e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit type</label>
                <input required value={form.audit_type} onChange={(e) => set('audit_type', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Auditor name</label>
                <input value={form.auditor_name} onChange={(e) => set('auditor_name', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled date</label>
                <input required type="date" value={form.scheduled_date} onChange={(e) => set('scheduled_date', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start date</label>
                <input type="date" value={form.actual_start_date} onChange={(e) => set('actual_start_date', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End date</label>
                <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create audit'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <Modal title="Delete audit?" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-600">
            Audit <b className="text-slate-900">{deleteTarget.audit_code}</b> and its NC report (if any) will be permanently removed. This cannot be undone.
          </p>
          {deleteError && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{deleteError}</div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileWarning, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import {
  api,
  formatDate,
  NC_STATUSES,
  statusBadge,
  type Audit,
  type NCReport,
  type NCStatus,
} from '@/lib/compliance';
import { inputClass, Modal, Pager, SortTh, useTable } from '@/components/compliance/shared';

interface FormState {
  audit_id: string;
  raised_on: string;
  acknowledged_on: string;
  status: NCStatus;
  progress: number;
  notes: string;
}

const emptyForm = (): FormState => ({
  audit_id: '',
  raised_on: '',
  acknowledged_on: '',
  status: 'Pending',
  progress: 0,
  notes: '',
});

export default function NCTrackerPage() {
  const [ncs, setNcs] = useState<NCReport[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NCReport | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<NCReport | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [n, a] = await Promise.all([api<NCReport[]>('nc'), api<Audit[]>('audits')]);
      setNcs(n);
      setAudits(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load NC reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // NC report එකක් තාම නැති audits (අලුත් NC එකකට තෝරන්න)
  const auditsWithoutNC = useMemo(() => {
    const used = new Set(ncs.map((n) => n.audit_id));
    return audits.filter((a) => !used.has(a.id));
  }, [audits, ncs]);

  const t = useTable(ncs, 'raised_on', 'desc');

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm(), audit_id: auditsWithoutNC[0] ? String(auditsWithoutNC[0].id) : '' });
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (n: NCReport) => {
    setEditing(n);
    setForm({
      audit_id: String(n.audit_id),
      raised_on: n.raised_on ?? '',
      acknowledged_on: n.acknowledged_on ?? '',
      status: n.status,
      progress: n.progress,
      notes: n.notes ?? '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!editing && !form.audit_id) {
      setFormError('Select an audit first (create the audit in Audit Register if it is missing).');
      return;
    }
    setSaving(true);
    setFormError('');
    const common = {
      raised_on: form.raised_on || null,
      acknowledged_on: form.acknowledged_on || null,
      status: form.status,
      progress: form.progress,
      notes: form.notes || null,
    };
    try {
      if (editing) {
        await api<NCReport>(`nc/${editing.id}`, { method: 'PATCH', body: JSON.stringify(common) });
      } else {
        await api<NCReport>('nc', {
          method: 'POST',
          body: JSON.stringify({ audit_id: Number(form.audit_id), ...common }),
        });
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
      await api<void>(`nc/${deleteTarget.id}`, { method: 'DELETE' });
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
            <FileWarning className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">NC Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track non-conformances.</p>
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
            <Plus className="h-4 w-4" /> Add NC
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-100/80 text-[11px] sm:text-xs font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <SortTh {...sortProps('Audit ID', 'audit_code')} />
                <SortTh {...sortProps('Factory', 'factory_name')} />
                <SortTh {...sortProps('Audit Type', 'audit_type')} />
                <SortTh {...sortProps('NC Raised On', 'raised_on')} />
                <SortTh {...sortProps('Acknowledged On', 'acknowledged_on')} />
                <SortTh {...sortProps('Status', 'status')} />
                <SortTh {...sortProps('Progress', 'progress')} />
                <th className="px-4 py-3.5 text-right uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">Loading NC reports...</td>
                </tr>
              ) : t.pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">No NC reports found.</td>
                </tr>
              ) : (
                t.pageRows.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-red-600">{n.audit_code}</td>
                    <td className="px-4 py-3.5">{n.factory_name}</td>
                    <td className="px-4 py-3.5">{n.audit_type}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(n.raised_on)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(n.acknowledged_on)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${statusBadge(n.status)}`}>{n.status}</span>
                    </td>
                    <td className="px-4 py-3.5 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${n.progress}%` }} />
                        </div>
                        <span className="w-9 text-right text-xs font-semibold">{n.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(n)}
                          className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5 text-red-600" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(n);
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
        <Modal title={editing ? `Edit NC · ${editing.audit_code}` : 'Add NC report'} onClose={() => setFormOpen(false)}>
          {formError && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{formError}</div>
          )}
          <form onSubmit={handleSave} className="space-y-3" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Audit</label>
              {editing ? (
                <input disabled value={`${editing.audit_code} · ${editing.audit_type}`} className={`${inputClass} bg-slate-50`} />
              ) : (
                <select value={form.audit_id} onChange={(e) => set('audit_id', e.target.value)} className={inputClass}>
                  {auditsWithoutNC.length === 0 && <option value="">No audits without an NC report</option>}
                  {auditsWithoutNC.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.audit_code} · {a.audit_type}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NC raised on</label>
                <input type="date" value={form.raised_on} onChange={(e) => set('raised_on', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Acknowledged on</label>
                <input type="date" value={form.acknowledged_on} onChange={(e) => set('acknowledged_on', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as NCStatus)} className={inputClass}>
                {NC_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Progress: {form.progress}%</label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.progress}
                onChange={(e) => set('progress', Number(e.target.value))}
                className="w-full accent-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={3}
                maxLength={2000}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create NC'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <Modal title="Delete NC report?" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-600">
            The NC report for audit <b className="text-slate-900">{deleteTarget.audit_code}</b> will be permanently removed. The audit itself stays in the Audit Register.
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
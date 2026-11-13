'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  Inbox,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import {
  sections,
  pct,
  sumItems,
  useChecklistStore,
  useIsAdmin,
  type ChecklistItem,
} from '../sectionsData';

interface FormState {
  id?: number;
  description: string;
  allocated: string;
  actual: string;
  adjustable: string;
  remark: string;
}

const emptyForm: FormState = { description: '', allocated: '', actual: '', adjustable: '', remark: '' };

const inputCls =
  'w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition';

export default function SectionDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const isAdmin = useIsAdmin();
  const { items, loaded, upsertItem, deleteItem } = useChecklistStore();

  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<ChecklistItem | null>(null);

  const section = sections.find((s) => s.slug === slug);

  const BackButton = (
    <Link
      href="/sections"
      className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 shadow-sm transition"
    >
      <ArrowLeft className="w-4 h-4 text-slate-500" />
      <span>Back to Sections</span>
    </Link>
  );

  if (!section) {
    return (
      <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-4 lg:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">{BackButton}</div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-3 text-xl font-bold text-slate-800">Section not found</h1>
          <p className="mt-1 text-sm text-slate-500">
            &quot;{slug.replace(/-/g, ' ')}&quot; is not a valid audit section.
          </p>
        </div>
      </div>
    );
  }

  const list: ChecklistItem[] = items[slug] ?? [];
  const totals = sumItems(list);
  const scorePct = pct(totals.actual, totals.allocated);

  /* ----------------------------- Handlers ----------------------------- */

  const openAdd = () => {
    setFormError('');
    setForm({ ...emptyForm });
  };

  const openEdit = (item: ChecklistItem) => {
    setFormError('');
    setForm({
      id: item.id,
      description: item.description,
      allocated: String(item.allocated),
      actual: String(item.actual),
      adjustable: String(item.adjustable),
      remark: item.remark ?? '',
    });
  };

  const closeForm = () => {
    setForm(null);
    setFormError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const description = form.description.trim();
    const allocated = Number(form.allocated);
    const actual = Number(form.actual);
    const adjustable = Number(form.adjustable);

    if (!description) return setFormError('Audit description is required.');
    if ([form.allocated, form.actual, form.adjustable].some((v) => v.trim() === '') ||
        [allocated, actual, adjustable].some((n) => Number.isNaN(n))) {
      return setFormError('Allocated, Actual and Adjustable must be numbers.');
    }
    if (allocated < 0 || actual < 0 || adjustable < 0) return setFormError('Marks cannot be negative.');
    if (actual > allocated) return setFormError('Actual cannot be greater than Allocated.');
    if (adjustable > allocated) return setFormError('Adjustable cannot be greater than Allocated.');
    if (adjustable < actual) return setFormError('Adjustable cannot be less than Actual.');

    upsertItem(slug, {
      id: form.id,
      description,
      allocated,
      actual,
      adjustable,
      remark: form.remark.trim() || undefined,
    });
    closeForm();
  };

  const confirmDelete = () => {
    if (deleting) deleteItem(slug, deleting.id);
    setDeleting(null);
  };

  /* ----------------------------- Render ----------------------------- */

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-4 lg:p-8 space-y-6">
      {/* Back Button & Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        {BackButton}

        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-red-600 font-semibold">{section.category}</span>
          <p className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-0.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Responsible: <span className="font-semibold text-slate-800">{section.responsible}</span>
          </p>
        </div>
      </div>

      {/* Section Title & Summary */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Detailed Audit Checklist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{section.name}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Inspecting health, safety & environmental evaluation criteria and compliance findings.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0">
          <div className="text-center px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Allocated</span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900">{totals.allocated}</span>
          </div>
          <div className="text-center px-3 border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Actual</span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-amber-600">{totals.actual}</span>
          </div>
          <div className="text-center px-3 border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Adjustable</span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-indigo-600">{totals.adjustable}</span>
          </div>
          <div className="text-center px-3 border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Score %</span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600">{scorePct}%</span>
          </div>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Audit Criteria & Findings</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
              {list.length} Evaluated Items
            </span>
            {isAdmin && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Add Criterion
              </button>
            )}
          </div>
        </div>

        {!loaded ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">No audit criteria have been recorded for this section yet.</p>
            {isAdmin && (
              <button
                onClick={openAdd}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Add first criterion
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-100/80 text-[11px] sm:text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Audit Description / Criterion</th>
                  <th className="py-3.5 px-4 text-right">Allocated</th>
                  <th className="py-3.5 px-4 text-right">Actual</th>
                  <th className="py-3.5 px-4 text-right">Adjustable</th>
                  <th className="py-3.5 px-4">Remark / Observation</th>
                  {isAdmin && <th className="py-3.5 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium leading-relaxed">{item.description}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">{item.allocated}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600">{item.actual}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">{item.adjustable}</td>
                    <td className="py-3.5 px-4 text-xs">
                      {item.remark ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                          {item.remark}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          Compliant
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit"
                            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(item)}
                            title="Delete"
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isAdmin && form && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={closeForm}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {form.id !== undefined ? 'Edit Audit Criterion' : 'Add Audit Criterion'}
              </h2>
              <button type="button" onClick={closeForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Audit Description / Criterion
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Emergency exits pathways are not obstructed"
                  className={inputCls}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['allocated', 'actual', 'adjustable'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 capitalize">
                      {field}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Remark / Observation <span className="normal-case font-normal text-slate-400">(leave empty if compliant)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  placeholder="e.g. Obstruction found near adhesive room"
                  className={inputCls}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50/50 rounded-b-xl">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                {form.id !== undefined ? 'Save Changes' : 'Add Criterion'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isAdmin && deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setDeleting(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-50">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Delete this criterion?</h2>
                <p className="text-sm text-slate-500 mt-1">{deleting.description}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Section totals will be recalculated. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleting(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, RatingApi, RatingRule, Severity } from "@/lib/rating";
import SeverityBadge from "./SeverityBadge";

interface Props {
  open: boolean;
  api: RatingApi;
  /** Pre-select a category when the item already belongs to one. */
  defaultCategoryId?: number;
  onClose: () => void;
  onSelect: (rule: RatingRule) => void;
}

export default function RulePicker({ open, api, defaultCategoryId, onClose, onSelect }: Props) {
  const [severities, setSeverities] = useState<Severity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [severityId, setSeverityId] = useState<number | undefined>();
  const [categoryId, setCategoryId] = useState<number | undefined>(defaultCategoryId);
  const [rules, setRules] = useState<RatingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // load the two small lookup lists once, when the dialog first opens
  useEffect(() => {
    if (!open || severities.length) return;
    Promise.all([api.severities(), api.categories()])
      .then(([s, c]) => {
        setSeverities(s);
        setCategories(c);
      })
      .catch(() => setError("Could not load the rating lists. Check that the API is running."));
  }, [open, api, severities.length]);

  // search rules (debounced while typing)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      api
        .rules({ q: q.trim() || undefined, severity_id: severityId, category_id: categoryId })
        .then(setRules)
        .catch(() => setError("Could not load rules."))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [open, api, q, severityId, categoryId]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a rating rule"
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Choose a rating rule</h2>
          <p className="mt-1 text-sm text-slate-500">
            The item&apos;s Allocated score will be set from the rule&apos;s severity level.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the rule text"
              className="min-w-[14rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              aria-label="Category"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number}. {c.name}
                </option>
              ))}
            </select>
            <select
              value={severityId ?? ""}
              onChange={(e) => setSeverityId(e.target.value ? Number(e.target.value) : undefined)}
              aria-label="Severity"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All severities</option>
              {severities.map((s) => (
                <option key={s.id} value={s.id}>
                  CAT {String(s.level).padStart(2, "0")} ({s.marks} marks)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {error && <p className="p-4 text-sm text-red-700">{error}</p>}
          {!error && loading && <p className="p-4 text-sm text-slate-500">Loading rules…</p>}
          {!error && !loading && rules.length === 0 && (
            <p className="p-4 text-sm text-slate-500">
              No rule matches these filters. Clear the search or pick another category.
            </p>
          )}
          <ul>
            {rules.map((rule) => (
              <li key={rule.id}>
                <button
                  type="button"
                  onClick={() => onSelect(rule)}
                  className="flex w-full items-start justify-between gap-4 rounded-lg px-3 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  <span>
                    <span className="block text-sm text-slate-900">{rule.description}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {rule.category.name}, {rule.rule_code}
                      {rule.needs_review && <span className="ml-2 text-amber-700">Wording needs review</span>}
                    </span>
                  </span>
                  <SeverityBadge severity={rule.severity} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

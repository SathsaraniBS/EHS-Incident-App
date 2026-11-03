'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const inputClass =
  'w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SortTh({
  label,
  field,
  active,
  onSort,
}: {
  label: string;
  field: string;
  active: boolean;
  onSort: (field: string) => void;
}) {
  return (
    <th className="px-4 py-3.5">
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 uppercase ${active ? 'text-red-600' : ''}`}
      >
        {label} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}

export function useTable<T extends object>(
  rows: T[],
  initialKey: string,
  initialDir: 'asc' | 'desc' = 'desc'
) {
  const [sortKey, setSortKey] = useState(initialKey);
  const [dir, setDir] = useState<'asc' | 'desc'>(initialDir);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey];
      const bv = (b as unknown as Record<string, unknown>)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const c =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return dir === 'asc' ? c : -c;
    });
    return copy;
  }, [rows, sortKey, dir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    if (key === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setDir('asc');
    }
    setPage(1);
  };

  return {
    pageRows,
    total: sorted.length,
    page: safePage,
    totalPages,
    pageSize,
    sortKey,
    toggleSort,
    setPage,
    setPageSize: (n: number) => {
      setPageSize(n);
      setPage(1);
    },
  };
}

export function Pager({
  total,
  page,
  totalPages,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
      <span>Total rows: <b className="text-slate-900">{total}</b></span>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="rounded-md border border-slate-200 p-1.5 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-200 p-1.5 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
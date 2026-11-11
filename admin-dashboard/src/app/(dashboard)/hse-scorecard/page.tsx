'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Award, ArrowUpDown, RefreshCw, ShieldCheck } from 'lucide-react';

type ScoreRow = {
  id: number;
  no: number;
  section_id: number | null;
  section: string;
  responsible: string;
  allocated: number;
  actual: number;
  adjustable: number;
};

type ScorecardResponse = {
  cycle: { id: number; label: string };
  sections: ScoreRow[];
};

type Method = 'average' | 'weighted';
type SortMode = 'default' | 'lowest' | 'highest';

/* ---------------------------------------------------------------------------
 * SETTINGS - check these three lines against how your other dashboard pages work
 * ------------------------------------------------------------------------- */

// Backend address. Use the same env variable your other pages use.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// Where the login token is kept in the browser. Open any page that already calls
// the API (for example the compliance page) and copy how it reads the token.
const TOKEN_STORAGE_KEY = 'access_token';

// Section name links to `${SECTION_PAGE_BASE}/${section_id}`.
// Leave empty ('') until you know the Sections Audit page route, e.g. '/sections-audit'.
const SECTION_PAGE_BASE = '';

/* ------------------------------------------------------------------------- */

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function authHeaders(): HeadersInit {
  try {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function fetchScorecard(signal: AbortSignal): Promise<ScorecardResponse> {
  const res = await fetch(`${API_BASE}/api/v1/scorecard`, {
    signal,
    cache: 'no-store',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new ApiError('Your session has expired. Please sign in again.', 401);
  if (res.status === 403) throw new ApiError('You do not have permission to view the scorecard.', 403);
  if (res.status === 404) throw new ApiError('No scorecard data has been loaded yet.', 404);
  if (!res.ok) throw new ApiError(`The server returned an error (${res.status}).`, res.status);
  const json = (await res.json()) as ScorecardResponse;
  if (!json || !json.cycle || !Array.isArray(json.sections)) {
    throw new ApiError('The server sent an unexpected response.', 500);
  }
  return json;
}

const toPct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const fmt = (n: number) => n.toFixed(1);

function PercentBar({ value, tone }: { value: number; tone: 'actual' | 'adjustable' }) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-slate-100 sm:block" aria-hidden="true">
        <div
          className={`h-full rounded-full ${tone === 'actual' ? 'bg-slate-700' : 'bg-slate-300'}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-14 text-right tabular-nums">{fmt(value)}%</span>
    </div>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'default', label: 'Section order' },
  { value: 'lowest', label: 'Lowest first' },
  { value: 'highest', label: 'Highest first' },
];

const METHOD_OPTIONS: { value: Method; label: string }[] = [
  { value: 'average', label: 'Average of section %' },
  { value: 'weighted', label: 'Weighted by marks' },
];

export default function HseScorecardPage() {
  const [method, setMethod] = useState<Method>('average');
  const [sort, setSort] = useState<SortMode>('default');

  const [payload, setPayload] = useState<ScorecardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // first load only
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort(); // drop any request still in flight
    const controller = new AbortController();
    controllerRef.current = controller;
    setRefreshing(true);
    try {
      const json = await fetchScorecard(controller.signal);
      if (controller.signal.aborted) return;
      setPayload(json);
      setUpdatedAt(new Date());
      setError(null);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Could not load the scorecard.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Load on mount, and again whenever the user comes back to this tab/window,
  // so the page picks up audits that were saved elsewhere in the meantime.
  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      controllerRef.current?.abort();
    };
  }, [load]);

  const data = useMemo(() => {
    const rows = (payload?.sections ?? []).map((s) => ({
      ...s,
      actualPct: toPct(s.actual, s.allocated),
      adjustablePct: toPct(s.adjustable, s.allocated),
    }));

    const totals = rows.reduce(
      (acc, r) => ({
        allocated: acc.allocated + r.allocated,
        actual: acc.actual + r.actual,
        adjustable: acc.adjustable + r.adjustable,
      }),
      { allocated: 0, actual: 0, adjustable: 0 },
    );

    const count = rows.length || 1;
    const overallActual =
      method === 'weighted'
        ? toPct(totals.actual, totals.allocated)
        : rows.reduce((sum, r) => sum + r.actualPct, 0) / count;
    const overallAdjustable =
      method === 'weighted'
        ? toPct(totals.adjustable, totals.allocated)
        : rows.reduce((sum, r) => sum + r.adjustablePct, 0) / count;

    const lowest = rows.length ? rows.reduce((min, r) => (r.actualPct < min.actualPct ? r : min), rows[0]) : null;
    const perfect = rows.filter((r) => r.allocated > 0 && r.actual === r.allocated).length;

    return { rows, totals, overallActual, overallAdjustable, lowest, perfect };
  }, [payload, method]);

  const visibleRows = useMemo(() => {
    const copy = [...data.rows];
    if (sort === 'lowest') copy.sort((a, b) => a.actualPct - b.actualPct);
    if (sort === 'highest') copy.sort((a, b) => b.actualPct - a.actualPct);
    return copy;
  }, [data.rows, sort]);

  const period = payload?.cycle.label ?? '';

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 lg:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Award className="h-7 w-7 text-red-500" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-slate-800">HSE Scorecard</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Health, Safety &amp; Environment audit results by section.
            {period ? ` Period: ${period}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-slate-500">
              Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          {payload ? ' The figures below are from the last successful load.' : ''}
        </div>
      )}

      {loading ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading scorecard…
        </p>
      ) : !payload ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Nothing to show yet. Use Refresh to try again.
        </div>
      ) : (
        <>
          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="HSE score (actual)"
              value={`${fmt(data.overallActual)}%`}
              hint={
                method === 'average'
                  ? `Average of ${data.rows.length} section percentages`
                  : 'Total actual ÷ total allocated marks'
              }
            />
            <KpiCard
              label="HSE score (adjustable)"
              value={`${fmt(data.overallAdjustable)}%`}
              hint="Adjustable marks ÷ allocated marks"
            />
            <KpiCard
              label="Sections at full marks"
              value={`${data.perfect} of ${data.rows.length}`}
              hint="Actual score equals allocated score"
            />
            <KpiCard
              label="Lowest section"
              value={data.lowest ? `${fmt(data.lowest.actualPct)}%` : '–'}
              hint={data.lowest ? `${data.lowest.section} (${data.lowest.responsible})` : 'No sections available'}
            />
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <ShieldCheck className="h-5 w-5 text-red-500" aria-hidden="true" />
                  Section scores
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Actual % = actual ÷ allocated × 100. Adjustable % uses the adjustable score the same way.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div role="group" aria-label="Overall score method" className="inline-flex rounded-lg border border-slate-200 p-0.5">
                  {METHOD_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setMethod(o.value)}
                      aria-pressed={method === o.value}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        method === o.value ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                <div role="group" aria-label="Sort sections" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
                  <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" aria-hidden="true" />
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setSort(o.value)}
                      aria-pressed={sort === o.value}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        sort === o.value ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-sm">
                <caption className="sr-only">HSE audit scores by section for {period}</caption>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-4 py-3 text-left font-semibold">No</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">Section</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">Responsible</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Allocated</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Actual</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Adjustable</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Actual %</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Adjustable %</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400 tabular-nums">{r.no}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {SECTION_PAGE_BASE && r.section_id !== null ? (
                          <Link href={`${SECTION_PAGE_BASE}/${r.section_id}`} className="hover:text-red-600 hover:underline">
                            {r.section}
                          </Link>
                        ) : (
                          r.section
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.responsible}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.allocated}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.actual}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.adjustable}</td>
                      <td className="px-4 py-3"><PercentBar value={r.actualPct} tone="actual" /></td>
                      <td className="px-4 py-3"><PercentBar value={r.adjustablePct} tone="adjustable" /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                    <td className="px-4 py-3" colSpan={3}>
                      Overall ({method === 'average' ? 'average of section %' : 'weighted by marks'})
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{data.totals.allocated}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{data.totals.actual}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{data.totals.adjustable}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(data.overallActual)}%</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(data.overallAdjustable)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
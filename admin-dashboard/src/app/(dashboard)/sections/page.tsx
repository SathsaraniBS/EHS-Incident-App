'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Award, ArrowUpDown, RefreshCw, ShieldCheck } from 'lucide-react';

type ScoreRow = {
  id: number;
  no: number;
  slug: string;
  section: string;
  responsible: string;
  allocated: number;
  actual: number;
  adjustable: number;
  evaluatedItems: number;
  totalItems: number;
};

type ScorecardData = {
  periodLabel: string;
  sections: ScoreRow[];
};

type Method = 'average' | 'weighted';
type SortMode = 'default' | 'lowest' | 'highest';
type RowStatus = 'not-started' | 'in-progress' | 'completed';

/* ---------------------------------------------------------------------------
 * DATA LOADING
 * This page uses the same Next.js routes as the Sections Audit page
 * (/api/sections and /api/sections/cycles). They run on the server, read the
 * login cookie and call the FastAPI backend for you, so no token handling is
 * needed in this file.
 * ------------------------------------------------------------------------- */

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Raw = Record<string, unknown>;

// The backend may send snake_case or camelCase; accept both.
const pick = (o: Raw, ...keys: string[]): unknown => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' && v.trim() ? v : fallback);

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, cache: 'no-store', credentials: 'same-origin' });
  if (res.status === 401) throw new ApiError('Your session has expired. Please sign in again.', 401);
  if (res.status === 403) throw new ApiError('You do not have permission to view the scorecard.', 403);
  if (res.status === 404) throw new ApiError('No audit cycle has been created yet.', 404);
  if (!res.ok) throw new ApiError(`The server returned an error (${res.status}).`, res.status);
  return res.json();
}

async function fetchScorecard(signal: AbortSignal): Promise<ScorecardData> {
  const sectionsJson = await getJson('/api/sections', signal);
  if (!Array.isArray(sectionsJson)) {
    throw new ApiError('The server sent an unexpected response.', 500);
  }

  // The period label is nice to have; the page still works without it.
  let periodLabel = '';
  try {
    const cyclesJson = await getJson('/api/sections/cycles', signal);
    if (Array.isArray(cyclesJson) && cyclesJson.length > 0) {
      const first = cyclesJson[0] as Raw;
      periodLabel = str(pick(first, 'label', 'name'));
    }
  } catch (err) {
    if (signal.aborted) throw err;
  }

  const sections: ScoreRow[] = (sectionsJson as Raw[]).map((s, i) => ({
    id: num(pick(s, 'id')),
    no: i + 1,
    slug: str(pick(s, 'slug')),
    section: str(pick(s, 'name'), 'Unnamed section'),
    responsible: str(pick(s, 'responsible', 'responsible_person'), 'Not Assigned'),
    allocated: num(pick(s, 'allocated_score', 'allocatedScore', 'allocated')),
    actual: num(pick(s, 'actual_score', 'actualScore', 'actual')),
    adjustable: num(pick(s, 'adjustable_score', 'adjustableScore', 'adjustable')),
    evaluatedItems: num(pick(s, 'evaluated_items', 'evaluatedItems')),
    totalItems: num(pick(s, 'total_items', 'totalItems')),
  }));

  return { periodLabel, sections };
}

/* ------------------------------------------------------------------------- */

const toPct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const fmt = (n: number) => n.toFixed(1);

const getStatus = (evaluated: number, total: number): RowStatus => {
  if (evaluated <= 0) return 'not-started';
  if (evaluated < total) return 'in-progress';
  return 'completed';
};

const STATUS_STYLE: Record<RowStatus, { label: string; className: string }> = {
  'not-started': { label: 'Not started', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  'in-progress': { label: 'In progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

// 90% and above green, 75-89% amber, below 75% red
const scoreText = (p: number) => (p >= 90 ? 'text-emerald-600' : p >= 75 ? 'text-amber-600' : 'text-rose-600');
const scoreBar = (p: number) => (p >= 90 ? 'bg-emerald-500' : p >= 75 ? 'bg-amber-500' : 'bg-rose-500');

function PercentBar({
  value,
  tone,
  colored,
}: {
  value: number;
  tone: 'actual' | 'adjustable';
  colored: boolean;
}) {
  const width = Math.min(100, Math.max(0, value));
  const barClass = tone === 'adjustable' ? 'bg-slate-300' : colored ? scoreBar(value) : 'bg-slate-700';
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-slate-100 sm:block" aria-hidden="true">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
      </div>
      <span
        className={`w-14 text-right tabular-nums ${tone === 'actual' && colored ? `font-semibold ${scoreText(value)}` : ''}`}
      >
        {fmt(value)}%
      </span>
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

  const [payload, setPayload] = useState<ScorecardData | null>(null);
  const [error, setError] = useState<{ message: string; status: number } | null>(null);
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
      if (err instanceof ApiError) {
        setError({ message: err.message, status: err.status });
      } else {
        setError({ message: 'Could not load the scorecard.', status: 0 });
      }
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
      evaluated: s.evaluatedItems > 0,
      status: getStatus(s.evaluatedItems, s.totalItems),
      actualPct: toPct(s.actual, s.allocated),
      adjustablePct: toPct(s.adjustable, s.allocated),
    }));

    // Only sections that have been audited count towards the overall score,
    // so sections that are still waiting do not pull the result down.
    const started = rows.filter((r) => r.evaluated);

    const totals = started.reduce(
      (acc, r) => ({
        allocated: acc.allocated + r.allocated,
        actual: acc.actual + r.actual,
        adjustable: acc.adjustable + r.adjustable,
      }),
      { allocated: 0, actual: 0, adjustable: 0 },
    );

    const count = started.length;
    const overallActual =
      count === 0
        ? null
        : method === 'weighted'
          ? toPct(totals.actual, totals.allocated)
          : started.reduce((sum, r) => sum + r.actualPct, 0) / count;
    const overallAdjustable =
      count === 0
        ? null
        : method === 'weighted'
          ? toPct(totals.adjustable, totals.allocated)
          : started.reduce((sum, r) => sum + r.adjustablePct, 0) / count;

    const lowest = started.length
      ? started.reduce((min, r) => (r.actualPct < min.actualPct ? r : min), started[0])
      : null;
    const perfect = started.filter((r) => r.allocated > 0 && r.actual === r.allocated).length;

    const itemsEvaluated = rows.reduce((sum, r) => sum + r.evaluatedItems, 0);
    const itemsTotal = rows.reduce((sum, r) => sum + r.totalItems, 0);

    return { rows, started, totals, overallActual, overallAdjustable, lowest, perfect, itemsEvaluated, itemsTotal };
  }, [payload, method]);

  const visibleRows = useMemo(() => {
    const copy = [...data.rows];
    if (sort === 'default') return copy;
    const dir = sort === 'lowest' ? 1 : -1;
    // Sections that are not evaluated yet always go to the bottom.
    copy.sort((a, b) => {
      if (a.evaluated !== b.evaluated) return a.evaluated ? -1 : 1;
      return (a.actualPct - b.actualPct) * dir;
    });
    return copy;
  }, [data.rows, sort]);

  const period = payload?.periodLabel ?? '';
  const noneEvaluated = data.started.length === 0;

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
          {error.message}
          {error.status === 401 && (
            <>
              {' '}
              <Link href="/login" className="font-semibold underline">
                Sign in
              </Link>
            </>
          )}
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
              value={data.overallActual === null ? '–' : `${fmt(data.overallActual)}%`}
              hint={
                noneEvaluated
                  ? 'No section has been evaluated yet'
                  : method === 'average'
                    ? `Average of ${data.started.length} evaluated section percentages`
                    : 'Total actual ÷ total allocated marks (evaluated sections)'
              }
            />
            <KpiCard
              label="HSE score (adjustable)"
              value={data.overallAdjustable === null ? '–' : `${fmt(data.overallAdjustable)}%`}
              hint="Adjustable marks ÷ allocated marks (evaluated sections)"
            />
            <KpiCard
              label="Sections evaluated"
              value={`${data.started.length} of ${data.rows.length}`}
              hint={`${data.itemsEvaluated} of ${data.itemsTotal} items audited · ${data.perfect} at full marks`}
            />
            <KpiCard
              label="Lowest section"
              value={data.lowest ? `${fmt(data.lowest.actualPct)}%` : '–'}
              hint={data.lowest ? `${data.lowest.section} (${data.lowest.responsible})` : 'No evaluated sections yet'}
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
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" /> 90% and above
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true" /> 75–89%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" /> Below 75%
                  </span>
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

            {data.rows.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">
                No sections found. Add sections in Section Management, then come back.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[64rem] text-sm">
                  <caption className="sr-only">HSE audit scores by section for {period}</caption>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="px-4 py-3 text-left font-semibold">No</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Section</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Responsible</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Allocated</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Actual</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Adjustable</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Actual %</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Adjustable %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((r) => {
                      const badge = STATUS_STYLE[r.status];
                      return (
                        <tr
                          key={r.id}
                          className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                            r.evaluated ? '' : 'text-slate-400'
                          }`}
                        >
                          <td className="px-4 py-3 text-slate-400 tabular-nums">{r.no}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {r.slug ? (
                              <Link href={`/sections/${r.slug}`} className="hover:text-red-600 hover:underline">
                                {r.section}
                              </Link>
                            ) : (
                              r.section
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{r.responsible}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{r.allocated}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{r.evaluated ? r.actual : '–'}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{r.evaluated ? r.adjustable : '–'}</td>
                          <td className="px-4 py-3">
                            {r.evaluated ? (
                              <PercentBar value={r.actualPct} tone="actual" colored />
                            ) : (
                              <span className="block text-right text-xs">Not evaluated</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {r.evaluated ? (
                              <PercentBar value={r.adjustablePct} tone="adjustable" colored={false} />
                            ) : (
                              <span className="block text-right text-xs">–</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                      <td className="px-4 py-3" colSpan={4}>
                        Overall ({method === 'average' ? 'average of section %' : 'weighted by marks'}) ·{' '}
                        {data.started.length} of {data.rows.length} sections evaluated
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{data.totals.allocated}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{data.totals.actual}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{data.totals.adjustable}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {data.overallActual === null ? '–' : `${fmt(data.overallActual)}%`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {data.overallAdjustable === null ? '–' : `${fmt(data.overallAdjustable)}%`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
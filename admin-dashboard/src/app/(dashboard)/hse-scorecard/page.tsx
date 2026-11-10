'use client';

import { useMemo, useState } from 'react';
import { Award, ArrowUpDown, ShieldCheck } from 'lucide-react';

type SectionScore = {
  no: number;
  section: string;
  responsible: string;
  allocated: number;
  actual: number;
  adjustable: number;
};

type Method = 'average' | 'weighted';
type SortMode = 'default' | 'lowest' | 'highest';

/**
 * DATA SOURCE (temporary)
 * Snapshot of the "Dashboard" sheet in the workbook
 * "November 1st & 2nd week health and Safety audit score.xlsx".
 * Only the three score columns are stored. Every percentage on this page is
 * calculated from them (the workbook's own % columns were typed by hand and
 * some of them are out of date).
 *
 * When the backend endpoint exists, replace SECTIONS with the API response
 * (same shape: no, section, responsible, allocated, actual, adjustable).
 */
const PERIOD_LABEL = '1st & 2nd Week, November 2026';

const SECTIONS: SectionScore[] = [
  { no: 1, section: 'General Maintenance', responsible: 'Ruwandika', allocated: 465, actual: 305, adjustable: 350 },
  { no: 2, section: 'Admin', responsible: 'Dalton', allocated: 275, actual: 205, adjustable: 255 },
  { no: 3, section: 'RM Stores', responsible: 'Chandrasiri', allocated: 235, actual: 220, adjustable: 230 },
  { no: 4, section: 'FG', responsible: 'Chandrasiri', allocated: 155, actual: 140, adjustable: 140 },
  { no: 5, section: 'Accessories', responsible: 'Sampath', allocated: 230, actual: 145, adjustable: 185 },
  { no: 6, section: 'Cutting', responsible: 'Chamila', allocated: 155, actual: 155, adjustable: 155 },
  { no: 7, section: 'Ground floor modules & Molding', responsible: 'Gamini', allocated: 265, actual: 195, adjustable: 225 },
  { no: 8, section: 'Packing', responsible: 'Gamini', allocated: 140, actual: 140, adjustable: 140 },
  { no: 9, section: 'Audit room & Final Inspection', responsible: 'Lalinda', allocated: 95, actual: 95, adjustable: 95 },
  { no: 10, section: 'Lab & CPI', responsible: 'Chandani', allocated: 130, actual: 120, adjustable: 130 },
  { no: 11, section: 'Screen Printing & Modules', responsible: 'Gamini', allocated: 210, actual: 125, adjustable: 140 },
  { no: 12, section: 'Sample Room', responsible: 'Samitha', allocated: 180, actual: 180, adjustable: 180 },
  { no: 13, section: 'Coating', responsible: 'Chandani', allocated: 205, actual: 190, adjustable: 190 },
  { no: 14, section: 'Forte', responsible: 'Cooray', allocated: 180, actual: 170, adjustable: 180 },
  { no: 15, section: 'IE', responsible: 'Dilan', allocated: 220, actual: 130, adjustable: 150 },
  { no: 16, section: 'Training School', responsible: 'Dilan', allocated: 130, actual: 130, adjustable: 130 },
  { no: 17, section: 'Medical Centre', responsible: 'Nadee', allocated: 100, actual: 95, adjustable: 95 },
];

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

  const data = useMemo(() => {
    const rows = SECTIONS.map((s) => ({
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

    const lowest = rows.reduce((min, r) => (r.actualPct < min.actualPct ? r : min), rows[0]);
    const perfect = rows.filter((r) => r.actual === r.allocated).length;

    return { rows, totals, overallActual, overallAdjustable, lowest, perfect };
  }, [method]);

  const visibleRows = useMemo(() => {
    const copy = [...data.rows];
    if (sort === 'lowest') copy.sort((a, b) => a.actualPct - b.actualPct);
    if (sort === 'highest') copy.sort((a, b) => b.actualPct - a.actualPct);
    return copy;
  }, [data.rows, sort]);

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 lg:p-8">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <Award className="h-7 w-7 text-red-500" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-800">HSE Scorecard</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Health, Safety &amp; Environment audit results by section. Period: {PERIOD_LABEL}
        </p>
      </header>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="HSE score (actual)"
          value={`${fmt(data.overallActual)}%`}
          hint={method === 'average' ? `Average of ${data.rows.length} section percentages` : 'Total actual ÷ total allocated marks'}
        />
        <KpiCard
          label="HSE score (adjustable)"
          value={`${fmt(data.overallAdjustable)}%`}
          hint="If the open findings are corrected"
        />
        <KpiCard
          label="Sections at full marks"
          value={`${data.perfect} of ${data.rows.length}`}
          hint="Actual score equals allocated score"
        />
        <KpiCard
          label="Lowest section"
          value={`${fmt(data.lowest.actualPct)}%`}
          hint={`${data.lowest.section} (${data.lowest.responsible})`}
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
            <caption className="sr-only">HSE audit scores by section for {PERIOD_LABEL}</caption>
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
                <tr key={r.no} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 tabular-nums">{r.no}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.section}</td>
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

      <p className="mt-4 text-xs text-slate-500">
        Scores shown are a snapshot of the audit workbook for {PERIOD_LABEL}. They will update automatically once this page is
        connected to the audit API.
      </p>
    </div>
  );
}
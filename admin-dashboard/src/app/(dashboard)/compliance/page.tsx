'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardCheck,
  FileWarning,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { api, formatDate, statusBadge, type NCReport, type Summary } from '@/lib/compliance';

export default function ComplianceDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api<Summary>('summary'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    { label: 'Pending NC Acknowledged', value: data?.pending_nc_count ?? 0, icon: AlertTriangle, tone: 'text-amber-600' },
    { label: 'Pending Audits', value: data?.pending_audits_count ?? 0, icon: ClipboardCheck, tone: 'text-indigo-600' },
    { label: 'Open NCs (progress < 100%)', value: data?.open_nc_count ?? 0, icon: FileWarning, tone: 'text-red-600' },
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-4 lg:p-8 space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Bondville EHS Division</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Compliance Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Audit schedule and non-conformance overview.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 transition"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>{label}</span>
              <Icon className={`h-5 w-5 ${tone}`} />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
          </div>
        ))}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Last Audited Date</span>
            <CalendarCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatDate(data?.last_audited_date)}</p>
        </div>
      </div>

      {/* Pending NC acknowledged */}
      <Section title="Pending NC Acknowledged" count={data?.pending_ncs.length ?? 0} unit="items" defaultOpen={false}>
        {data && data.pending_ncs.length > 0 ? (
          <NCTable rows={data.pending_ncs} />
        ) : (
          <Empty text="No pending NC acknowledgements." />
        )}
      </Section>

      {/* Recent NC acknowledged */}
      <Section title="Recent NC Acknowledged" count={data?.recent_acknowledged.length ?? 0} unit="items" defaultOpen>
        {data && data.recent_acknowledged.length > 0 ? (
          <NCTable rows={data.recent_acknowledged} />
        ) : (
          <Empty text="No acknowledged NCs yet." />
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  unit,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  unit: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {count} {unit}
        </span>
      </summary>
      <div className="border-t border-slate-100 p-3">{children}</div>
    </details>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-8 text-center text-sm text-slate-500">{text}</div>;
}

function NCTable({ rows }: { rows: NCReport[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs sm:text-sm text-slate-700">
        <thead className="text-[11px] sm:text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3">Audit ID</th>
            <th className="px-4 py-3">Factory</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Scheduled</th>
            <th className="px-4 py-3">Start</th>
            <th className="px-4 py-3">End</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((n) => (
            <tr key={n.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3 font-mono font-bold text-red-600">#{n.audit_code}</td>
              <td className="px-4 py-3">{n.factory_name}</td>
              <td className="px-4 py-3">
                <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${statusBadge(n.acknowledged_on ? 'Acknowledged' : n.status)}`}>
                  {n.acknowledged_on ? 'Acknowledged' : n.status}
                </span>
              </td>
              <td className="px-4 py-3">{formatDate(n.scheduled_date)}</td>
              <td className="px-4 py-3">{formatDate(n.actual_start_date)}</td>
              <td className="px-4 py-3">{formatDate(n.end_date)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href="/compliance/nc"
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  View NC
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
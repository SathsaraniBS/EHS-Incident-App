// src/lib/compliance.ts
export const AUDIT_STATUSES = ['Scheduled', 'In Progress', 'Closed'] as const;
export const NC_STATUSES = ['Pending', 'NC Sent', 'Acknowledged', 'Closed'] as const;

export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type NCStatus = (typeof NC_STATUSES)[number];

export interface Audit {
  id: number;
  audit_code: string;
  factory_name: string;
  audit_type: string;
  auditor_name: string | null;
  scheduled_date: string;
  actual_start_date: string | null;
  end_date: string | null;
  status: AuditStatus;
}

export interface NCReport {
  id: number;
  audit_id: number;
  audit_code: string;
  factory_name: string;
  audit_type: string;
  audit_status: AuditStatus;
  scheduled_date: string;
  actual_start_date: string | null;
  end_date: string | null;
  raised_on: string | null;
  acknowledged_on: string | null;
  status: NCStatus;
  progress: number;
  notes: string | null;
}

export interface Summary {
  pending_nc_count: number;
  pending_audits_count: number;
  open_nc_count: number;
  last_audited_date: string | null;
  pending_ncs: NCReport[];
  recent_acknowledged: NCReport[];
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/compliance/${path}`, {
    cache: 'no-store',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data as T;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  const mi = Number(m) - 1;
  if (!y || !d || mi < 0 || mi > 11) return iso;
  return `${d}-${MONTHS[mi]}-${y}`;
}

export function statusBadge(status: string): string {
  switch (status) {
    case 'Closed':
    case 'Acknowledged':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'In Progress':
    case 'NC Sent':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Scheduled':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'; // Pending
  }
}
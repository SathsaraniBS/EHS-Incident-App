'use client';

import { useCallback, useEffect, useState } from 'react';

/* ----------------------------- Types ----------------------------- */

export interface ChecklistItem {
  id: number;
  category?: string | null;
  description: string;
  allocated: number;
  actual: number | null; // null = not evaluated in this cycle yet
  adjustable: number | null;
  remark?: string | null;
  evaluated: boolean;
}

export interface AuditSection {
  id: number;
  name: string;
  slug: string;
  responsible: string;
  category: string;
  allocatedScore: number;
  actualScore: number;
  adjustableScore: number;
  totalItems: number;
  evaluatedItems: number;
}

export interface AuditCycle {
  id: number;
  label: string;
  start_date?: string | null;
  end_date?: string | null;
}

export type ItemInput = {
  id?: number;
  category?: string;
  description: string;
  allocated: number;
  actual: number;
  adjustable: number;
  remark?: string;
};

/* ----------------------------- Helpers ----------------------------- */

export const pct = (actual: number, allocated: number) =>
  allocated > 0 ? Math.round((actual / allocated) * 100) : 0;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Calls the Next.js proxy (src/app/api/sections/[[...path]]/route.ts), which adds
 * the login cookie's token and forwards to FastAPI. The browser never sees the token.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/sections${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login';
    throw new ApiError('Session expired. Please sign in again.', 401);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = Array.isArray(body.detail)
      ? body.detail.map((d: { msg?: string }) => d.msg).join(', ')
      : body.detail;
    throw new ApiError(detail || `Request failed (${res.status})`, res.status);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

/* ----------------------------- API -> UI mapping ----------------------------- */

interface ApiSection {
  id: number;
  name: string;
  slug: string;
  responsible: string;
  category: string;
  allocated_score: number;
  actual_score: number;
  adjustable_score: number;
  total_items: number;
  evaluated_items: number;
  cycle?: AuditCycle;
  items?: ChecklistItem[];
}

const toSection = (s: ApiSection): AuditSection => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  responsible: s.responsible,
  category: s.category,
  allocatedScore: s.allocated_score,
  actualScore: s.actual_score,
  adjustableScore: s.adjustable_score,
  totalItems: s.total_items,
  evaluatedItems: s.evaluated_items,
});

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/* ----------------------------- Hooks ----------------------------- */

/** Admin check for showing/hiding buttons only. The server enforces it for real. */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const role = data?.role ?? data?.user?.role;
        if (alive) setIsAdmin(role === 'admin');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return isAdmin;
}

/** Section cards for the latest audit cycle. */
export function useSections() {
  const [sections, setSections] = useState<AuditSection[]>([]);
  const [cycle, setCycle] = useState<AuditCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [cycles, data] = await Promise.all([
        request<AuditCycle[]>('/cycles'),
        request<ApiSection[]>(''),
      ]);
      setCycle(cycles[0] ?? null); // newest first
      setSections(data.map(toSection));
    } catch (e) {
      setError(errMsg(e, 'Failed to load sections'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { sections, cycle, loading, error, reload };
}

/** One section with its checklist for the latest audit cycle. */
export function useSectionDetail(slug: string) {
  const [section, setSection] = useState<AuditSection | null>(null);
  const [cycle, setCycle] = useState<AuditCycle | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setNotFound(false);
      const data = await request<ApiSection>(`/${encodeURIComponent(slug)}`);
      setSection(toSection(data));
      setCycle(data.cycle ?? null);
      setItems(data.items ?? []);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404 && /section/i.test(e.message)) setNotFound(true);
      else setError(errMsg(e, 'Failed to load section'));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Saves to the database, then reloads so the totals always come from the server.
  const upsertItem = useCallback(
    async (input: ItemInput) => {
      const { id, ...body } = input;
      if (id !== undefined) {
        await request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await request(`/${encodeURIComponent(slug)}/items`, { method: 'POST', body: JSON.stringify(body) });
      }
      await reload();
    },
    [slug, reload]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      await request(`/items/${id}`, { method: 'DELETE' });
      await reload();
    },
    [reload]
  );

  return { section, cycle, items, loading, error, notFound, upsertItem, deleteItem, reload };
}
'use client';

import { useCallback, useEffect, useState } from 'react';

/* ----------------------------- Types ----------------------------- */

export interface ChecklistItem {
  id: number;
  description: string;
  allocated: number;
  actual: number;
  adjustable: number;
  remark?: string;
}

export interface AuditSection {
  id: number;
  name: string;
  slug: string;
  responsible: string;
  category: string;
  // Baseline scores, used only until a section has checklist items
  allocatedScore: number;
  actualScore: number;
  adjustableScore: number;
}

/* ----------------------------- Sections ----------------------------- */

export const sections: AuditSection[] = [
  { id: 1, name: 'General Maintenance', slug: 'general-maintenance', responsible: 'Ruwandika', category: 'Engineering / Factory Premises', allocatedScore: 465, actualScore: 265, adjustableScore: 330 },
  { id: 2, name: 'Admin', slug: 'admin', responsible: 'Dalton', category: 'Factory Premises / Guard Room / Canteen', allocatedScore: 265, actualScore: 225, adjustableScore: 245 },
  { id: 3, name: 'RM Stores', slug: 'rm-stores', responsible: 'Chandrasiri', category: 'Loading bay / RM Stores / Chemical room', allocatedScore: 235, actualScore: 205, adjustableScore: 215 },
  { id: 4, name: 'FG', slug: 'fg', responsible: 'Chandrasiri', category: 'Finished Goods', allocatedScore: 155, actualScore: 130, adjustableScore: 130 },
  { id: 5, name: 'Accessories', slug: 'accessories', responsible: 'Sampath', category: 'Accessories', allocatedScore: 225, actualScore: 160, adjustableScore: 180 },
  { id: 6, name: 'Cutting', slug: 'cutting', responsible: 'Chamila', category: 'Cutting', allocatedScore: 155, actualScore: 155, adjustableScore: 155 },
  { id: 7, name: 'Ground floor modules & Molding', slug: 'ground-floor-modules-molding', responsible: 'Gamini', category: 'Production', allocatedScore: 265, actualScore: 205, adjustableScore: 225 },
  { id: 8, name: 'Packing', slug: 'packing', responsible: 'Gamini', category: 'Production', allocatedScore: 140, actualScore: 140, adjustableScore: 140 },
  { id: 9, name: 'Audit room & Final Inspection', slug: 'audit-room-final-inspection', responsible: 'Lalinda', category: 'Quality', allocatedScore: 95, actualScore: 80, adjustableScore: 95 },
  { id: 10, name: 'Lab & CPI', slug: 'lab-cpi', responsible: 'Chandani', category: 'Quality', allocatedScore: 130, actualScore: 115, adjustableScore: 130 },
  { id: 11, name: 'Screen Printing & Modules', slug: 'screen-printing-modules', responsible: 'Gamini', category: 'Production', allocatedScore: 210, actualScore: 125, adjustableScore: 140 },
  { id: 12, name: 'Sample Room', slug: 'sample-room', responsible: 'Samitha', category: 'Sample Room', allocatedScore: 180, actualScore: 170, adjustableScore: 180 },
  { id: 13, name: 'Coating', slug: 'coating', responsible: 'Chandani', category: 'Production', allocatedScore: 205, actualScore: 190, adjustableScore: 190 },
  { id: 14, name: 'Forte', slug: 'forte', responsible: 'Cooray', category: 'Production', allocatedScore: 180, actualScore: 180, adjustableScore: 180 },
  { id: 15, name: 'IE', slug: 'ie', responsible: 'Dilan', category: 'Industrial Engineering', allocatedScore: 220, actualScore: 130, adjustableScore: 150 },
  { id: 16, name: 'Training School', slug: 'training-school', responsible: 'Dilan', category: 'Training', allocatedScore: 130, actualScore: 130, adjustableScore: 130 },
  { id: 17, name: 'Medical Centre', slug: 'medical-centre', responsible: 'Nadee', category: 'Medical', allocatedScore: 100, actualScore: 95, adjustableScore: 95 },
];

/* ----------------------------- Default checklist data ----------------------------- */

export const defaultItems: Record<string, ChecklistItem[]> = {
  'general-maintenance': [
    { id: 1, description: 'Table, chairs, Tap and electric equipment, fences not broken (Boiler, Fan, Light, Emergency light)', allocated: 20, actual: 0, adjustable: 20, remark: 'Catering Table broken, Cupboard doors broken' },
    { id: 2, description: 'Squatting pans, commodes, wash basins, tiles and doors in good condition', allocated: 20, actual: 20, adjustable: 20 },
    { id: 3, description: 'Insufficient number of toilets in ratio', allocated: 10, actual: 10, adjustable: 10 },
    { id: 4, description: 'Condition monitoring system available for fire pump system', allocated: 5, actual: 5, adjustable: 5 },
    { id: 5, description: 'Contractors use suitable PPEs depending on nature of work', allocated: 15, actual: 15, adjustable: 15 },
  ],
  admin: [
    { id: 1, description: 'Separate waste collection bins provided (Foot operated or closed lid)', allocated: 10, actual: 10, adjustable: 10 },
    { id: 2, description: 'All food handling areas free of pests/animals and maintaining hygiene', allocated: 5, actual: 5, adjustable: 5 },
    { id: 3, description: 'Kitchen is designed to prevent cross-contamination', allocated: 15, actual: 0, adjustable: 0, remark: 'Corrective action not taken as per PHI record' },
    { id: 4, description: 'Covered bins available in toilets', allocated: 10, actual: 10, adjustable: 10 },
  ],
  'rm-stores': [
    { id: 1, description: 'Emergency Exit doors are not closed', allocated: 20, actual: 20, adjustable: 20 },
    { id: 2, description: 'Emergency exits pathways are not obstructed', allocated: 10, actual: 0, adjustable: 10, remark: 'Obstruction found near adhesive room' },
    { id: 3, description: 'Smoke detectors & Fire fighting equipment not obstructed', allocated: 10, actual: 10, adjustable: 10 },
  ],
};

/* ----------------------------- Helpers ----------------------------- */

export const pct = (actual: number, allocated: number) =>
  allocated > 0 ? Math.round((actual / allocated) * 100) : 0;

export const sumItems = (items: ChecklistItem[]) => ({
  allocated: items.reduce((a, i) => a + i.allocated, 0),
  actual: items.reduce((a, i) => a + i.actual, 0),
  adjustable: items.reduce((a, i) => a + i.adjustable, 0),
});

/**
 * TODO: replace with your real auth check (session / JWT / context).
 * Until then every user of this dashboard is treated as admin.
 */
export function useIsAdmin(): boolean {
  return true;
}

/* ----------------------------- Store (localStorage) ----------------------------- */

const STORAGE_KEY = 'ehs-sections-audit-items-v1';

export type ItemInput = Omit<ChecklistItem, 'id'> & { id?: number };

/**
 * Shared checklist store. Persisted in localStorage so the list page and detail
 * page stay in sync. To use a real database later, replace upsertItem/deleteItem
 * with API calls (fetch to your backend) and keep the same signatures.
 */
export function useChecklistStore() {
  const [items, setItems] = useState<Record<string, ChecklistItem[]>>(defaultItems);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupted storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / unavailable */
    }
  }, [items, loaded]);

  const upsertItem = useCallback((slug: string, input: ItemInput) => {
    setItems((prev) => {
      const list = prev[slug] ?? [];
      if (input.id !== undefined) {
        return {
          ...prev,
          [slug]: list.map((it) => (it.id === input.id ? ({ ...input, id: it.id } as ChecklistItem) : it)),
        };
      }
      const nextId = list.reduce((m, it) => Math.max(m, it.id), 0) + 1;
      return { ...prev, [slug]: [...list, { ...input, id: nextId } as ChecklistItem] };
    });
  }, []);

  const deleteItem = useCallback((slug: string, id: number) => {
    setItems((prev) => ({ ...prev, [slug]: (prev[slug] ?? []).filter((it) => it.id !== id) }));
  }, []);

  return { items, loaded, upsertItem, deleteItem };
}
export interface ChecklistCriterion {
  id: string;
  description: string;
  allocated: number;
  actual: number;
  adjustable: number;
  remark: string;
  status: 'Compliant' | 'Non-Compliant' | 'Pending';
}

export interface ManagedSection {
  id: number;
  name: string;
  slug: string;
  category: string;
  responsible: string;
  isActive: boolean;
  criteria: ChecklistCriterion[];
}

const STORAGE_KEY = 'bondville_managed_sections_v1';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const DEFAULT_SECTIONS: ManagedSection[] = [
  {
    id: 1,
    name: 'General Maintenance',
    slug: 'general-maintenance',
    category: 'Engineering / Factory Premises',
    responsible: 'Ruwandika',
    isActive: true,
    criteria: [
      { id: 'gm-1', description: 'Table, chairs, Tap and electric equipment, fences not broken (Boiler, Fan, Light, Emergency light)', allocated: 20, actual: 0, adjustable: 20, remark: 'Catering Table broken, Cupboard doors broken', status: 'Non-Compliant' },
      { id: 'gm-2', description: 'Squatting pans, commodes, wash basins, tiles and doors in good condition', allocated: 20, actual: 20, adjustable: 20, remark: '', status: 'Compliant' },
      { id: 'gm-3', description: 'Condition monitoring system available for fire pump system', allocated: 5, actual: 5, adjustable: 5, remark: '', status: 'Compliant' },
    ],
  },
  {
    id: 2,
    name: 'Admin',
    slug: 'admin',
    category: 'Factory Premises / Guard Room / Canteen',
    responsible: 'Dalton',
    isActive: true,
    criteria: [
      { id: 'adm-1', description: 'Separate waste collection bins provided (Foot operated or closed lid)', allocated: 10, actual: 10, adjustable: 10, remark: '', status: 'Compliant' },
      { id: 'adm-2', description: 'Kitchen is designed to prevent cross-contamination', allocated: 15, actual: 0, adjustable: 0, remark: 'Corrective action not taken as per PHI record', status: 'Non-Compliant' },
    ],
  },
  {
    id: 3,
    name: 'RM Stores',
    slug: 'rm-stores',
    category: 'Loading bay / RM Stores / Chemical room',
    responsible: 'Chandrasiri',
    isActive: true,
    criteria: [
      { id: 'rm-1', description: 'Emergency Exit doors are not closed', allocated: 20, actual: 20, adjustable: 20, remark: '', status: 'Compliant' },
      { id: 'rm-2', description: 'Emergency exits pathways are not obstructed', allocated: 10, actual: 0, adjustable: 10, remark: 'Obstruction found near adhesive room', status: 'Non-Compliant' },
    ],
  },
];

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getManagedSections(): Promise<ManagedSection[]> {
  // 1. Try FastAPI backend first
  try {
    const res = await fetch(`${API_BASE}/api/v1/sections`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback to localStorage when backend is offline
  }

  // 2. LocalStorage fallback
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SECTIONS));
  }
  return DEFAULT_SECTIONS;
}

export async function saveManagedSections(sections: ManagedSection[]): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }
  try {
    await fetch(`${API_BASE}/api/v1/sections/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sections),
    });
  } catch {
    // Synced locally
  }
}
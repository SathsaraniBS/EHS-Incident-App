'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ChecklistItem {
  id: number;
  description: string;
  allocated: number;
  actual: number;
  adjustable: number;
  remark?: string;
}

interface SectionDetail {
  name: string;
  responsible: string;
  category: string;
  items: ChecklistItem[];
}

const sectionsData: Record<string, SectionDetail> = {
  'general-maintenance': {
    name: 'General Maintenance',
    responsible: 'Ruwandika',
    category: 'Engineering / Factory Premises',
    items: [
      { id: 1, description: 'Table, chairs, Tap and electric equipment, fences not broken (Boiler, Fan, Light, Emergency light)', allocated: 20, actual: 0, adjustable: 20, remark: 'Catering Table broken, Cupboard doors broken' },
      { id: 2, description: 'Squatting pans, commodes, wash basins, tiles and doors in good condition', allocated: 20, actual: 20, adjustable: 20 },
      { id: 3, description: 'Insufficient number of toilets in ratio', allocated: 10, actual: 10, adjustable: 10 },
      { id: 4, description: 'Condition monitoring system available for fire pump system', allocated: 5, actual: 5, adjustable: 5 },
      { id: 5, description: 'Contractors use suitable PPEs depending on nature of work', allocated: 15, actual: 15, adjustable: 15 },
    ]
  },
  'admin': {
    name: 'Admin',
    responsible: 'Dalton',
    category: 'Factory Premises / Guard Room / Canteen',
    items: [
      { id: 1, description: 'Separate waste collection bins provided (Foot operated or closed lid)', allocated: 10, actual: 10, adjustable: 10 },
      { id: 2, description: 'All food handling areas free of pests/animals and maintaining hygiene', allocated: 5, actual: 5, adjustable: 5 },
      { id: 3, description: 'Kitchen is designed to prevent cross-contamination', allocated: 15, actual: 0, adjustable: 0, remark: 'Corrective action not taken as per PHI record' },
      { id: 4, description: 'Covered bins available in toilets', allocated: 10, actual: 10, adjustable: 10 },
    ]
  },
  'rm-stores': {
    name: 'RM Stores',
    responsible: 'Chandrasiri',
    category: 'Loading bay / RM Stores / Chemical room',
    items: [
      { id: 1, description: 'Emergency Exit doors are not closed', allocated: 20, actual: 20, adjustable: 20 },
      { id: 2, description: 'Emergency exits pathways are not obstructed', allocated: 10, actual: 0, adjustable: 10, remark: 'Obstruction found near adhesive room' },
      { id: 3, description: 'Smoke detectors & Fire fighting equipment not obstructed', allocated: 10, actual: 10, adjustable: 10 },
    ]
  },
};

export default function SectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const section = sectionsData[slug] || {
    name: slug ? slug.replace(/-/g, ' ').toUpperCase() : 'Section Detail',
    responsible: 'Assigned Officer',
    category: 'Operational Audit Area',
    items: [
      { id: 1, description: 'Emergency Response & Safety Compliance Check', allocated: 50, actual: 40, adjustable: 45 },
      { id: 2, description: 'First Aid Box Accessibility and Inventory Maintenance', allocated: 30, actual: 30, adjustable: 30 },
      { id: 3, description: 'Electrical Panel & Machine Safety Standards', allocated: 40, actual: 25, adjustable: 35, remark: 'Needs minor adjustments' }
    ]
  };

  const totalAllocated = section.items.reduce((acc, item) => acc + item.allocated, 0);
  const totalActual = section.items.reduce((acc, item) => acc + item.actual, 0);
  const totalAdjustable = section.items.reduce((acc, item) => acc + item.adjustable, 0);
  const scorePct = Math.round((totalActual / totalAllocated) * 100) || 0;

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8 space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sections</span>
        </button>

        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">{section.category}</span>
          <p className="text-xs text-slate-400">Responsible: <span className="text-slate-200 font-medium">{section.responsible}</span></p>
        </div>
      </div>

      {/* Section Title & Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800 shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
            {section.name}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Detailed Health, Safety & Environment Audit Checklist & Scoring</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block">Allocated Score</span>
            <span className="text-xl font-bold text-slate-200">{totalAllocated} pts</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <div>
            <span className="text-xs text-slate-400 block">Actual Score</span>
            <span className="text-xl font-bold text-amber-400">{totalActual} pts</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <div>
            <span className="text-xs text-slate-400 block">Achievement</span>
            <span className="text-xl font-bold text-emerald-400">{scorePct}%</span>
          </div>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">Audit Checklist & Findings</h3>
          <span className="text-xs text-slate-400">{section.items.length} criteria evaluated</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Audit Description / Criterion</th>
                <th className="py-3 px-4 text-right">Allocated</th>
                <th className="py-3 px-4 text-right">Actual</th>
                <th className="py-3 px-4 text-right">Adjustable</th>
                <th className="py-3 px-4">Remark / Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {section.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 text-slate-200 font-medium">{item.description}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">{item.allocated}</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-400 font-semibold">{item.actual}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">{item.adjustable}</td>
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {item.remark ? (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {item.remark}
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Compliant
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
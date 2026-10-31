'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  Inbox,
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
    ],
  },
  admin: {
    name: 'Admin',
    responsible: 'Dalton',
    category: 'Factory Premises / Guard Room / Canteen',
    items: [
      { id: 1, description: 'Separate waste collection bins provided (Foot operated or closed lid)', allocated: 10, actual: 10, adjustable: 10 },
      { id: 2, description: 'All food handling areas free of pests/animals and maintaining hygiene', allocated: 5, actual: 5, adjustable: 5 },
      { id: 3, description: 'Kitchen is designed to prevent cross-contamination', allocated: 15, actual: 0, adjustable: 0, remark: 'Corrective action not taken as per PHI record' },
      { id: 4, description: 'Covered bins available in toilets', allocated: 10, actual: 10, adjustable: 10 },
    ],
  },
  'rm-stores': {
    name: 'RM Stores',
    responsible: 'Chandrasiri',
    category: 'Loading bay / RM Stores / Chemical room',
    items: [
      { id: 1, description: 'Emergency Exit doors are not closed', allocated: 20, actual: 20, adjustable: 20 },
      { id: 2, description: 'Emergency exits pathways are not obstructed', allocated: 10, actual: 0, adjustable: 10, remark: 'Obstruction found near adhesive room' },
      { id: 3, description: 'Smoke detectors & Fire fighting equipment not obstructed', allocated: 10, actual: 10, adjustable: 10 },
    ],
  },
};

export default function SectionDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const section = sectionsData[slug];

  const BackButton = (
    <Link
      href="/sections"
      className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 shadow-sm transition"
    >
      <ArrowLeft className="w-4 h-4 text-slate-500" />
      <span>Back to Sections</span>
    </Link>
  );

  // Fake marks are not displayed for sections that lack checklist data.
  if (!section) {
    const title = slug ? slug.replace(/-/g, ' ').toUpperCase() : 'Section Detail';
    return (
      <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-4 lg:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">{BackButton}</div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-3 text-xl font-bold text-slate-800">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            No checklist data has been recorded for this section yet.
          </p>
        </div>
      </div>
    );
  }

  const totalAllocated = section.items.reduce((acc, item) => acc + item.allocated, 0);
  const totalActual = section.items.reduce((acc, item) => acc + item.actual, 0);
  const totalAdjustable = section.items.reduce((acc, item) => acc + item.adjustable, 0);
  const scorePct = totalAllocated > 0 ? Math.round((totalActual / totalAllocated) * 100) : 0;

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-4 lg:p-8 space-y-6">
      {/* Back Button & Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        {BackButton}

        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-red-600 font-semibold">{section.category}</span>
          <p className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-0.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Responsible: <span className="font-semibold text-slate-800">{section.responsible}</span>
          </p>
        </div>
      </div>

      {/* Section Title & Summary */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Detailed Audit Checklist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{section.name}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Inspecting health, safety & environmental evaluation criteria and compliance findings.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0">
          <div className="text-center px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Allocated</span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900">{totalAllocated}</span>
          </div>
          <div className="text-center px-3 border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Actual</span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-amber-600">{totalActual}</span>
          </div>
          <div className="text-center px-3 border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Adjustable</span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-indigo-600">{totalAdjustable}</span>
          </div>
          <div className="text-center px-3 border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Score %</span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600">{scorePct}%</span>
          </div>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Audit Criteria & Findings</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
            {section.items.length} Evaluated Items
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-100/80 text-[11px] sm:text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Audit Description / Criterion</th>
                <th className="py-3.5 px-4 text-right">Allocated</th>
                <th className="py-3.5 px-4 text-right">Actual</th>
                <th className="py-3.5 px-4 text-right">Adjustable</th>
                <th className="py-3.5 px-4">Remark / Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {section.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-medium">{idx + 1}</td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium leading-relaxed">{item.description}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">{item.allocated}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600">{item.actual}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">{item.adjustable}</td>
                  <td className="py-3.5 px-4 text-xs">
                    {item.remark ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        {item.remark}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
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
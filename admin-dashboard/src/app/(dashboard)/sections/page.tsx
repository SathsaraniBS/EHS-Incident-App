'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, TrendingUp, Search, User, ArrowRight } from 'lucide-react';
import { sections, pct, sumItems, useChecklistStore } from './sectionsData';

export default function SectionsAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { items } = useChecklistStore();

  // Use checklist totals when a section has checklist data, otherwise the baseline scores.
  const rows = useMemo(
    () =>
      sections.map((sec) => {
        const list = items[sec.slug];
        if (Array.isArray(list)) {
          const t = sumItems(list);
          return { ...sec, allocatedScore: t.allocated, actualScore: t.actual, adjustableScore: t.adjustable };
        }
        return sec;
      }),
    [items]
  );

  const q = searchTerm.toLowerCase();
  const filteredSections = rows.filter(
    (item) => item.name.toLowerCase().includes(q) || item.responsible.toLowerCase().includes(q)
  );

  const totalAllocated = rows.reduce((acc, curr) => acc + curr.allocatedScore, 0);
  const totalActual = rows.reduce((acc, curr) => acc + curr.actualScore, 0);
  const overallPct = pct(totalActual, totalAllocated);

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-4 lg:p-8 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm font-semibold tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Bondville EHS Division</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Sections Audit Dashboard</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Audit Period: 3rd & 4th Week, October 2026 | Select any section to inspect granular audit metrics & checklists.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>Total Sections</span>
            <ShieldCheck className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{sections.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Active evaluated departments</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>Total Allocated Marks</span>
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalAllocated} pts</p>
          <span className="text-xs text-slate-400 mt-1 block">Maximum benchmark score</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>Total Actual Marks</span>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">{totalActual} pts</p>
          <span className="text-xs text-slate-400 mt-1 block">Realized across factory floors</span>
        </div>

        <div className="bg-gradient-to-br from-red-900 to-zinc-900 border border-red-800 rounded-xl p-5 shadow-md text-white">
          <div className="flex items-center justify-between text-red-200 text-xs font-semibold uppercase tracking-wide">
            <span>Overall HCE Score %</span>
            <Award className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{overallPct}%</p>
          <span className="text-xs text-red-200/80 mt-1 block">Factory Compliance Rating</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by section name or responsible person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
          />
        </div>
        <div className="text-xs font-medium text-slate-500 hidden sm:block">
          Showing <span className="font-bold text-slate-800">{filteredSections.length}</span> of {sections.length} sections
        </div>
      </div>

      {/* Sections Grid Cards */}
      {filteredSections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No sections match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredSections.map((sec) => {
            const sectionPct = pct(sec.actualScore, sec.allocatedScore);

            return (
              <Link
                key={sec.id}
                href={`/sections/${sec.slug}`}
                className="group bg-white hover:border-red-500/60 border border-slate-200 rounded-xl p-5 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
                      Section #{sec.id}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{sec.responsible}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition tracking-tight">
                    {sec.name}
                  </h3>
                </div>

                <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Allocated Score:</span>
                    <span className="font-mono font-semibold text-slate-800">{sec.allocatedScore} pts</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Actual Score:</span>
                    <span className="font-mono font-semibold text-amber-600">{sec.actualScore} pts</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Achievement:</span>
                    <span
                      className={`font-mono font-bold ${
                        sectionPct >= 90 ? 'text-emerald-600' : sectionPct >= 75 ? 'text-amber-600' : 'text-rose-600'
                      }`}
                    >
                      {sectionPct}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-red-600 group-hover:text-red-700">
                  <span>View Audit Checklist</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
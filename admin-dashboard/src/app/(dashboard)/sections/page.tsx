'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  Search, 
  User, 
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardCheck
} from 'lucide-react';
import { pct, useSections } from './sectionsData';

export default function SectionsAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { sections, cycle, loading, error } = useSections();

  const q = searchTerm.toLowerCase();
  const filteredSections = sections.filter(
    (item) => item.name.toLowerCase().includes(q) || item.responsible.toLowerCase().includes(q)
  );

  // --- Engineering Calculation (Excel Sheet Formula Parity) ---
  const totalAllocated = sections.reduce((acc, curr) => acc + curr.allocatedScore, 0);
  const totalActual = sections.reduce((acc, curr) => acc + curr.actualScore, 0);

  // Filter sections that have actually been evaluated (at least 1 item evaluated)
  const evaluatedSections = sections.filter((sec) => sec.evaluatedItems > 0);
  
  // Calculate Overall HCE Score as the average of evaluated sections' percentages (Excel G22 logic)
  const overallPct = evaluatedSections.length > 0
    ? Math.round(evaluatedSections.reduce((sum, sec) => sum + pct(sec.actualScore, sec.allocatedScore), 0) / evaluatedSections.length)
    : 0;

  const completedSectionsCount = sections.filter((sec) => sec.totalItems > 0 && sec.evaluatedItems === sec.totalItems).length;
  const totalItemsEvaluatedSum = sections.reduce((acc, sec) => acc + sec.evaluatedItems, 0);
  const totalItemsSum = sections.reduce((acc, sec) => acc + sec.totalItems, 0);

  if (loading) {
    return <div className="w-full min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Loading sections audit...</div>;
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-slate-50 p-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          <p className="font-semibold">Could not load the sections audit.</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

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
          Audit Period: {cycle ? cycle.label : '3rd & 4th Week, October 2026'} | Select any section to inspect granular audit metrics & checklists.
        </p>
      </div>

      {/* Summary KPI Cards (Engineered with Accurate Evaluated Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>Audit Progress</span>
            <ClipboardCheck className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {completedSectionsCount} <span className="text-base font-normal text-slate-400">/ {sections.length}</span>
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {totalItemsEvaluatedSum} of {totalItemsSum} criteria evaluated
          </span>
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
          <span className="text-xs text-slate-400 mt-1 block">Realized across evaluated floors</span>
        </div>

        <div className="bg-gradient-to-br from-red-900 to-zinc-900 border border-red-800 rounded-xl p-5 shadow-md text-white">
          <div className="flex items-center justify-between text-red-200 text-xs font-semibold uppercase tracking-wide">
            <span>Overall HCE Score %</span>
            <Award className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{overallPct}%</p>
          <span className="text-xs text-red-200/80 mt-1 block">
            Average of {evaluatedSections.length} evaluated sections
          </span>
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

      {/* Sections Grid Cards with Status Badges */}
      {filteredSections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No sections match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredSections.map((sec) => {
            const notStarted = sec.evaluatedItems === 0;
            const isCompleted = sec.totalItems > 0 && sec.evaluatedItems === sec.totalItems;
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

                    {/* Professional Status Badge */}
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                      </span>
                    ) : notStarted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" /> Not Started
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> In Progress
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition tracking-tight">
                      {sec.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{sec.responsible}</span>
                  </div>
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
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Items evaluated:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {sec.evaluatedItems} / {sec.totalItems}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Achievement:</span>
                    {notStarted ? (
                      <span className="font-mono font-bold text-slate-400">Not evaluated</span>
                    ) : (
                      <span
                        className={`font-mono font-bold ${
                          sectionPct >= 90 ? 'text-emerald-600' : sectionPct >= 75 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {sectionPct}%
                      </span>
                    )}
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
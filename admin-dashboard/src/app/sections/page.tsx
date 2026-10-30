'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  RefreshCw, 
  Search,
  User,
  ArrowRight
} from 'lucide-react';

interface AuditSection {
  id: number;
  name: string;
  slug: string;
  responsible: string;
  allocatedScore: number;
  actualScore: number;
  adjustableScore: number;
}

const initialSectionsData: AuditSection[] = [
  { id: 1, name: 'General Maintenance', slug: 'general-maintenance', responsible: 'Ruwandika', allocatedScore: 465, actualScore: 265, adjustableScore: 330 },
  { id: 2, name: 'Admin', slug: 'admin', responsible: 'Dalton', allocatedScore: 265, actualScore: 225, adjustableScore: 245 },
  { id: 3, name: 'RM Stores', slug: 'rm-stores', responsible: 'Chandrasiri', allocatedScore: 235, actualScore: 205, adjustableScore: 215 },
  { id: 4, name: 'FG', slug: 'fg', responsible: 'Chandrasiri', allocatedScore: 155, actualScore: 130, adjustableScore: 130 },
  { id: 5, name: 'Accessories', slug: 'accessories', responsible: 'Sampath', allocatedScore: 225, actualScore: 160, adjustableScore: 180 },
  { id: 6, name: 'Cutting', slug: 'cutting', responsible: 'Chamila', allocatedScore: 155, actualScore: 155, adjustableScore: 155 },
  { id: 7, name: 'Ground floor modules & Molding', slug: 'ground-floor-modules-molding', responsible: 'Gamini', allocatedScore: 265, actualScore: 205, adjustableScore: 225 },
  { id: 8, name: 'Packing', slug: 'packing', responsible: 'Gamini', allocatedScore: 140, actualScore: 140, adjustableScore: 140 },
  { id: 9, name: 'Audit room & Final Inspection', slug: 'audit-room-final-inspection', responsible: 'Lalinda', allocatedScore: 95, actualScore: 80, adjustableScore: 95 },
  { id: 10, name: 'Lab & CPI', slug: 'lab-cpi', responsible: 'Chandani', allocatedScore: 130, actualScore: 115, adjustableScore: 130 },
  { id: 11, name: 'Screen Printing & Modules', slug: 'screen-printing-modules', responsible: 'Gamini', allocatedScore: 210, actualScore: 125, adjustableScore: 140 },
  { id: 12, name: 'Sample Room', slug: 'sample-room', responsible: 'Samitha', allocatedScore: 180, actualScore: 170, adjustableScore: 180 },
  { id: 13, name: 'Coating', slug: 'coating', responsible: 'Chandani', allocatedScore: 205, actualScore: 190, adjustableScore: 190 },
  { id: 14, name: 'Forte', slug: 'forte', responsible: 'Cooray', allocatedScore: 180, actualScore: 180, adjustableScore: 180 },
  { id: 15, name: 'IE', slug: 'ie', responsible: 'Dilan', allocatedScore: 220, actualScore: 130, adjustableScore: 150 },
  { id: 16, name: 'Training School', slug: 'training-school', responsible: 'Dilan', allocatedScore: 130, actualScore: 130, adjustableScore: 130 },
  { id: 17, name: 'Medical Centre', slug: 'medical-centre', responsible: 'Nadee', allocatedScore: 100, actualScore: 95, adjustableScore: 95 },
];

export default function SectionsAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sections] = useState<AuditSection[]>(initialSectionsData);

  const filteredSections = sections.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.responsible.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAllocated = sections.reduce((acc, curr) => acc + curr.allocatedScore, 0);
  const totalActual = sections.reduce((acc, curr) => acc + curr.actualScore, 0);
  const overallPct = Math.round((totalActual / totalAllocated) * 100);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Health, Safety & Environment</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Sections Audit Dashboard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Audit Period: 3rd & 4th Week, October 2026 | Click any section to view detailed audit checklist
          </p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-300 transition self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs sm:text-sm">
            <span>Total Sections</span>
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{sections.length}</p>
          <span className="text-[11px] sm:text-xs text-slate-500">Evaluated departments</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs sm:text-sm">
            <span>Total Allocated Marks</span>
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{totalAllocated} pts</p>
          <span className="text-[11px] sm:text-xs text-slate-500">Maximum possible score</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs sm:text-sm">
            <span>Total Actual Marks</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-2">{totalActual} pts</p>
          <span className="text-[11px] sm:text-xs text-slate-500">Achieved across factory</span>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-blue-200 text-xs sm:text-sm">
            <span>Overall HCE Score %</span>
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-2">{overallPct}%</p>
          <span className="text-[11px] sm:text-xs text-blue-300/70">Factory Compliance Rating</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by section name or responsible person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="text-xs text-slate-400 hidden sm:block">
          Showing <span className="font-semibold text-slate-200">{filteredSections.length}</span> of {sections.length} sections
        </div>
      </div>

      {/* Sections Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSections.map((sec) => {
          const sectionPct = Math.round((sec.actualScore / sec.allocatedScore) * 100);

          return (
            <Link
              key={sec.id}
              href={`/sections/${sec.slug}`}
              className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Section #{sec.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sec.responsible}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                  {sec.name}
                </h3>
              </div>

              {/* Card Metrics */}
              <div className="space-y-2.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Allocated Score:</span>
                  <span className="font-mono font-semibold text-slate-200">{sec.allocatedScore} pts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Actual Score:</span>
                  <span className="font-mono font-semibold text-amber-400">{sec.actualScore} pts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Score Achievement:</span>
                  <span className={`font-mono font-bold ${sectionPct >= 90 ? 'text-emerald-400' : sectionPct >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {sectionPct}%
                  </span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 flex items-center justify-between text-xs font-medium text-blue-400 group-hover:text-blue-300">
                <span>View Audit Checklist</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
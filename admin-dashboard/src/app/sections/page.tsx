'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, ShieldCheck, Users, FileText, BarChart2, Award } from 'lucide-react';

interface SectionSummary {
  id: number;
  name: string;
  responsible_person: string;
  total_items: number;
  allocated_score: number;
  actual_score: number;
  score_percentage: number;
}

export default function SectionsDashboard() {
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSectionsDashboard();
  }, []);

  const fetchSectionsDashboard = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/sections/dashboard');
      setSections(response.data.sections || []);
    } catch (error) {
      console.error('Error fetching sections dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = sections.filter(
    (sec) =>
      sec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.responsible_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItemsCount = sections.reduce((acc, curr) => acc + curr.total_items, 0);
  const totalAllocatedMarks = sections.reduce((acc, curr) => acc + curr.allocated_score, 0);
  const totalActualMarks = sections.reduce((acc, curr) => acc + (curr.actual_score || 0), 0);
  
  const overallHcePercentage = totalAllocatedMarks > 0 
    ? Math.round((totalActualMarks / totalAllocatedMarks) * 100) 
    : 0;

  return (
    <div className="text-slate-800">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Health, Safety & Environment — Score Card Dashboard</h1>
            <p className="text-gray-500 mt-1">Period: 1st & 2nd Week, September 2026 | Comprehensive Operational Audit & Scoring</p>
          </div>
          <button 
            onClick={fetchSectionsDashboard}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            Refresh Data
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mt-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Sections</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{sections.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><BarChart2 className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Allocated Marks</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalAllocatedMarks} pts</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><FileText className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Actual Marks</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalActualMarks} pts</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><ShieldCheck className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Overall HCE Score %</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{overallHcePercentage}%</h3>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-lg"><Award className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="mt-8 flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm max-w-md">
          <Search className="w-5 h-5 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search by section name or responsible person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm"
          />
        </div>
      </div>

      {/* Sections Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading audit scorecard data...</div>
        ) : filteredSections.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">No matching sections found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSections.map((sec, index) => {
              const scorePercent = sec.allocated_score > 0 
                ? Math.round(((sec.actual_score || 0) / sec.allocated_score) * 100) 
                : 0;

              return (
                <div 
                  key={sec.id} 
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                        Section #{index + 1}
                      </span>
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {sec.responsible_person}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 mb-4">
                      {sec.name}
                    </h3>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 text-xs">Allocated Score</span>
                      <span className="font-semibold text-slate-700">{sec.allocated_score} pts</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 text-xs">Actual Score</span>
                      <span className="font-bold text-emerald-600">{sec.actual_score || 0} pts</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Score Achievement</span>
                        <span className="font-bold text-blue-600">{scorePercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(scorePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
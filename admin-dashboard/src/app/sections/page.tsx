'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, ShieldCheck, Users, FileText, BarChart2, ArrowRight, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
interface SectionSummary {
  id: number;
  name: name;
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">EHS Section Audit Dashboard</h1>
              <p className="text-gray-500 mt-1">Overview of 17 Operational Audit Sections and Score Allocations</p>
            </div>
            <button 
              onClick={fetchSectionsDashboard}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Refresh Data
            </button>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sections</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{sections.length}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><BarChart2 className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Audit Items</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalItemsCount}</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><FileText className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Allocated Marks</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalAllocatedMarks}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><ShieldCheck className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="mt-8 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm max-w-md">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search by section name or responsible person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        {/* Sections Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading audit sections...</div>
          ) : filteredSections.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">No matching sections found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSections.map((sec, index) => (
                <div 
                  key={sec.id} 
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                        Section #{index + 1}
                      </span>
                      <div className="flex items-center text-xs text-gray-500 font-medium">
                        <Users className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {sec.responsible_person}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-2 mb-4">
                      {sec.name}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-400 block text-xs">Questions</span>
                      <span className="font-semibold text-gray-700">{sec.total_items}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block text-xs">Allocated Score</span>
                      <span className="font-bold text-emerald-600">{sec.allocated_score} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
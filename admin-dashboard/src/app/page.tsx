'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { fetchIncidents, updateIncidentStatus, Incident, API_BASE_URL } from '@/services/api';
import { exportToExcel, exportToPDF } from '@/utils/exportHelpers';
import { FileSpreadsheet, FileText, Filter, RefreshCw, Search, ShieldAlert, Image as ImageIcon } from 'lucide-react';

export default function AdminDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchIncidents();
      setIncidents(data.reverse());
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique sections for dropdown filter
  const sections = useMemo(() => {
    const set = new Set(incidents.map((i) => i.section).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [incidents]);

  // Filtered List
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const matchesSection = selectedSection === 'All' || item.section === selectedSection;
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.section.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [incidents, selectedSection, searchTerm]);

  return (
    <div className="text-slate-800">
      {/* Header */}
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <ShieldAlert className="h-7 w-7 text-blue-600" />
            EHS Incident & Safety Audit Dashboard
          </h1>
          <p className="text-sm text-slate-500">Management & Safety Officer Monitoring Portal</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => exportToExcel(filteredIncidents)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </button>
          <button
            onClick={() => exportToPDF(filteredIncidents)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </header>

      {/* Stats Section */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Incidents Reported</p>
          <p className="text-3xl font-extrabold text-slate-900">{incidents.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Filtered Records</p>
          <p className="text-3xl font-extrabold text-blue-600">{filteredIncidents.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Categories</p>
          <p className="text-3xl font-extrabold text-emerald-600">{sections.length - 1}</p>
        </div>
      </div>

      {/* Controls: Search & Section Filter */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search location, description, or section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-xs uppercase text-slate-700">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Loading incident records...
                </td>
              </tr>
            ) : filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No incident reports matching your criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((item) => {
                const imgFullUrl = item.image_url
                  ? item.image_url.startsWith('http')
                    ? item.image_url
                    : `${API_BASE_URL}${item.image_url}`
                  : null;

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-blue-600">#{item.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.section}</td>
                    <td className="px-4 py-3 text-sky-700">{item.location}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-700" title={item.description}>
                      {item.description}
                    </td>
                    
                    {/* Severity Dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={item.severity || 'Medium'}
                        onChange={async (e) => {
                          try {
                            await updateIncidentStatus(item.id, item.status || 'Pending', e.target.value);
                            loadData();
                          } catch (err) {
                            console.error('Failed to update severity:', err);
                          }
                        }}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={item.status || 'Pending'}
                        onChange={async (e) => {
                          try {
                            await updateIncidentStatus(item.id, e.target.value, item.severity || 'Medium');
                            loadData();
                          } catch (err) {
                            console.error('Failed to update status:', err);
                          }
                        }}
                        className={`rounded px-2 py-1 text-xs font-bold ${
                          item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      {imgFullUrl ? (
                        <button
                          onClick={() => setSelectedImage(imgFullUrl)}
                          className="flex items-center gap-1 rounded border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                        >
                          <ImageIcon className="h-3 w-3" /> View Image
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">No Image</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-xl bg-white p-2">
            <img src={selectedImage} alt="Incident Evidence" className="max-h-[80vh] w-full rounded-lg object-contain" />
            <p className="mt-2 text-center text-xs text-slate-500">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
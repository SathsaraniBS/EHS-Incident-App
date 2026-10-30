'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchIncidents, updateIncidentStatus, Incident, API_BASE_URL } from '@/services/api';
import { exportToExcel, exportToPDF } from '@/utils/exportHelpers';
import { 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  Image as ImageIcon,
  LogOut
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Auth Guard
  useEffect(() => {
    const user = localStorage.getItem('bondville_user');
    if (!user) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

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
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

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

  const handleSignOut = () => {
    localStorage.removeItem('bondville_user');
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null; // Prevents UI flash before redirecting to /login
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-4 lg:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Bondville EHS Division</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            EHS Incident & Safety Audit Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Management & Safety Officer Monitoring Portal</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 transition"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" /> Refresh
          </button>
          <button
            onClick={() => exportToExcel(filteredIncidents)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </button>
          <button
            onClick={() => exportToPDF(filteredIncidents)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-red-700 transition"
          >
            <FileText className="h-4 w-4" /> Export PDF
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs sm:text-sm font-medium text-red-700 hover:bg-red-100 transition"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Incidents Reported</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{incidents.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtered Records</p>
          <p className="text-3xl font-extrabold text-red-600 mt-1">{filteredIncidents.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Categories</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{sections.length > 0 ? sections.length - 1 : 0}</p>
        </div>
      </div>

      {/* Controls: Search & Section Filter */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search location, description, or section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:border-red-500 focus:outline-none"
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
        <table className="w-full border-collapse text-left text-xs sm:text-sm text-slate-700">
          <thead className="bg-slate-100/80 text-[11px] sm:text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5">ID</th>
              <th className="px-4 py-3.5">Section</th>
              <th className="px-4 py-3.5">Location</th>
              <th className="px-4 py-3.5">Description</th>
              <th className="px-4 py-3.5">Severity</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Evidence</th>
              <th className="px-4 py-3.5">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                  Loading incident records...
                </td>
              </tr>
            ) : filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
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
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-red-600">#{item.id}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{item.section}</td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{item.location}</td>
                    <td className="max-w-xs truncate px-4 py-3.5 text-slate-700 leading-relaxed" title={item.description}>
                      {item.description}
                    </td>
                    
                    {/* Severity Dropdown */}
                    <td className="px-4 py-3.5">
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
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-4 py-3.5">
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
                        className={`rounded-md px-2.5 py-1 text-xs font-bold border focus:outline-none ${
                          item.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>

                    <td className="px-4 py-3.5">
                      {imgFullUrl ? (
                        <button
                          onClick={() => setSelectedImage(imgFullUrl)}
                          className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-red-600" /> View Image
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">No Image</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl">
            <img src={selectedImage} alt="Incident Evidence" className="max-h-[80vh] w-full rounded-xl object-contain" />
            <p className="mt-2 text-center text-xs text-slate-500 font-medium">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
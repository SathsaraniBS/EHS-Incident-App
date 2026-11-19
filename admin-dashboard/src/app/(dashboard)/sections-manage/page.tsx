'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  UserCheck,
  CheckCircle2,
  X,
  ListChecks,
  Building2,
  Search,
} from 'lucide-react';
import {
  ManagedSection,
  ChecklistCriterion,
  getManagedSections,
  saveManagedSections,
  generateSlug,
} from '@/services/sectionService';

export default function AdminSectionManagementPage() {
  const [sections, setSections] = useState<ManagedSection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states for Section CRUD
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ManagedSection | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formResponsible, setFormResponsible] = useState('');

  // Drawer/Modal state for Checklist Management
  const [selectedSectionForChecklist, setSelectedSectionForChecklist] = useState<ManagedSection | null>(null);
  const [newCriterionDesc, setNewCriterionDesc] = useState('');
  const [newCriterionMarks, setNewCriterionMarks] = useState<number>(10);

  // Auth & role checks are already enforced by src/proxy.ts (JWT cookie),
  // so this page only needs to load its data.
  useEffect(() => {
    loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSections = async () => {
    setLoading(true);
    const data = await getManagedSections();
    setSections(data);
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingSection(null);
    setFormName('');
    setFormCategory('');
    setFormResponsible('');
    setIsSectionModalOpen(true);
  };

  const openEditModal = (sec: ManagedSection) => {
    setEditingSection(sec);
    setFormName(sec.name);
    setFormCategory(sec.category);
    setFormResponsible(sec.responsible);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formResponsible.trim()) return;

    let updated: ManagedSection[];
    if (editingSection) {
      updated = sections.map((s) =>
        s.id === editingSection.id
          ? {
              ...s,
              name: formName.trim(),
              slug: generateSlug(formName),
              category: formCategory.trim() || 'Operational Area',
              responsible: formResponsible.trim(),
            }
          : s
      );
    } else {
      const nextId = sections.length > 0 ? Math.max(...sections.map((s) => s.id)) + 1 : 1;
      const newSec: ManagedSection = {
        id: nextId,
        name: formName.trim(),
        slug: generateSlug(formName),
        category: formCategory.trim() || 'Operational Area',
        responsible: formResponsible.trim(),
        isActive: true,
        criteria: [],
      };
      updated = [...sections, newSec];
    }

    setSections(updated);
    await saveManagedSections(updated);
    setIsSectionModalOpen(false);
  };

  const handleToggleActive = async (id: number) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    setSections(updated);
    await saveManagedSections(updated);
  };

  const handleDeleteSection = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this section and its checklist criteria?')) return;
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    await saveManagedSections(updated);
  };

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionForChecklist || !newCriterionDesc.trim()) return;

    const newItem: ChecklistCriterion = {
      id: `crit-${Date.now()}`,
      description: newCriterionDesc.trim(),
      allocated: Number(newCriterionMarks) || 10,
      actual: 0,
      adjustable: Number(newCriterionMarks) || 10,
      remark: '',
      status: 'Pending',
    };

    const updated = sections.map((s) =>
      s.id === selectedSectionForChecklist.id ? { ...s, criteria: [...s.criteria, newItem] } : s
    );

    setSections(updated);
    await saveManagedSections(updated);
    setSelectedSectionForChecklist(updated.find((s) => s.id === selectedSectionForChecklist.id) || null);
    setNewCriterionDesc('');
    setNewCriterionMarks(10);
  };

  const handleDeleteCriterion = async (criterionId: string) => {
    if (!selectedSectionForChecklist) return;
    const updated = sections.map((s) =>
      s.id === selectedSectionForChecklist.id
        ? { ...s, criteria: s.criteria.filter((c) => c.id !== criterionId) }
        : s
    );
    setSections(updated);
    await saveManagedSections(updated);
    setSelectedSectionForChecklist(updated.find((s) => s.id === selectedSectionForChecklist.id) || null);
  };

  const filteredSections = sections.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 lg:p-8 text-slate-900 space-y-6">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Configuration &amp; Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Section Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create factory departments, assign responsible officers, and configure audit checklists.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Section</span>
        </button>
      </header>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by section name, category, or officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-500"
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <span>Total Sections: <strong className="text-slate-900">{sections.length}</strong></span>
          <span>Active: <strong className="text-emerald-600">{sections.filter((s) => s.isActive).length}</strong></span>
        </div>
      </div>

      {/* Section Management Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100/80 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Section Name</th>
                <th className="py-3.5 px-4">Operational Area</th>
                <th className="py-3.5 px-4">Responsible Officer</th>
                <th className="py-3.5 px-4 text-right">Total Marks</th>
                <th className="py-3.5 px-4 text-center">Checklist</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Loading sections...</td>
                </tr>
              ) : filteredSections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No sections found.</td>
                </tr>
              ) : (
                filteredSections.map((sec) => {
                  const totalMarks = sec.criteria.reduce((sum, c) => sum + c.allocated, 0);
                  return (
                    <tr key={sec.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400 font-semibold">#{sec.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-red-600 shrink-0" />
                        {sec.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{sec.category}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          {sec.responsible}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">{totalMarks} pts</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedSectionForChecklist(sec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition"
                        >
                          <ListChecks className="w-3.5 h-3.5" />
                          <span>{sec.criteria.length} Criteria</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(sec.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                            sec.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {sec.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(sec)}
                          title="Edit Section"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sec.id)}
                          title="Delete Section"
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900">
                {editingSection ? 'Edit Factory Section' : 'Create New Section'}
              </h3>
              <button onClick={() => setIsSectionModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Boiler Room & Compressor"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Operational Area / Sub-locations
                </label>
                <input
                  type="text"
                  placeholder="e.g., Ground Floor / Utility Block"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Responsible Officer *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ruwandika"
                  value={formResponsible}
                  onChange={(e) => setFormResponsible(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
                >
                  {editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checklist Criteria Configurator Modal */}
      {selectedSectionForChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Audit Checklist Builder</span>
                <h3 className="font-bold text-slate-900 text-lg">{selectedSectionForChecklist.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSectionForChecklist(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Criterion Form */}
            <form onSubmit={handleAddCriterion} className="p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Enter new safety audit criterion..."
                value={newCriterionDesc}
                onChange={(e) => setNewCriterionDesc(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none"
              />
              <input
                type="number"
                min={1}
                max={100}
                required
                value={newCriterionMarks}
                onChange={(e) => setNewCriterionMarks(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-red-500 focus:outline-none"
                title="Allocated Marks"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            {/* Existing Criteria List */}
            <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
              {selectedSectionForChecklist.criteria.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">
                  No checklist criteria added yet. Add the first criterion above.
                </p>
              ) : (
                selectedSectionForChecklist.criteria.map((c, idx) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-xs font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.description}</p>
                        <span className="text-xs font-mono font-semibold text-red-600">Allocated: {c.allocated} pts</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCriterion(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition shrink-0"
                      title="Remove Criterion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">
                Total Benchmark Score:{' '}
                <strong className="text-slate-900 font-mono">
                  {selectedSectionForChecklist.criteria.reduce((acc, item) => acc + item.allocated, 0)} pts
                </strong>
              </span>
              <button
                onClick={() => setSelectedSectionForChecklist(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                <CheckCircle2 className="w-4 h-4" /> Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
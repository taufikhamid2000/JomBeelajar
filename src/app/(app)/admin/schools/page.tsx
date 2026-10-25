'use client';
// Import dynamic config to optimize build
import './config';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { SCHOOL_TYPES, type SchoolType } from '@/lib/jombeelajar-api';
import {
  AdminLayout,
  SearchBar,
  FilterSortControls,
  DataTableCardView,
  Pagination,
  Message,
  type Column,
  type CardField,
  type SortDirection,
} from '@/components/admin/ui';

interface SchoolListEntry {
  id: string;
  name: string;
  type: SchoolType;
  district: string;
  state: string;
  averageScore: number;
  participationRate: number;
  activeStudents: number;
}

type FormData = {
  name: string;
  type: SchoolType;
  district: string;
  state: string;
  code: string;
  address: string;
  website: string;
  phone: string;
  principalName: string;
  totalStudents: string; // kept as string for the number input, parsed on submit
};

const emptyForm: FormData = {
  name: '',
  type: SCHOOL_TYPES[0],
  district: '',
  state: '',
  code: '',
  address: '',
  website: '',
  phone: '',
  principalName: '',
  totalStudents: '',
};

type SortOption = 'name' | 'type' | 'averageScore';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<SchoolListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/schools');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch schools');
      setSchools(data);
    } catch (err) {
      logger.error('Error fetching schools:', err);
      setError('Unable to connect to the API. Please contact the administrator.');
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  }

  async function openEditForm(school: SchoolListEntry) {
    setEditingId(school.id);
    setIsFormOpen(true);
    setError(null);
    try {
      const res = await fetch(`/api/schools/${school.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load school details');
      setFormData({
        name: data.name,
        type: data.type,
        district: data.district,
        state: data.state,
        code: data.code ?? '',
        address: data.address ?? '',
        website: data.website ?? '',
        phone: data.phone ?? '',
        principalName: data.principalName ?? '',
        totalStudents: data.totalStudents?.toString() ?? '',
      });
    } catch (err) {
      logger.error('Error loading school for edit:', err);
      setError('Unable to connect to the API. Please contact the administrator.');
    }
  }

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.district.trim() || !formData.state.trim()) {
      setError('Name, district, and state are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        district: formData.district.trim(),
        state: formData.state.trim(),
        code: formData.code.trim() || undefined,
        address: formData.address.trim() || undefined,
        website: formData.website.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        principalName: formData.principalName.trim() || undefined,
        totalStudents: formData.totalStudents
          ? Number(formData.totalStudents)
          : undefined,
      };

      const res = editingId
        ? await fetch(`/api/schools/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/schools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save school');
      }

      setSuccessMessage(editingId ? 'School updated' : 'School created');
      setIsFormOpen(false);
      await fetchSchools();
    } catch (err) {
      logger.error('Error saving school:', err);
      setError(err instanceof Error ? err.message : 'Failed to save school');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this school?')) return;

    try {
      const res = await fetch(`/api/schools/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete school');
      }
      setSuccessMessage('School deleted');
      setSchools((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      logger.error('Error deleting school:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete school');
    }
  }

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || school.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedSchools = [...filteredSchools].sort((a, b) => {
    if (sortBy === 'averageScore') {
      return sortDirection === 'asc'
        ? a.averageScore - b.averageScore
        : b.averageScore - a.averageScore;
    }
    const compareA = sortBy === 'name' ? a.name : a.type;
    const compareB = sortBy === 'name' ? b.name : b.type;
    return sortDirection === 'asc'
      ? compareA.localeCompare(compareB)
      : compareB.localeCompare(compareA);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSchools = sortedSchools.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedSchools.length / itemsPerPage);

  const columns: Column<SchoolListEntry>[] = [
    {
      key: 'school',
      header: 'School',
      render: (school) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {school.name}
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            {school.district}, {school.state}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (school) => (
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {school.type}
        </span>
      ),
    },
    {
      key: 'averageScore',
      header: 'Avg Score',
      render: (school) => (
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {school.averageScore.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'participationRate',
      header: 'Participation',
      render: (school) => (
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {school.participationRate.toFixed(1)}%
        </span>
      ),
    },
  ];

  const cardFields: CardField<SchoolListEntry>[] = [
    {
      key: 'header',
      label: '',
      isHeader: true,
      render: (school) => (
        <div className="mb-3">
          <div className="text-base font-medium text-gray-900 dark:text-gray-100">
            {school.name}
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            {school.district}, {school.state}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (school) => <span>{school.type}</span>,
    },
    {
      key: 'averageScore',
      label: 'Avg Score',
      isFooter: true,
      render: (school) => <span>{school.averageScore.toFixed(1)}%</span>,
    },
  ];

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (option: string) => {
    if (sortBy === (option as SortOption)) {
      toggleSortDirection();
    } else {
      setSortBy(option as SortOption);
      setSortDirection('asc');
    }
  };

  const filterOptions = ['all', ...SCHOOL_TYPES].map((t) => ({
    id: t,
    label: t === 'all' ? 'All' : t,
  }));

  const sortOptions = [
    { id: 'name', label: 'Name' },
    { id: 'type', label: 'Type' },
    { id: 'averageScore', label: 'Average Score' },
  ];

  return (
    <AdminLayout title="Schools" refreshAction={fetchSchools} isLoading={loading}>
      <div className="space-y-4">
        {error && (
          <Message
            type="error"
            message={error}
            onDismiss={() => setError(null)}
            onRetry={fetchSchools}
          />
        )}

        {successMessage && (
          <Message
            type="success"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
          />
        )}

        <div className="flex justify-between items-center">
          <div className="hidden md:block" />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
            onClick={openCreateForm}
          >
            Create New School
          </button>
        </div>

        <div className="mb-4">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search schools..."
            className="mb-4"
          />

          <FilterSortControls
            selectedFilter={typeFilter}
            onFilterChange={setTypeFilter}
            filterOptions={filterOptions}
            selectedSort={sortBy}
            onSortChange={handleSortChange}
            sortOptions={sortOptions}
            sortDirection={sortDirection}
            onSortDirectionChange={toggleSortDirection}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            perPageOptions={[5, 10, 25, 50]}
          />
        </div>

        <DataTableCardView
          data={currentSchools}
          isLoading={loading}
          columns={columns}
          cardFields={cardFields}
          keyExtractor={(item) => item.id}
          emptyMessage="No schools yet. Create your first one to get started."
          emptyFilteredMessage="No schools match your search criteria."
          isFiltered={searchTerm !== '' || typeFilter !== 'all'}
          actions={(school) => (
            <>
              <button
                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                onClick={() => openEditForm(school)}
              >
                Edit
              </button>
              <button
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                onClick={() => handleDelete(school.id)}
              >
                Delete
              </button>
            </>
          )}
        />

        {sortedSchools.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={sortedSchools.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-gray-800 dark:bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-xl font-bold mb-4 text-white dark:text-gray-900">
              {editingId ? 'Edit School' : 'Create School'}
            </h3>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    Name*
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    Type*
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as SchoolType,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                  >
                    {SCHOOL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    District*
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    State*
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    Principal
                  </label>
                  <input
                    type="text"
                    value={formData.principalName}
                    onChange={(e) =>
                      setFormData({ ...formData, principalName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2">
                    Total Students
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalStudents}
                    onChange={(e) =>
                      setFormData({ ...formData, totalStudents: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-200 dark:text-gray-800 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

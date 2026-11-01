'use client';
// Import dynamic config to optimize build
import './config';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
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

interface CatalogAchievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  icon: string;
  maxProgress: number | null;
}

type FormData = {
  achievementType: string;
  title: string;
  description: string;
  icon: string;
  maxProgress: string; // kept as string for the number input, parsed on submit
};

const emptyForm: FormData = {
  achievementType: '',
  title: '',
  description: '',
  icon: '🏆',
  maxProgress: '',
};

type SortOption = 'title' | 'type';

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<CatalogAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('title');
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
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/achievements');
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || 'Failed to fetch achievements');
      setAchievements(data);
    } catch (err) {
      logger.error('Error fetching achievement catalog:', err);
      setError(
        'Unable to connect to the API. Please contact the administrator.'
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  }

  function openEditForm(achievement: CatalogAchievement) {
    setEditingId(achievement.id);
    setFormData({
      achievementType: achievement.achievementType,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      maxProgress: achievement.maxProgress?.toString() ?? '',
    });
    setIsFormOpen(true);
  }

  async function handleSubmit() {
    if (!formData.achievementType.trim() || !formData.title.trim()) {
      setError('Type and title are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        achievementType: formData.achievementType.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        icon: formData.icon.trim() || '🏆',
        maxProgress: formData.maxProgress
          ? Number(formData.maxProgress)
          : undefined,
      };

      const res = editingId
        ? await fetch(`/api/achievements/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/achievements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save achievement');
      }

      setSuccessMessage(
        editingId ? 'Achievement updated' : 'Achievement created'
      );
      setIsFormOpen(false);
      await fetchAchievements();
    } catch (err) {
      logger.error('Error saving catalog achievement:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to save achievement'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this achievement from the catalog?')) return;

    try {
      const res = await fetch(`/api/achievements/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete achievement');
      }
      setSuccessMessage('Achievement deleted');
      setAchievements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      logger.error('Error deleting catalog achievement:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete achievement'
      );
    }
  }

  const filteredAchievements = achievements.filter((achievement) => {
    const matchesSearch =
      achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === 'all' || achievement.achievementType === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const compareA = sortBy === 'title' ? a.title : a.achievementType;
    const compareB = sortBy === 'title' ? b.title : b.achievementType;
    return sortDirection === 'asc'
      ? compareA.localeCompare(compareB)
      : compareB.localeCompare(compareA);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAchievements = sortedAchievements.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(sortedAchievements.length / itemsPerPage);

  const achievementTypes = [
    'all',
    ...new Set(achievements.map((a) => a.achievementType)),
  ];

  const columns: Column<CatalogAchievement>[] = [
    {
      key: 'achievement',
      header: 'Achievement',
      render: (achievement) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-soft dark:bg-[var(--band-via)]/30 flex items-center justify-center text-xl">
            {achievement.icon}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-strong">
              {achievement.title}
            </div>
            <div className="text-sm text-soft">{achievement.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (achievement) => (
        <span className="text-sm text-soft">{achievement.achievementType}</span>
      ),
    },
    {
      key: 'maxProgress',
      header: 'Max Progress',
      render: (achievement) => (
        <span className="text-sm text-soft">
          {achievement.maxProgress ?? '—'}
        </span>
      ),
    },
  ];

  const cardFields: CardField<CatalogAchievement>[] = [
    {
      key: 'header',
      label: '',
      isHeader: true,
      render: (achievement) => (
        <div className="flex items-center mb-3">
          <div className="flex-shrink-0 h-12 w-12 mr-3 rounded-full bg-brand-soft dark:bg-[var(--band-via)]/30 flex items-center justify-center text-2xl">
            {achievement.icon}
          </div>
          <div>
            <div className="text-base font-medium text-strong">
              {achievement.title}
            </div>
            <div className="text-sm text-soft">{achievement.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (achievement) => <span>{achievement.achievementType}</span>,
    },
    {
      key: 'maxProgress',
      label: 'Max Progress',
      isFooter: true,
      render: (achievement) => <span>{achievement.maxProgress ?? '—'}</span>,
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

  const filterOptions = achievementTypes.map((t) => ({
    id: t,
    label: t === 'all' ? 'All' : t,
  }));

  const sortOptions = [
    { id: 'title', label: 'Title' },
    { id: 'type', label: 'Type' },
  ];

  return (
    <AdminLayout
      title="Achievement Catalog"
      refreshAction={fetchAchievements}
      isLoading={loading}
    >
      <div className="space-y-4">
        {error && (
          <Message
            type="error"
            message={error}
            onDismiss={() => setError(null)}
            onRetry={fetchAchievements}
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
            className="bg-[var(--band-via)] text-white px-4 py-2 rounded hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)]"
            onClick={openCreateForm}
          >
            Create New Achievement
          </button>
        </div>

        <div className="mb-4">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search achievements..."
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
          data={currentAchievements}
          isLoading={loading}
          columns={columns}
          cardFields={cardFields}
          keyExtractor={(item) => item.id}
          emptyMessage="No achievements in the catalog yet. Create your first one to get started."
          emptyFilteredMessage="No achievements match your search criteria."
          isFiltered={searchTerm !== '' || typeFilter !== 'all'}
          actions={(achievement) => (
            <>
              <button
                className="text-brand hover:text-brand mr-4"
                onClick={() => openEditForm(achievement)}
              >
                Edit
              </button>
              <button
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                onClick={() => handleDelete(achievement.id)}
              >
                Delete
              </button>
            </>
          )}
        />

        {sortedAchievements.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={sortedAchievements.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-strong">
              {editingId ? 'Edit Achievement' : 'Create Achievement'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-soft text-sm font-bold mb-2">
                  Type*
                </label>
                <input
                  type="text"
                  value={formData.achievementType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      achievementType: e.target.value,
                    })
                  }
                  placeholder="e.g. quiz_streak, first_quiz"
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
                  required
                />
              </div>

              <div>
                <label className="block text-soft text-sm font-bold mb-2">
                  Title*
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
                  required
                />
              </div>

              <div>
                <label className="block text-soft text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
                />
              </div>

              <div>
                <label className="block text-soft text-sm font-bold mb-2">
                  Icon (emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
                />
              </div>

              <div>
                <label className="block text-soft text-sm font-bold mb-2">
                  Max Progress (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxProgress}
                  onChange={(e) =>
                    setFormData({ ...formData, maxProgress: e.target.value })
                  }
                  placeholder="Leave blank for a one-shot achievement"
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-muted text-strong rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-[var(--band-via)] text-white rounded hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)] disabled:opacity-50"
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

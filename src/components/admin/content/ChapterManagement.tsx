'use client';

import { useState, useMemo } from 'react';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { Chapter, Subject, createChapter, deleteChapter } from '@/services';
import {
  DataTableCardView,
  type Column,
  type CardField,
  SearchBar,
  FilterSortControls,
  type SortDirection,
  Pagination,
} from '@/components/admin/ui';

interface ChapterManagementProps {
  chapters: Chapter[];
  subjects: Subject[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  refreshChapters: () => Promise<void>;
}

export default function ChapterManagement({
  chapters,
  subjects,
  loading,
  setLoading,
  setError,
  setSuccessMessage,
  refreshChapters,
}: ChapterManagementProps) {
  const [showNewChapterForm, setShowNewChapterForm] = useState(false);
  const [newChapter, setNewChapter] = useState({
    name: '', // Previously called 'title'
    subject_id: '',
    form: 4,
  }); // Pagination, filtering and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedSort, setSelectedSort] = useState('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  // Dropdown filters
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<number | 'all'>('all');
  // Sort options for the chapters
  const sortOptions = [
    { id: 'name', label: 'Title' },
    { id: 'subject', label: 'Subject' },
    { id: 'form', label: 'Form' },
  ]; // Filter and sort chapters
  const filteredChapters = useMemo(() => {
    // First filter by search term
    let filtered = chapters.filter((chapter) =>
      chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Then apply the subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(
        (chapter) => chapter.subject_id === subjectFilter
      );
    }

    // Then apply the form filter
    if (formFilter !== 'all') {
      filtered = filtered.filter((chapter) => chapter.form === formFilter);
    } // Sort the filtered results
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (selectedSort === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (selectedSort === 'subject') {
        const subjectA =
          subjects.find((s) => s.id === a.subject_id)?.name || '';
        const subjectB =
          subjects.find((s) => s.id === b.subject_id)?.name || '';
        comparison = subjectA.localeCompare(subjectB);
      } else if (selectedSort === 'form') {
        comparison = a.form - b.form;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    chapters,
    subjects,
    searchTerm,
    subjectFilter,
    selectedSort,
    sortDirection,
    formFilter,
  ]);

  // Pagination calculation
  const totalItems = filteredChapters.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedChapters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredChapters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredChapters, currentPage, itemsPerPage]);
  // Toggle sort direction
  const handleSortDirectionToggle = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Get unique form numbers for the form filter
  const uniqueFormNumbers = useMemo(() => {
    const forms = chapters.map((chapter) => chapter.form);
    return [...new Set(forms)].sort((a, b) => a - b);
  }, [chapters]);

  // Function to handle chapter creation
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!newChapter.name.trim()) {
        setError('Chapter title is required');
        return;
      }
      if (!newChapter.subject_id) {
        setError('Subject selection is required');
        return;
      } // Check for duplicate chapter name within the same subject and form
      const existingChapter = chapters.find(
        (chapter) =>
          chapter.name.toLowerCase().trim() ===
            newChapter.name.toLowerCase().trim() &&
          chapter.subject_id === newChapter.subject_id &&
          chapter.form === newChapter.form
      );
      if (existingChapter) {
        const subjectName =
          subjects.find((s) => s.id === newChapter.subject_id)?.name ||
          'Unknown Subject';
        setError(
          `A chapter with the name "${newChapter.name}" already exists for ${subjectName} Form ${newChapter.form}`
        );
        return;
      }

      const { id, error } = await createChapter({
        name: newChapter.name,
        subject_id: newChapter.subject_id,
        form: newChapter.form,
      });

      if (error) {
        throw error;
      }

      if (!id) {
        throw new Error('Failed to create chapter');
      } // Refresh chapters list
      await refreshChapters(); // Reset form and hide it
      setNewChapter({ name: '', subject_id: '', form: 4 });
      setShowNewChapterForm(false);
      setSuccessMessage(`Chapter "${newChapter.name}" created successfully!`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Failed to create chapter: ${errorMessage}`);
      logger.error('Error creating chapter:', error);
    } finally {
      setLoading(false);
    }
  }; // Function to handle chapter deletion
  const handleDeleteChapter = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the chapter "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { success, error } = await deleteChapter(id);

      if (error) {
        throw error;
      }

      if (!success) {
        throw new Error('Failed to delete chapter');
      }

      // Refresh the chapter list
      await refreshChapters();
      setSuccessMessage(`Chapter "${name}" deleted successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Failed to delete chapter: ${errorMessage}`);
      logger.error('Error deleting chapter:', error);
    } finally {
      setLoading(false);
    }
  };
  // Define columns for DataTableCardView
  const columns: Column<Chapter>[] = [
    {
      key: 'name',
      header: 'Title',
      render: (chapter) => (
        <div className="text-sm font-medium text-strong">{chapter.name}</div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (chapter) => (
        <div className="text-sm text-soft">
          {subjects.find((s) => s.id === chapter.subject_id)?.name || 'N/A'}
        </div>
      ),
    },
    {
      key: 'form',
      header: 'Form',
      render: (chapter) => (
        <div className="text-sm text-soft">{chapter.form}</div>
      ),
    },
  ];
  // Define card fields for mobile view
  const cardFields: CardField<Chapter>[] = [
    {
      key: 'name',
      label: 'Title',
      isHeader: true,
      render: (chapter) => (
        <div className="text-base font-medium text-strong">{chapter.name}</div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (chapter) => (
        <div className="text-sm text-strong">
          {subjects.find((s) => s.id === chapter.subject_id)?.name || 'N/A'}
        </div>
      ),
    },
    {
      key: 'form',
      label: 'Form',
      render: (chapter) => (
        <div className="text-sm text-strong">{chapter.form}</div>
      ),
    },
  ];
  // Actions render function
  const renderActions = (chapter: Chapter) => (
    <>
      <Link
        href={`/admin/content/chapters/${chapter.id}`}
        className="text-brand hover:text-brand mr-4"
      >
        Edit
      </Link>
      <button
        onClick={() => handleDeleteChapter(chapter.id, chapter.name)}
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
      >
        Delete
      </button>
    </>
  );
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Chapter Management</h2>
        <button
          onClick={() => setShowNewChapterForm(!showNewChapterForm)}
          className="bg-[var(--band-via)] text-white px-4 py-2 rounded hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)]"
        >
          {showNewChapterForm ? 'Cancel' : 'Add New Chapter'}
        </button>
      </div>{' '}
      {/* Search and filter controls */}
      <div className="mb-4">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search chapters..."
          className="mb-3"
        />

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-3">
          {/* Subject Filter Dropdown */}
          <div className="w-full md:w-56 bg-surface rounded-lg shadow-sm p-2">
            <label
              htmlFor="subject-filter"
              className="block text-sm font-medium text-soft mb-1"
            >
              Filter by Subject
            </label>
            <select
              id="subject-filter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-md text-strong 
                          focus:outline-none 
                         focus:ring-2 focus:ring-brand/40"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Form Filter Dropdown */}
          <div className="w-full md:w-56 bg-surface rounded-lg shadow-sm p-2">
            <label
              htmlFor="form-filter"
              className="block text-sm font-medium text-soft mb-1"
            >
              Filter by Form
            </label>
            <select
              id="form-filter"
              value={formFilter === 'all' ? 'all' : formFilter.toString()}
              onChange={(e) =>
                setFormFilter(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              className="w-full px-3 py-2 bg-surface border border-border rounded-md text-strong 
                          focus:outline-none 
                         focus:ring-2 focus:ring-brand/40"
            >
              <option value="all">All Forms</option>
              {uniqueFormNumbers.map((form) => (
                <option key={form} value={form}>
                  Form {form}
                </option>
              ))}
            </select>
          </div>
        </div>

        <FilterSortControls
          selectedFilter="all"
          onFilterChange={() => {}}
          filterOptions={[{ id: 'all', label: 'All' }]}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          sortOptions={sortOptions}
          sortDirection={sortDirection}
          onSortDirectionChange={handleSortDirectionToggle}
          perPageOptions={[5, 10, 25, 50]}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
      {showNewChapterForm && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-3">Create New Chapter</h3>
          <form onSubmit={handleCreateChapter}>
            <div className="mb-3">
              <label
                htmlFor="chapter-name"
                className="block text-sm font-medium text-soft mb-1"
              >
                Chapter Title
              </label>
              <input
                id="chapter-name"
                type="text"
                value={newChapter.name}
                onChange={(e) =>
                  setNewChapter({
                    ...newChapter,
                    name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter chapter title"
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="chapter-subject"
                className="block text-sm font-medium text-soft mb-1"
              >
                Subject
              </label>
              <select
                id="chapter-subject"
                value={newChapter.subject_id}
                onChange={(e) =>
                  setNewChapter({
                    ...newChapter,
                    subject_id: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>{' '}
            <div className="mb-3">
              <label
                htmlFor="chapter-form"
                className="block text-sm font-medium text-soft mb-1"
              >
                Form
              </label>
              <select
                id="chapter-form"
                value={newChapter.form}
                onChange={(e) =>
                  setNewChapter({
                    ...newChapter,
                    form: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={4}>Form 4</option>
                <option value={5}>Form 5</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Chapter'}
              </button>
            </div>
          </form>
        </div>
      )}
      <DataTableCardView<Chapter>
        data={paginatedChapters}
        isLoading={loading}
        columns={columns}
        cardFields={cardFields}
        keyExtractor={(chapter) => chapter.id}
        emptyMessage="No chapters found. Create your first chapter to get started."
        emptyFilteredMessage="No chapters match your search or filter criteria."
        isFiltered={
          searchTerm !== '' || subjectFilter !== 'all' || formFilter !== 'all'
        }
        actions={renderActions}
      />
      {/* Pagination controls */}
      {totalItems > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

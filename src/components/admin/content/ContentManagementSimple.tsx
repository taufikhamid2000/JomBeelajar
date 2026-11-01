'use client';

import { useState, useMemo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import {
  DataTableCardView,
  Column,
  CardField,
  SearchBar,
  FilterSortControls,
  SortDirection,
  Pagination,
} from '@/components/admin/ui';

// Simple generic props interface
export interface ContentManagementProps<T> {
  // Core data
  items: T[];
  entityName: string;
  entityNamePlural: string;

  // UI Configuration
  columns: Column<T>[];
  cardFields: CardField<T>[];

  // State management
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  // Actions
  refreshItems: () => Promise<void>;
  createItem: (
    item: Record<string, unknown>
  ) => Promise<{ id: string | null; error: Error | null }>;
  deleteItem: (
    id: string
  ) => Promise<{ success: boolean; error: Error | null }>;

  // Form handling
  initialFormState: Record<string, unknown>;
  renderForm: (
    formState: Record<string, unknown>,
    setFormState: (state: Record<string, unknown>) => void,
    loading: boolean
  ) => ReactNode;

  // Search functionality
  searchField: string;

  // Base route for edit pages
  baseRoute?: string;

  // Creation control
  disableCreation?: boolean;
}

export default function ContentManagement<T extends { id: string }>({
  // Core data
  items,
  entityName,
  entityNamePlural,

  // UI Configuration
  columns,
  cardFields,

  // State management
  loading,
  setLoading,
  setError,
  setSuccessMessage,

  // Actions
  refreshItems,
  createItem,
  deleteItem,

  // Form handling
  initialFormState,
  renderForm,

  // Search functionality
  searchField,

  // Base route for edit pages
  baseRoute = '',

  // Creation control
  disableCreation = false,
}: ContentManagementProps<T>) {
  // Show/hide form state
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemState, setNewItemState] = useState(initialFormState);

  // Pagination, filtering and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedSort, setSelectedSort] = useState(columns[0]?.key || '');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Toggle sort direction
  const handleSortDirectionToggle = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    // First filter by search term
    const filtered = items.filter((item) => {
      // Handle search field not existing on item
      const searchValue = String(item[searchField as keyof T] || '');
      return searchValue.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Sort the filtered results
    return filtered.sort((a, b) => {
      const aValue = a[selectedSort as keyof T];
      const bValue = b[selectedSort as keyof T];

      // Compare based on the field type
      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        // Fallback to string comparison
        comparison = String(aValue || '').localeCompare(String(bValue || ''));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, searchTerm, selectedSort, sortDirection, searchField]);

  // Pagination calculation
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Function to handle item creation
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { id, error } = await createItem(newItemState);

      if (error) {
        throw error;
      }

      if (!id) {
        throw new Error(`Failed to create ${entityName.toLowerCase()}`);
      }

      // Refresh items list
      await refreshItems();

      // Get display name for success message
      const displayName = newItemState.name || newItemState.title || id;

      // Reset form and hide it
      setNewItemState(initialFormState);
      setShowNewItemForm(false);
      setSuccessMessage(`${entityName} "${displayName}" created successfully!`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Failed to create ${entityName.toLowerCase()}: ${errorMessage}`);
      logger.error(`Error creating ${entityName.toLowerCase()}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle item deletion
  const handleDeleteItem = async (id: string, displayName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the ${entityName.toLowerCase()} "${displayName}"?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { success, error } = await deleteItem(id);

      if (error) {
        throw error;
      }

      if (!success) {
        throw new Error(`Failed to delete ${entityName.toLowerCase()}`);
      }

      // Refresh the items list
      await refreshItems();
      setSuccessMessage(`${entityName} "${displayName}" deleted successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Failed to delete ${entityName.toLowerCase()}: ${errorMessage}`);
      logger.error(`Error deleting ${entityName.toLowerCase()}:`, error);
    } finally {
      setLoading(false);
    }
  };
  // Actions render function with dynamic URL generation
  const renderActions = (item: T) => {
    // Display name will be name or title or just ID if neither is available
    const displayName =
      ((item as Record<string, unknown>).name as string) ||
      ((item as Record<string, unknown>).title as string) ||
      item.id;

    return (
      <>
        {baseRoute && (
          <Link
            href={`${baseRoute}/${item.id}`}
            className="text-brand hover:text-brand mr-4"
          >
            Edit
          </Link>
        )}
        <button
          onClick={() => handleDeleteItem(item.id, displayName)}
          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
        >
          Delete
        </button>
      </>
    );
  };

  // Determine if filters are applied
  const isFilterApplied = searchTerm !== '';

  // Sort options derived from columns
  const sortOptions = columns.map((col) => ({
    id: col.key,
    label: col.header,
  }));

  return (
    <div>
      {' '}
      {/* Header with title and add button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{entityNamePlural} Management</h2>
        {!disableCreation && (
          <button
            onClick={() => setShowNewItemForm(!showNewItemForm)}
            className="bg-[var(--band-via)] text-white px-4 py-2 rounded hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)]"
          >
            {showNewItemForm ? 'Cancel' : `Add New ${entityName}`}
          </button>
        )}
      </div>
      {/* Search and filter controls */}
      <div className="mb-4">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder={`Search ${entityNamePlural.toLowerCase()}...`}
          className="mb-3"
        />

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
      {/* New item form */}
      {showNewItemForm && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-3">Create New {entityName}</h3>
          <form onSubmit={handleCreateItem}>
            {renderForm(newItemState, setNewItemState, loading)}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                disabled={loading}
              >
                {loading ? 'Creating...' : `Create ${entityName}`}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Data table */}
      <DataTableCardView<T>
        data={paginatedItems}
        isLoading={loading}
        columns={columns}
        cardFields={cardFields}
        keyExtractor={(item) => item.id}
        emptyMessage={`No ${entityNamePlural.toLowerCase()} found. Create your first ${entityName.toLowerCase()} to get started.`}
        emptyFilteredMessage={`No ${entityNamePlural.toLowerCase()} match your search or filter criteria.`}
        isFiltered={isFilterApplied}
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

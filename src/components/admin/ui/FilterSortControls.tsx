'use client';

import { useState } from 'react';

export type SortDirection = 'asc' | 'desc';

interface FilterOption {
  id: string;
  label: string;
}

interface SortOption {
  id: string;
  label: string;
}

interface FilterSortControlsProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  filterOptions: FilterOption[];
  selectedSort: string;
  onSortChange: (sort: string) => void;
  sortOptions: SortOption[];
  sortDirection: SortDirection;
  onSortDirectionChange: () => void;
  perPageOptions?: number[];
  itemsPerPage?: number;
  onItemsPerPageChange?: (perPage: number) => void;
}

export default function FilterSortControls({
  selectedFilter,
  onFilterChange,
  filterOptions,
  selectedSort,
  onSortChange,
  sortOptions,
  sortDirection,
  onSortDirectionChange,
  perPageOptions = [5, 10, 25, 50],
  itemsPerPage = 10,
  onItemsPerPageChange,
}: FilterSortControlsProps) {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const toggleFilterMenu = () => setIsFilterMenuOpen(!isFilterMenuOpen);

  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between p-4 bg-surface rounded-lg shadow-sm mb-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-soft mb-1">
              Filter
            </label>
            <div className="flex space-x-2">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onFilterChange(option.id)}
                  className={`px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                    selectedFilter === option.id
                      ? 'bg-[var(--band-via)] text-white'
                      : 'bg-muted text-soft'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <label className="block text-sm font-medium text-soft mb-1">
              Sort by
            </label>
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-border rounded-md text-soft focus:outline-none focus:ring-2 focus:ring-brand/40 appearance-none pr-8"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none mt-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-soft"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-soft mb-1">
              Direction
            </label>
            <button
              onClick={onSortDirectionChange}
              className="px-3 py-1.5 bg-surface border border-border rounded-md text-soft focus:outline-none focus:ring-2 focus:ring-brand/40 flex items-center space-x-1"
              aria-label={
                sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'
              }
            >
              {sortDirection === 'asc' ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                    />
                  </svg>
                  <span>Ascending</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                    />
                  </svg>
                  <span>Descending</span>
                </>
              )}
            </button>
          </div>

          {onItemsPerPageChange && (
            <div>
              <label className="block text-sm font-medium text-soft mb-1">
                Per Page
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="px-3 py-1.5 bg-surface border border-border rounded-md text-soft focus:outline-none focus:ring-2 focus:ring-brand/40 appearance-none pr-8"
              >
                {perPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex flex-col gap-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={toggleFilterMenu}
            className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-soft focus:outline-none focus:ring-2 focus:ring-brand/40 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
          </button>

          <div className="flex-1 relative">
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-soft focus:outline-none focus:ring-2 focus:ring-brand/40 appearance-none"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-soft"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <button
            onClick={onSortDirectionChange}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
            aria-label={
              sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'
            }
          >
            {sortDirection === 'asc' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile filter dropdown */}
        {isFilterMenuOpen && (
          <div className="mt-2 p-4 bg-surface border border-border rounded-lg shadow-lg">
            <h3 className="text-sm font-medium text-soft mb-2">Filter</h3>
            <div className="grid grid-cols-2 gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onFilterChange(option.id)}
                  className={`px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                    selectedFilter === option.id
                      ? 'bg-[var(--band-via)] text-white'
                      : 'bg-muted text-soft'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import React from 'react';

interface SubjectSearchProps {
  searchTerm: string;
  selectedCategory: string;
  categories: string[];
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const fieldClass =
  'block w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400';

const SubjectSearch = ({
  searchTerm,
  selectedCategory,
  categories,
  handleSearchChange,
  handleCategoryChange,
}: SubjectSearchProps) => {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-grow">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          type="search"
          aria-label="Search courses"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search courses..."
          className={`${fieldClass} py-2 pl-10 pr-3`}
        />
      </div>
      <div className="sm:w-1/3">
        <select
          aria-label="Filter by category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className={`${fieldClass} py-2 pl-3 pr-10`}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SubjectSearch;

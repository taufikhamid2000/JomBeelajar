import { Quiz } from '@/types/topics';
import { useState, useMemo } from 'react';

export interface QuizTableProps {
  quizzes: Quiz[];
  showCreator?: boolean; // Whether to show creator column
  getQuizLink?: (quiz: Quiz) => string; // Custom quiz link generator
  emptyMessage?: string; // Custom empty state message
  title?: string; // Optional title
  showResultCount?: boolean; // Whether to show result count
}

type SortDirection = 'asc' | 'desc' | null;
type StatusFilter = 'all' | 'verified' | 'unverified';

const ITEMS_PER_PAGE = 5;

export default function QuizTable({
  quizzes: initialQuizzes,
  showCreator = true,
  getQuizLink,
  emptyMessage,
  title,
  showResultCount = true,
}: QuizTableProps) {
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Reset to first page when search or filters change
  const updateSearchTerm = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  const updateStatusFilter = (value: StatusFilter) => {
    if (value === statusFilter) return;
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Reset filters when initialQuizzes changes (adjusted during render rather
  // than in an effect)
  const [prevQuizzes, setPrevQuizzes] = useState(initialQuizzes);
  if (initialQuizzes !== prevQuizzes) {
    setPrevQuizzes(initialQuizzes);
    setSortDirection(null);
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  }

  // Default quiz link generator (for topic pages)
  const defaultGetQuizLink = (quiz: Quiz) => {
    return `/quiz/${window.location.pathname.split('/')[2]}/${window.location.pathname.split('/')[3]}/play/${quiz.id}`;
  };

  // Filter and search quizzes
  const filteredQuizzes = useMemo(() => {
    return initialQuizzes.filter((quiz) => {
      // Status filter
      if (statusFilter === 'verified' && !quiz.verified) return false;
      if (statusFilter === 'unverified' && quiz.verified) return false;

      // Search filter - check name, display_name, and creator email
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        const nameMatch = quiz.name.toLowerCase().includes(searchTermLower);
        const displayNameMatch =
          quiz.display_name &&
          quiz.display_name.toLowerCase().includes(searchTermLower);
        const creatorMatch =
          quiz.email &&
          quiz.email.split('@')[0].toLowerCase().includes(searchTermLower);
        return nameMatch || displayNameMatch || creatorMatch;
      }

      return true;
    });
  }, [initialQuizzes, searchTerm, statusFilter]);

  // Sort filtered quizzes
  const sortedQuizzes = useMemo(() => {
    if (!sortDirection) return filteredQuizzes;

    return [...filteredQuizzes].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredQuizzes, sortDirection]);

  // Paginate sorted quizzes
  const paginatedQuizzes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedQuizzes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedQuizzes, currentPage]);

  // Calculate total pages
  const totalPages = Math.max(
    1,
    Math.ceil(sortedQuizzes.length / ITEMS_PER_PAGE)
  );

  return (
    <div className="mt-6">
      {title && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h3>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search input */}
        <div className="relative">
          <label htmlFor="quiz-search" className="sr-only">
            Search quizzes
          </label>
          <input
            id="quiz-search"
            type="text"
            placeholder="Search quiz name or creator..."
            value={searchTerm}
            onChange={(e) => updateSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md w-full max-w-xs bg-gray-800 dark:bg-white border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search quizzes"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <span
            id="status-filter-label"
            className="text-sm text-gray-300 dark:text-gray-600 self-center"
          >
            Status:
          </span>
          <div
            className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-700"
            role="group"
            aria-labelledby="status-filter-label"
          >
            <button
              onClick={() => updateStatusFilter('all')}
              className={`px-3 py-1 text-sm ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 dark:bg-white text-gray-300 dark:text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-100'
              }`}
              aria-pressed={statusFilter === 'all'}
            >
              All
            </button>
            <button
              onClick={() => updateStatusFilter('verified')}
              className={`px-3 py-1 text-sm ${
                statusFilter === 'verified'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 dark:bg-white text-gray-300 dark:text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-100'
              }`}
              aria-pressed={statusFilter === 'verified'}
            >
              Verified
            </button>
            <button
              onClick={() => updateStatusFilter('unverified')}
              className={`px-3 py-1 text-sm ${
                statusFilter === 'unverified'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 dark:bg-white text-gray-300 dark:text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-100'
              }`}
              aria-pressed={statusFilter === 'unverified'}
            >
              Unverified
            </button>
          </div>
        </div>
      </div>

      {/* Result count */}
      {showResultCount && (
        <div className="text-sm text-gray-400 dark:text-gray-500 mb-2">
          {sortedQuizzes.length === 0
            ? 'No quizzes found'
            : `Showing ${sortedQuizzes.length} ${sortedQuizzes.length === 1 ? 'quiz' : 'quizzes'}`}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table-auto w-full">
          <thead>
            <tr className="bg-gray-800 dark:bg-gray-100">
              <th className="px-4 py-2 text-left">Quiz Code</th>
              {showCreator && (
                <th className="px-4 py-2 text-left hidden sm:table-cell">
                  Created by
                </th>
              )}
              <th
                className="px-4 py-2 text-left cursor-pointer select-none group"
                onClick={handleSort}
                aria-sort={
                  sortDirection === 'asc'
                    ? 'ascending'
                    : sortDirection === 'desc'
                      ? 'descending'
                      : 'none'
                }
              >
                <div className="flex items-center">
                  <span className="md:inline">Created at</span>
                  <span className="ml-1" aria-hidden="true">
                    {sortDirection === 'asc'
                      ? '↑'
                      : sortDirection === 'desc'
                        ? '↓'
                        : '⇅'}
                  </span>{' '}
                </div>
              </th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 dark:divide-gray-200">
            {paginatedQuizzes.length === 0 ? (
              <tr>
                <td
                  colSpan={showCreator ? 4 : 3}
                  className="text-center py-8 text-gray-400 dark:text-gray-500"
                >
                  {searchTerm || statusFilter !== 'all'
                    ? 'No quizzes match your search criteria'
                    : emptyMessage || 'No quizzes available'}
                </td>
              </tr>
            ) : (
              paginatedQuizzes.map((quiz, index) => (
                <tr
                  key={`${quiz.id}-${index}`}
                  className="border-b hover:bg-gray-800 dark:hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <a
                        href={
                          getQuizLink
                            ? getQuizLink(quiz)
                            : defaultGetQuizLink(quiz)
                        }
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          const link = getQuizLink
                            ? getQuizLink(quiz)
                            : defaultGetQuizLink(quiz);
                          window.location.href = link;
                        }}
                      >
                        {quiz.name}
                      </a>
                      {/* Show verification badge on mobile when name is shown */}
                      <span className="ml-2 inline sm:hidden">
                        {quiz.verified ? (
                          <span
                            className="inline-block w-2 h-2 bg-green-500 rounded-full"
                            title="Verified"
                          ></span>
                        ) : (
                          <span
                            className="inline-block w-2 h-2 bg-yellow-500 rounded-full"
                            title="Unverified"
                          ></span>
                        )}
                      </span>
                    </div>
                  </td>
                  {showCreator && (
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {quiz.created_by && quiz.created_by !== 'Unknown' ? (
                        <button
                          onClick={() => {
                            window.open(
                              `/profile?userId=${quiz.created_by}`,
                              '_blank'
                            );
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                          title={`View ${
                            quiz.display_name ||
                            quiz.email?.split('@')[0] ||
                            'user'
                          }'s profile (opens in new tab)`}
                        >
                          {quiz.display_name ||
                            quiz.email?.split('@')[0] ||
                            'Unknown User'}
                        </button>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          {quiz.display_name ||
                            quiz.email?.split('@')[0] ||
                            'Unknown'}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {quiz.created_at
                      ? new Date(quiz.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm ${
                        quiz.verified
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}
                    >
                      {quiz.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div
            className="text-sm text-gray-400 dark:text-gray-500"
            aria-live="polite"
          >
            Page {currentPage} of {totalPages}
          </div>
          <nav aria-label="Quiz pagination">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-disabled={currentPage === 1}
                aria-label="Go to previous page"
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-800 dark:bg-gray-100 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 dark:bg-white text-blue-600 dark:text-blue-400 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                aria-disabled={currentPage === totalPages}
                aria-label="Go to next page"
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-800 dark:bg-gray-100 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 dark:bg-white text-blue-600 dark:text-blue-400 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Next
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

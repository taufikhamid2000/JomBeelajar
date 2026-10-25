import React from 'react';
import ProgressRing from './ProgressRing';

interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category?: string;
  category_priority?: number;
  order_index?: number;
}

interface SubjectGridProps {
  subjects: Subject[];
  error: string | null;
  currentPage: number;
  totalPages: number;
  handleSubjectClick: (subject: Subject) => void;
  handlePageChange: (pageNumber: number) => void;
  /** Percent complete (0-100) keyed by subject slug. Defaults to 0. */
  progress?: Record<string, number>;
  /** Slug of the last-touched subject, used to label the button "Continue". */
  lastSlug?: string | null;
}

const pageBtn =
  'min-h-[44px] min-w-[44px] rounded-xl px-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';

const SubjectGrid = ({
  subjects,
  error,
  currentPage,
  totalPages,
  handleSubjectClick,
  handlePageChange,
  progress = {},
  lastSlug = null,
}: SubjectGridProps) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      {error ? (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          Error loading subjects: {error}
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-gray-600 dark:text-gray-300">
          No courses found. Try a different search or category.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {subjects.map((subject) => {
            const pct = Math.round(progress[subject.slug] ?? 0);
            const isCurrent = lastSlug === subject.slug || pct > 0;
            return (
              <li key={subject.id} className="flex">
                <div className="flex w-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950/50"
                      aria-hidden="true"
                    >
                      {subject.icon || '📘'}
                    </span>
                    <ProgressRing
                      percent={pct}
                      label={`${subject.name} progress`}
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                    {subject.name}
                  </h3>
                  <p className="mt-1 flex-grow text-sm text-gray-600 dark:text-gray-400">
                    {subject.description && subject.description.length > 120
                      ? `${subject.description.substring(0, 120)}...`
                      : subject.description}
                  </p>
                  {subject.category && (
                    <span className="mt-3 inline-block self-start rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {subject.category}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSubjectClick(subject)}
                    aria-label={`${isCurrent ? 'Continue' : 'Start'} ${subject.name}`}
                    className={`mt-4 min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 ${
                      isCurrent
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isCurrent ? 'Continue' : 'Start'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-6 flex flex-wrap justify-center gap-1"
        >
          <button
            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className={`${pageBtn} ${
              currentPage === 1
                ? 'cursor-not-allowed text-gray-400'
                : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            &lt;
          </button>
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              aria-current={number === currentPage ? 'page' : undefined}
              className={`${pageBtn} ${
                number === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700'
              }`}
            >
              {number}
            </button>
          ))}
          <button
            onClick={() =>
              currentPage < totalPages && handlePageChange(currentPage + 1)
            }
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className={`${pageBtn} ${
              currentPage === totalPages
                ? 'cursor-not-allowed text-gray-400'
                : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            &gt;
          </button>
        </nav>
      )}
    </>
  );
};

export default SubjectGrid;

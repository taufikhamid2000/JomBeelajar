'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error on the client side
    logger.error('Dashboard error:', error);
  }, [error]);

  return (
    <main className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-12 w-12 text-red-500 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-strong mb-4">
            Something went wrong!
          </h2>
          <p className="text-soft mb-6">
            {error.message || 'An error occurred while loading the dashboard'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40 dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)]"
            >
              Try again
            </button>
            <Link
              href="/static/dashboard"
              className="inline-flex items-center px-4 py-2 border border-border text-base font-medium rounded-md shadow-sm text-soft bg-surface hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40"
            >
              View Static Dashboard
            </Link>
          </div>
          <p className="mt-4 text-sm text-soft">
            If the problem persists, please contact support
          </p>
        </div>
      </div>
    </main>
  );
}

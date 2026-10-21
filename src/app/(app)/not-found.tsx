'use client';
/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { logger } from '@/lib/logger';

const noopSubscribe = () => () => {};

export default function NotFound() {
  const pathname = usePathname();
  // URL params are read on the client only (empty during SSR/hydration) to
  // avoid SSR issues.
  const search = useSyncExternalStore(
    noopSubscribe,
    () => window.location.search,
    () => ''
  );
  const searchParams = new URLSearchParams(search);
  const error = searchParams.get('error');
  const from = searchParams.get('from');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    logger.debug(`404 Page not found: ${pathname}`, {
      error: params.get('error'),
      from: params.get('from'),
    });

    // If this is a quiz page, log additional details
    if (pathname?.includes('/quiz/')) {
      const segments = pathname.split('/');
      if (segments.length >= 4) {
        const subject = segments[2];
        const topic = segments[3];
        logger.debug(`Not Found: subject=${subject}, topic=${topic}`);
      }
    }
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 dark:bg-gray-50">
      <div className="bg-gray-800 dark:bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600 dark:text-blue-400">
          {error && from === 'random-topic'
            ? 'No Topics Available'
            : 'Page Not Found'}
        </h1>

        <div className="mb-6 text-center">
          <p className="text-gray-300 dark:text-gray-700 mb-4">
            {error && from === 'random-topic'
              ? 'Sorry, there are no topics available right now.'
              : "We couldn't find the page you're looking for."}
          </p>

          {error && from === 'random-topic' && (
            <div className="text-sm bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md text-blue-800 dark:text-blue-300 mb-4">
              <p className="mb-2">Database query returned no results</p>
              <p className="text-xs opacity-75">
                Try clicking the button again or contact support if the problem
                persists.
              </p>
            </div>
          )}

          {!error && pathname?.includes('/quiz/') && (
            <p className="text-sm bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md text-yellow-800 dark:text-yellow-300 mb-4">
              The topic or subject you're looking for might not exist or has
              been removed.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center transition-colors"
          >
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="bg-gray-700 dark:bg-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-200 dark:text-gray-800 py-2 px-4 rounded text-center transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

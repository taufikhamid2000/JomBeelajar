'use client';

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

  const isTopicError = Boolean(error && from === 'random-topic');
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="jb-card w-full max-w-md p-6 text-center md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {isTopicError ? 'Nothing here yet' : 'Error 404'}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-strong">
          {isTopicError ? 'No topics available' : 'Page not found'}
        </h1>
        <p className="mt-3 text-soft">
          {isTopicError
            ? 'There are no topics available right now. Try again in a moment.'
            : 'We could not find the page you are looking for.'}
        </p>
        {!error && pathname?.includes('/quiz/') && (
          <p className="mt-3 rounded-xl bg-[var(--warn-bg)] p-3 text-sm text-[var(--warn-fg)]">
            The topic or subject might not exist or has been removed.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="press inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--band-via)] px-5 text-sm font-semibold text-white hover:bg-[var(--band-from)]"
          >
            Go to dashboard
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="press inline-flex min-h-[44px] items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-strong hover:bg-muted"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

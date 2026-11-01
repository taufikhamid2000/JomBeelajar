'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import LoadingState from '@/components/LoadingState';

/**
 * Root route ("/"). Not a public marketing page: unauthenticated visitors
 * are sent to /auth, authenticated visitors are sent straight to /dashboard.
 * The original marketing/pitch content that used to live here has been
 * folded into the About page (/about).
 */
export default function RootPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error('Session error on root page:', sessionError);
          setError('Authentication error. Please try signing in again.');
          router.replace('/auth');
          return;
        }

        router.replace(session ? '/dashboard' : '/auth');
      } catch (err) {
        logger.error('Unexpected error checking session on root page:', err);
        router.replace('/auth');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-soft">
        {error}
      </div>
    );
  }

  return <LoadingState />;
}

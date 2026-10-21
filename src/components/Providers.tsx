'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initConsoleOverride } from '@/lib/console-override';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { hardNavigate } from '@/lib/hard-navigate';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 2,
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    },
  },
});

/**
 * Clean OAuth tokens from URL hash to ensure clean redirects
 */
const cleanOAuthTokensFromUrl = () => {
  if (typeof window === 'undefined') return;

  const hash = window.location.hash;

  // Check if URL contains OAuth tokens
  if (
    hash &&
    (hash.includes('access_token=') ||
      hash.includes('refresh_token=') ||
      hash.includes('expires_at=') ||
      hash.includes('token_type='))
  ) {
    // Clean the URL by removing the hash
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', cleanUrl);
    logger.info('Cleaned OAuth tokens from URL hash');
  }
};

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize console override in production
    if (process.env.NODE_ENV === 'production') {
      initConsoleOverride();
    }

    // Clean URL immediately on mount if tokens are present
    cleanOAuthTokensFromUrl();

    // DISABLED: Periodic session check that was causing repeated requests
    // const checkInterval = setInterval(
    //   async () => {
    //     try {
    //       const { error } = await supabase.auth.getSession();
    //       if (error) {
    //         logger.warn('Scheduled session check failed:', error);
    //         const { recoverSession } = await import('@/lib/supabase');
    //         await recoverSession();
    //       }
    //     } catch (err) {
    //       logger.error('Error in scheduled session check:', err);
    //     }
    //   },
    //   5 * 60 * 1000
    // ); // Check every 5 minutes

    // SIMPLIFIED: Set up minimal auth state listener without repeated session checks
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'TOKEN_REFRESHED') {
        logger.info('Auth token refreshed successfully');
        cleanOAuthTokensFromUrl();
        queryClient.invalidateQueries();
      } else if (event === 'SIGNED_IN') {
        logger.info('User signed in successfully');
        setTimeout(() => {
          cleanOAuthTokensFromUrl();
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        logger.info('User signed out');
        // Catches session loss detected via the browser's native storage
        // event too (e.g. clearing localStorage/cookies manually, or
        // signing out in another tab) — Supabase fires SIGNED_OUT for that
        // case as well as an explicit signOut() call. No extra network
        // request here; this reuses the event this listener already gets.
        const protectedPrefixes = ['/dashboard', '/profile', '/admin'];
        if (
          protectedPrefixes.some((p) => window.location.pathname.startsWith(p))
        ) {
          hardNavigate('/auth');
        }
      } else if (event === 'USER_UPDATED') {
        logger.info('User data updated');
      } else if (event === 'PASSWORD_RECOVERY') {
        logger.info('Password recovery initiated');
      }

      // DISABLED: Repeated session checks that were causing request spam
      // const { data, error } = await supabase.auth.getSession();
      // if (error || !data.session) {
      //   logger.warn('Session issues detected, attempting recovery');
      //   try {
      //     const { recoverSession } = await import('@/lib/supabase');
      //     await recoverSession();
      //     const { data } = await supabase.auth.getSession();
      //     if (!data.session) {
      //       logger.warn('Session recovery failed, redirecting to auth page');
      //       window.location.href = '/auth';
      //     }
      //   } catch (err) {
      //     logger.error('Error during token refresh recovery:', err);
      //   }
      // }
    });

    // Additional cleanup on page visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(cleanOAuthTokensFromUrl, 50);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      // clearInterval(checkInterval); // Disabled since checkInterval is commented out
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

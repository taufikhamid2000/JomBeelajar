'use client';
// Import dynamic config to optimize build
import './config';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AdminClient from './AdminClient';
import AccessDenied from '@/components/admin/AccessDenied';
import LoadingState from '@/components/LoadingState';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndAdminStatus = async () => {
      try {
        setLoading(true);

        // Get user session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error('Session error in admin page:', sessionError);
          setError('Authentication error. Please try signing in again.');
          return;
        }

        if (!session) {
          logger.info('No active session, redirecting to auth');
          router.push('/auth');
          return;
        }

        // Check admin status
        try {
          // Use regular supabase client for role check. maybeSingle — most
          // users have no row here, which is expected, not an error.
          const { data: adminData, error: adminError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (adminError) {
            logger.error('Database error checking admin status:', adminError);
            setIsAdmin(false);
          } else {
            // Successfully retrieved user role
            const roleValue = (adminData?.role || '').toLowerCase();
            const isUserAdmin =
              roleValue === 'admin' || roleValue.includes('admin');
            setIsAdmin(isUserAdmin);
            logger.info(
              `Admin check completed: ${isUserAdmin ? 'is admin' : 'not admin'} (role: ${adminData?.role})`
            );
          }
        } catch (error) {
          logger.error('Failed to check admin status:', error);
          setIsAdmin(false);
        }
      } catch (error) {
        logger.error('Error in admin page:', error);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndAdminStatus();
  }, [router]);
  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-soft mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--band-via)] text-white rounded hover:bg-[var(--band-from)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Auth required or not admin
  if (isAdmin === false) {
    return <AccessDenied />;
  }

  // Auth required state (shouldn't reach here due to redirect, but just in case)
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Required
          </h1>
          <p className="text-soft mb-4">
            Please sign in to access the admin panel.
          </p>
          <a
            href="/auth"
            className="px-4 py-2 bg-[var(--band-via)] text-white rounded hover:bg-[var(--band-from)]"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  return <AdminClient />;
}

'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useIsClient } from '@/hooks/useIsClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMounted = useIsClient();

  // Initialize theme from localStorage and handle admin page access logging
  useEffect(() => {
    // Get theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme ?? 'dark';

    // Apply theme class to html element
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);

    // Log admin page access for monitoring/security
    const logAdminAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          logger.log('Admin area accessed by user:', session.user.id);
        }
      } catch (error) {
        logger.error('Error logging admin access:', error);
      }
    };

    logAdminAccess();
  }, []);

  if (!isMounted) {
    return null;
  }

  return <div className="admin-layout dark:bg-gray-900">{children}</div>;
}

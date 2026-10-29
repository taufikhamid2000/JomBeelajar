import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';

// This API endpoint allows setting a user as admin
// Only an existing, verified admin may use this. There is no bootstrap path:
// the first admin must be inserted via SQL.
export async function POST(request: Request) {
  try {
    // Get request body
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and role' },
        { status: 400 }
      );
    }

    logger.info(`Attempting to set user ${userId} as ${role}`);

    // Always require a verified session and an existing admin caller.
    try {
      // Verify the user is authenticated and has admin privileges
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          db: { schema: 'edubridge' },
          // Jom ID: shared *.taufikhamid.com session cookie (read-only here).
          cookieOptions: jomCookieOptions((await headers()).get('host')),
          cookies: {
            get: (name) => cookieStore.get(name)?.value,
            set: () => {}, // These methods aren't needed for server-side only usage
            remove: () => {},
          },
        }
      );

      // Verify user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - you must be logged in' },
          { status: 401 }
        );
      }

      // Check if user has admin privileges - USING ADMIN CLIENT TO BYPASS RLS
      // maybeSingle — most users have no row here, which is expected.
      const { data: userRoles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!userRoles || userRoles.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      return NextResponse.json(
        {
          error: 'Authentication error',
          message: 'An error occurred while verifying your admin privileges',
        },
        { status: 500 }
      );
    }

    // Use the admin client to bypass RLS policies
    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: userId, role })
      .select();

    if (error) {
      logger.error('Error setting user role:', error);
      return NextResponse.json(
        { error: 'Failed to set user role' },
        { status: 500 }
      );
    }

    logger.info(`Successfully set user ${userId} as ${role}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API Error in /api/admin/make-admin (POST):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

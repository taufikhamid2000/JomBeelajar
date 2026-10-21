import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';

// This API endpoint fetches user data using the admin client
// It should only be accessible to authenticated admin users
export async function GET() {
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
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      logger.warn(
        'Unauthorized attempt to access admin/users - no session found'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges - using admin client to bypass RLS
    // This is secure because we're still checking if the user is logged in.
    // maybeSingle — most users have no row here, which is expected.
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!userRoles || userRoles.role !== 'admin') {
      logger.warn(
        `User ${session.user.id} attempted to access admin but lacks admin role`
      );
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch user profiles with admin client (bypassing RLS)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select(
        `
        id,
        display_name,
        avatar_url,
        level,
        xp,
        created_at,
        user_roles:user_id (role)
      `
      )
      .order('created_at', { ascending: false });

    if (profilesError) {
      logger.error('Error fetching user profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      );
    }

    // Fetch emails separately with admin client
    const { data: authUsers, error: authError } = await supabaseAdmin
      .from('users')
      .select('id, email');

    if (authError) {
      logger.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch auth users' },
        { status: 500 }
      );
    }

    // Combine the data
    const usersWithEmail = profiles.map((user) => {
      const authUser = authUsers?.find((au) => au.id === user.id);

      // Extract role from user_roles array
      let role = 'user'; // default role
      if (
        user.user_roles &&
        Array.isArray(user.user_roles) &&
        user.user_roles.length > 0
      ) {
        role = user.user_roles[0].role;
      }

      return {
        id: user.id,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        level: user.level,
        xp: user.xp,
        created_at: user.created_at,
        email: authUser?.email || 'Email not available',
        role: role,
      };
    });

    return NextResponse.json({ users: usersWithEmail });
  } catch (error) {
    logger.error('API Error in /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle role updates
export async function POST(request: Request) {
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
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges. maybeSingle — most users have
    // no row here, which is expected.
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!userRoles || userRoles.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and role' },
        { status: 400 }
      );
    }

    // Update the user's role in the user_roles table
    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: userId, role })
      .select();

    if (error) {
      logger.error('Error updating user role:', error);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API Error in /api/admin/users (POST):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

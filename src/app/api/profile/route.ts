import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { attachSchool } from '@/lib/schoolEnrichment';

// Cache duration in seconds
const CACHE_DURATION = 300; // 5 minutes

export async function GET() {
  try {
    // Get authenticated user (optional for profile)
    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: 'edubridge' },
        // Jom ID: shared *.taufikhamid.com session cookie (read-only here).
        cookieOptions: jomCookieOptions((await headers()).get('host')),
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    const {
      data: { session },
      error: sessionError,
    } = await supabaseServer.auth.getSession();

    if (sessionError) {
      logger.error('Session error in profile API:', sessionError);
      // Continue without authentication for guest user
    }

    if (!session?.user?.id) {
      // Return guest user profile
      return NextResponse.json(
        {
          id: 'guest',
          email: '',
          display_name: 'Guest User',
          avatar_url: '',
          streak: 0,
          xp: 0,
          level: 1,
          daily_xp: 0,
          weekly_xp: 0,
          last_quiz_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          isGuest: true,
        },
        {
          headers: {
            'Cache-Control': `public, s-maxage=60, stale-while-revalidate=120`,
          },
        }
      );
    }

    // Fetch authenticated user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select(
        `
        id,
        display_name,
        avatar_url,
        xp,
        level,
        streak,
        daily_xp,
        weekly_xp,
        last_quiz_date,
        created_at,
        updated_at,
        school_id,
        is_school_visible
      `
      )
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      logger.error('Error fetching user profile:', profileError);

      // If profile doesn't exist, create one
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: session.user.id,
            display_name: session.user.email?.split('@')[0] || 'New User',
            avatar_url: '',
            xp: 0,
            level: 1,
            streak: 0,
            daily_xp: 0,
            weekly_xp: 0,
          })
          .select(
            `
            id,
            display_name,
            avatar_url,
            xp,
            level,
            streak,
            daily_xp,
            weekly_xp,
            last_quiz_date,
            created_at,
            updated_at,
            school_id,
            is_school_visible
          `
          )
          .single();

        if (createError) {
          logger.error('Error creating user profile:', createError);
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          );
        }

        // Add email and guest flag to the new profile
        const userProfile = await attachSchool({
          ...newProfile,
          email: session.user.email || '',
          isGuest: false,
        });

        return NextResponse.json(userProfile, {
          headers: {
            'Cache-Control': `private, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
            Vary: 'Cookie, Authorization',
          },
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Add email and guest flag to the profile
    const userProfile = await attachSchool({
      ...profileData,
      email: session.user.email || '',
      isGuest: false,
    });

    return NextResponse.json(userProfile, {
      headers: {
        'Cache-Control': `private, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        Vary: 'Cookie, Authorization',
      },
    });
  } catch (error) {
    logger.error('Error in profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

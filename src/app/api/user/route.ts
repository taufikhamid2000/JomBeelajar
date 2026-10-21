'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.log('User API route called');

    const cookieStore = await cookies();
    let session = null;
    let userId = null;

    // 1. Try cookie auth first
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: 'edubridge' },
        // Jom ID: shared *.taufikhamid.com session cookie (read-only here).
        cookieOptions: jomCookieOptions((await headers()).get('host')),
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            logger.log(`Cookie ${name}:`, cookie ? 'exists' : 'missing');
            return cookie?.value;
          },
          set: () => {},
          remove: () => {},
        },
      }
    );

    const { data: sessionData, error: sessionError } =
      await supabaseServer.auth.getSession();

    if (sessionData?.session) {
      session = sessionData.session;
      userId = session.user.id;
      logger.log('User identified via cookie auth:', userId);
    } else {
      logger.log('Cookie auth failed:', sessionError?.message);

      // 2. Try bearer token auth as fallback
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        logger.log('Found bearer token, attempting auth');

        // Verify the token
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (data?.user && !error) {
            userId = data.user.id;
            logger.log('User identified via token auth:', userId);
          } else {
            logger.log('Token auth failed:', error?.message);
          }
        } catch (tokenError) {
          logger.error('Error verifying token:', tokenError);
        }
      }
    }

    // If we still don't have a userId, return guest data
    if (!userId) {
      logger.log('No authenticated user found, returning guest data');
      return NextResponse.json({
        user: {
          email: '',
          display_name: 'Guest User',
          streak: 0,
          xp: 0,
          level: 1,
          lastQuizDate: new Date().toISOString().split('T')[0],
        },
      });
    }

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('display_name, streak, xp, level, last_quiz_date')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      logger.error('Error fetching user profile:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Construct user response
    const user = {
      email: session?.user?.email || '',
      display_name: userData?.display_name || undefined,
      streak: userData?.streak || 0,
      xp: userData?.xp || 0,
      level: userData?.level || 1,
      lastQuizDate:
        userData?.last_quiz_date || new Date().toISOString().split('T')[0],
    };

    return NextResponse.json({ user });
  } catch (error) {
    logger.error('Error in user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

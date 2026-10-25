import { supabase } from '@/lib/supabase';
import { User, Achievement } from '@/types/users';
import { logger } from '@/lib/logger';

/**
 * Fetches the current user's profile data
 */
export async function fetchUserProfile(): Promise<{
  data: User | null;
  error: Error | null;
}> {
  try {
    // Get current user with a retry for session issues
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) {
      logger.warn(
        'Session error in fetchUserProfile, attempting recovery:',
        sessionError
      );
      const { recoverSession } = await import('@/lib/supabase');
      await recoverSession();
      // Get session again after recovery
      const { data: recoveredSession } = await supabase.auth.getSession();
      if (!recoveredSession.session) {
        return {
          data: null,
          error: new Error(
            'No authenticated user found after session recovery'
          ),
        };
      }
    }

    const currentUserId = sessionData?.session?.user?.id;
    if (!currentUserId) {
      return {
        data: null,
        error: new Error('No authenticated user found'),
      };
    }

    // Query user profile
    let profileData;
    const { data, error } = await supabase
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
      .eq('id', currentUserId)
      .single();

    profileData = data;
    if (error) {
      // Check if this is a "not found" error - if so, create a new profile
      if (error.code === 'PGRST116') {
        logger.info('Creating new user profile for user:', currentUserId);

        try {
          // Create a new profile
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: currentUserId,
              display_name:
                sessionData?.session?.user?.email?.split('@')[0] || 'New User',
              avatar_url: null,
              xp: 0,
              level: 1,
              streak: 0,
              daily_xp: 0,
              weekly_xp: 0,
            })
            .select('*')
            .single();

          if (createError) {
            logger.error(
              'Error creating user profile:',
              JSON.stringify(createError)
            );
            return {
              data: null,
              error: new Error(
                `Failed to create profile: ${createError.message}`
              ),
            };
          }

          profileData = newProfile;
        } catch (createError) {
          logger.error('Exception creating user profile:', createError);
          return {
            data: null,
            error: new Error('Failed to create profile due to an exception'),
          };
        }
      } else {
        logger.error('Error fetching user profile:', JSON.stringify(error));
        return {
          data: null,
          error: new Error(`Failed to fetch profile: ${error.message}`),
        };
      }
    }

    if (!profileData) {
      logger.warn('No profile found for user:', currentUserId);
      return {
        data: null,
        error: new Error('User profile not found'),
      };
    }

    // Format data according to User type with safe date handling
    try {
      const userData: User = {
        id: profileData.id,
        email: sessionData?.session?.user?.email || '',
        display_name: profileData.display_name || '',
        avatar_url: profileData.avatar_url || '',
        streak: profileData.streak || 0,
        xp: profileData.xp || 0,
        level: profileData.level || 1,
        lastQuizDate: profileData.last_quiz_date
          ? profileData.last_quiz_date
          : undefined,
        created_at: profileData.created_at || new Date().toISOString(),
        school_id: profileData.school_id,
        is_school_visible: profileData.is_school_visible,
      };

      return { data: userData, error: null };
    } catch (formattingError) {
      logger.error('Error formatting user data:', {
        profileData: JSON.stringify(profileData),
        error: formattingError,
      });
      return {
        data: null,
        error: new Error(`Failed to format user data: ${formattingError}`),
      };
    }
  } catch (error) {
    logger.error('Unexpected error in fetchUserProfile:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(JSON.stringify(error)),
    };
  }
}

/**
 * Updates user profile data.
 *
 * display_name/avatar_url go through JomBeelajar API (PATCH /api/v1/me) — JomBeelajar API is
 * now the source of truth for those fields. school_id/is_school_visible are
 * not yet covered by that endpoint (Schools domain isn't migrated), so they
 * still write directly to Supabase.
 */
export async function updateUserProfile(profileData: {
  display_name?: string;
  avatar_url?: string;
  school_id?: string;
  is_school_visible?: boolean;
}): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) {
      return {
        success: false,
        error: new Error('No authenticated user found'),
      };
    }

    if (
      profileData.display_name !== undefined ||
      profileData.avatar_url !== undefined
    ) {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profileData.display_name,
          avatarUrl: profileData.avatar_url,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          success: false,
          error: new Error(data.error || 'Failed to update profile'),
        };
      }
    }

    if (
      profileData.school_id !== undefined ||
      profileData.is_school_visible !== undefined
    ) {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          school_id: profileData.school_id,
          is_school_visible: profileData.is_school_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUserId);

      if (error) {
        logger.error('Error updating school fields:', error);
        return { success: false, error };
      }
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error('Unexpected error in updateUserProfile:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Fetches the user's achievements
 */
export async function fetchUserAchievements(): Promise<{
  data: Achievement[] | null;
  error: Error | null;
}> {
  try {
    // Get current user
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) {
      return {
        data: null,
        error: new Error('No authenticated user found'),
      };
    }

    // Query user achievements
    const { data: achievementsData, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', currentUserId)
      .order('earned_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user achievements:', error);
      return { data: null, error };
    }

    return { data: achievementsData, error: null };
  } catch (error) {
    logger.error('Unexpected error in fetchUserAchievements:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Fetch current user profile via API route (no authentication required)
 */
export async function fetchUserProfileAPI(): Promise<User> {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch profile data');
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching profile via API:', error);
    throw error;
  }
}

/**
 * Fetch user profile by ID via API route (no authentication required)
 */
export async function fetchUserProfileByIdAPI(userId: string): Promise<User> {
  try {
    const response = await fetch(`/api/profile/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch profile data');
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching profile by ID via API:', error);
    throw error;
  }
}

/**
 * Fetch user achievements via API route (no authentication required)
 */
export async function fetchUserAchievementsAPI(
  userId: string = 'me'
): Promise<Achievement[]> {
  try {
    const response = await fetch(`/api/profile/${userId}/achievements`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch achievements');
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching achievements via API:', error);
    throw error;
  }
}

/**
 * Interface for quiz with relations
 */
export interface QuizWithSubject {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  verified: boolean;
  topic_id: string;
  subject_slug?: string;
  topic_title?: string;
}

/**
 * Fetch user created quizzes via API route (no authentication required)
 */
export async function fetchUserCreatedQuizzesAPI(
  userId: string = 'me'
): Promise<QuizWithSubject[]> {
  try {
    const response = await fetch(`/api/profile/${userId}/quizzes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch created quizzes');
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching created quizzes via API:', error);
    throw error;
  }
}

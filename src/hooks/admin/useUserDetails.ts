import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { UserDetail, QuizAttempt, Achievement } from '@/components/admin/users/types';

// Utility function to check if a table exists in the database
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('information_schema.tables')
      .select('*', { count: 'exact', head: true })
      .eq('table_schema', 'public')
      .eq('table_name', tableName);

    return !error && count !== null && count > 0;
  } catch (err) {
    logger.error(`Error checking if table ${tableName} exists:`, err);
    return false;
  }
}

export function useUserDetails(userId: string) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchUserDetails() {
      try {
        setLoading(true);

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          logger.error('Error fetching user profile:', profileError);
          setError(
            new Error(`Failed to fetch user profile: ${profileError.message}`)
          );
          return;
        }

        if (!profile) {
          setError(new Error(`User profile not found for ID: ${userId}`));
          return;
        }

        // Fetch user role. maybeSingle — a user may legitimately have no
        // row here, which is expected, not an error.
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (roleError) {
          logger.warn('Error fetching user role:', roleError);
        }

        // Fetch achievements (moderator-gated JomBeelajar API endpoint)
        let achievements: Achievement[] = [];
        try {
          const achievementsRes = await fetch(
            `/api/admin/users/${userId}/achievements`
          );
          if (achievementsRes.ok) {
            achievements = await achievementsRes.json();
          } else {
            logger.warn('Error fetching achievements:', achievementsRes.status);
          }
        } catch (achievementsError) {
          logger.warn('Error fetching achievements:', achievementsError);
        } // Check if quiz_attempts table exists before querying
        const quizAttemptsExists = await checkTableExists('quiz_attempts');

        let quizHistory: QuizAttempt[] = [];
        let quizError = null;

        if (quizAttemptsExists) {
          // Fetch quiz history
          const quizResult = await supabase
            .from('quiz_attempts')
            .select(
              `
              id,
              quiz_id,
              user_id,
              score,
              max_score,
              correct_answers,
              total_questions,
              time_spent,
              completed,
              created_at,
              updated_at
            `
            )
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          quizHistory = quizResult.data || [];
          quizError = quizResult.error;

          if (quizError) {
            logger.warn('Error fetching quiz history:', quizError);
          }
        } else {
          logger.warn(
            'The quiz_attempts table does not exist. Please run the migration script.'
          );
        }

        // Ensure all required fields are present with defaults
        const safeProfile = {
          id: profile?.id || userId,
          email: profile?.email || '',
          display_name: profile?.display_name || '',
          avatar_url: profile?.avatar_url || null,
          level: profile?.level || 0,
          xp: profile?.xp || 0,
          streak: profile?.streak || 0,
          daily_xp: profile?.daily_xp || 0,
          weekly_xp: profile?.weekly_xp || 0,
          created_at: profile?.created_at || new Date().toISOString(),
          ...profile,
        };

        // Combine all data
        setUser({
          ...safeProfile,
          role: roleData?.role || 'user',
          last_login: 'Not available',
          achievements: achievements || [],
          quiz_history: quizHistory || [],
        });
      } catch (err) {
        logger.error('Error fetching user details:', err);
        setError(
          err instanceof Error ? err : new Error('Unknown error occurred')
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUserDetails();
  }, [userId]);

  return { user, loading, error, setUser };
}

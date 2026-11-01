'use client';

import { useEffect, useState } from 'react';
import { User, Achievement } from '@/types/users';
import { Quiz } from '@/types/topics';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileAchievements from '@/components/profile/ProfileAchievements';
import QuizTable from '@/components/topic/QuizTable';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface UserProfileClientProps {
  user: User;
}

export default function UserProfileClient({ user }: UserProfileClientProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [createdQuizzes, setCreatedQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'stats' | 'achievements' | 'created-quizzes'
  >('stats');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);

        // Load achievements
        const { data: achievementsData, error: achievementsError } =
          await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', user.id);

        if (achievementsError) {
          throw achievementsError;
        }
        setAchievements(achievementsData || []);

        // Load created quizzes
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('created_by', user.id);

        if (quizzesError) {
          throw quizzesError;
        }
        setCreatedQuizzes(quizzesData || []);
      } catch (err) {
        logger.error('Error loading user data:', err);
        setError(
          'Unable to connect to the API. Please contact the administrator.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user.id]);

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileHeader user={user} />

      <div className="mt-8">
        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'stats'
                ? 'bg-[var(--band-via)] text-white'
                : 'bg-muted text-soft'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'achievements'
                ? 'bg-[var(--band-via)] text-white'
                : 'bg-muted text-soft'
            }`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'created-quizzes'
                ? 'bg-[var(--band-via)] text-white'
                : 'bg-muted text-soft'
            }`}
            onClick={() => setActiveTab('created-quizzes')}
          >
            Created Quizzes
          </button>
        </div>

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="mt-4">
            {activeTab === 'stats' && <ProfileStats user={user} />}
            {activeTab === 'achievements' && (
              <ProfileAchievements achievements={achievements} />
            )}
            {activeTab === 'created-quizzes' && (
              <QuizTable quizzes={createdQuizzes} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

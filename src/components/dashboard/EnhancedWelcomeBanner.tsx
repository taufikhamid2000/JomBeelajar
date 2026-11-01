'use client';
import { logger } from '@/lib/logger';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiAward, FiShuffle, FiCompass } from 'react-icons/fi';
import { getUserData, DashboardUser } from '@/services/dashboardService';

interface WelcomeBannerProps {
  initialUser?: DashboardUser | null;
  isStatic?: boolean;
}

const EnhancedWelcomeBanner = ({
  initialUser,
  isStatic = false,
}: WelcomeBannerProps) => {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(!initialUser);

  // Fetch user data directly if not provided or if it's Guest User
  useEffect(() => {
    const fetchUserData = async () => {
      if (!initialUser || initialUser.display_name === 'Guest User') {
        logger.log('EnhancedWelcomeBanner: Fetching user data directly');
        try {
          const userData = await getUserData();
          if (userData) {
            logger.log('EnhancedWelcomeBanner: Got user data:', {
              isGuest: userData.display_name === 'Guest User',
              displayName: userData.display_name,
            });
            setUser(userData);
          }
        } catch (error) {
          logger.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [initialUser]);

  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-label="Loading your dashboard"
        className="animate-pulse space-y-3"
      >
        <div className="h-8 w-2/3 max-w-sm rounded-lg bg-muted" />
        <div className="h-4 w-1/2 max-w-xs rounded-lg bg-muted" />
      </section>
    );
  }

  if (!user) return null;

  const handleRandomQuiz = async () => {
    if (isStatic) {
      router.push('/static/quiz/mathematics/random');
      return;
    }

    try {
      const response = await fetch('/api/quizzes/random');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      router.push(
        `/quiz/${data.subject_slug}/${data.topic_id}/play/${data.quiz_id}`
      );
    } catch (error) {
      logger.error('Error fetching random quiz:', error);
      alert('Failed to find a random quiz. Please try again later.');
    }
  };

  const handleRandomTopic = async () => {
    if (isStatic) {
      router.push('/static/quiz/mathematics/topics/random');
      return;
    }

    try {
      const response = await fetch('/api/topics/random');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      router.push(`/quiz/${data.subject_slug}/${data.topic_id}`);
    } catch (error) {
      logger.error('Error fetching random topic:', error);
      alert('Failed to find a random topic. Please try again later.');
    }
  };

  const actionClass =
    'press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-strong hover:bg-muted';

  return (
    <section className="dashboard-section welcome">
      <h1 className="text-2xl font-extrabold tracking-tight text-strong sm:text-3xl">
        Welcome back, {user.display_name || user.email.split('@')[0]}
      </h1>
      {!user.display_name && (
        <Link
          href={isStatic ? '/static/profile' : '/profile'}
          className="mt-2 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand underline underline-offset-4"
        >
          Set a username
        </Link>
      )}
      <p className="mt-1 text-base text-soft">
        {user.streak > 0
          ? `You are on a ${user.streak}-day streak.`
          : 'Pick up where you left off, or try something new.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRandomQuiz}
          className={actionClass}
        >
          <FiShuffle className="h-4 w-4" aria-hidden="true" />
          Random quiz
        </button>
        <button
          type="button"
          onClick={handleRandomTopic}
          className={actionClass}
        >
          <FiCompass className="h-4 w-4" aria-hidden="true" />
          Random topic
        </button>
        <Link
          href={isStatic ? '/static/leaderboard' : '/leaderboard'}
          className={actionClass}
        >
          <FiAward className="h-4 w-4" aria-hidden="true" />
          Leaderboard
        </Link>
      </div>
    </section>
  );
};

export default EnhancedWelcomeBanner;

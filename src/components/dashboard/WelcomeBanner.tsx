import { logger } from '@/lib/logger';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  display_name?: string;
  streak: number;
  xp: number;
  level: number;
  lastQuizDate: string;
}

interface WelcomeBannerProps {
  user: User | null;
  isStatic?: boolean;
}

const WelcomeBanner = ({ user, isStatic = false }: WelcomeBannerProps) => {
  const router = useRouter();

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

  return (
    <section className="dashboard-section welcome band-gradient text-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Welcome back, {user.display_name || user.email.split('@')[0]}
          {!user.display_name && (
            <Link
              href={isStatic ? '/static/profile' : '/profile'}
              className="inline-block ml-4"
            >
              <button className="text-sm bg-surface bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded transition-colors">
                Set username
              </button>
            </Link>
          )}
        </h1>
        <p className="text-base sm:text-lg">
          Ready to continue your learning journey?
        </p>{' '}
        <p className="mt-4 text-sm sm:text-base">
          Your current streak: <strong>{user.streak} days</strong>
        </p>{' '}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
          <Link
            href={isStatic ? '/static/leaderboard' : '/leaderboard'}
            className="inline-flex items-center justify-center px-4 py-2 bg-surface bg-opacity-20 hover:bg-opacity-30 transition-all rounded-lg text-sm font-medium"
          >
            <span className="mr-2">🏆</span>
            View Leaderboard
          </Link>
          <button
            onClick={handleRandomQuiz}
            className="inline-flex items-center justify-center px-4 py-2 bg-surface bg-opacity-20 hover:bg-opacity-30 transition-all rounded-lg text-sm font-medium"
          >
            <span className="mr-2">🎯</span>
            Try Random Quiz
          </button>
          <button
            onClick={handleRandomTopic}
            className="inline-flex items-center justify-center px-4 py-2 bg-surface bg-opacity-20 hover:bg-opacity-30 transition-all rounded-lg text-sm font-medium"
          >
            <span className="mr-2">🎲</span>
            Explore Random Topic
          </button>
        </div>
      </div>
    </section>
  );
};

export default WelcomeBanner;

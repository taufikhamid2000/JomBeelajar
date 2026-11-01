'use client';
// Import dynamic config to optimize build
import './config';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Import custom hooks
import { useUserDetails } from '@/hooks/admin/useUserDetails';

// Import components
import UserHeader from '@/components/admin/users/UserHeader';
import UserProfile from '@/components/admin/users/UserProfile';
import TabNavigation, { TabType } from '@/components/admin/users/TabNavigation';
import OverviewTab from '@/components/admin/users/tabs/OverviewTab';
import AchievementsTab from '@/components/admin/users/tabs/AchievementsTab';
import QuizHistoryTab from '@/components/admin/users/tabs/QuizHistoryTab';
import ActivityLogTab from '@/components/admin/users/tabs/ActivityLogTab';
import AwardAchievementModal, {
  AwardFormData,
} from '@/components/admin/users/modals/AwardAchievementModal';

// Import types
import { Achievement } from '@/components/admin/users/types';

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params?.id || '';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  // Use the custom hook for data fetching
  const { user, loading, error, setUser } = useUserDetails(userId);

  // Redirect if no userId
  useEffect(() => {
    if (!userId) {
      router.push('/admin/users');
    }
  }, [userId, router]);

  // Log any data fetching errors
  useEffect(() => {
    if (error) {
      logger.error('Error in user details page:', error.message);
    }
  }, [error]);
  // Handle user status changes (enable/disable)
  async function handleUserStatusChange(isDisabled: boolean) {
    try {
      // Update the user's disabled status in the database
      const { toggleUserDisabled } = await import('@/services/adminService');
      const success = await toggleUserDisabled(userId, isDisabled);

      if (!success) {
        throw new Error(
          `Failed to ${isDisabled ? 'disable' : 'enable'} user account`
        );
      }

      logger.log(
        `Admin action: Set user ${userId} ${isDisabled ? 'disabled' : 'enabled'}`
      );

      // Update the local state
      if (user) {
        setUser({
          ...user,
          is_disabled: isDisabled,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error('Error updating user status:', errorMessage);
    }
  }

  // Handle achievement awards
  async function handleAwardAchievement(formData: AwardFormData) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to award achievement');
      }

      const newAchievement = await res.json();

      // Update local state
      if (user) {
        setUser({
          ...user,
          achievements: [...user.achievements, newAchievement as Achievement],
        });
      }

      setIsAwardModalOpen(false);
    } catch (error) {
      logger.error('Error awarding achievement:', error);
      alert('Failed to award achievement. Please try again.');
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex">
          <AdminNavigation />
          <div className="flex-1 p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand/40"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex">
          <AdminNavigation />
          <div className="flex-1 p-8">
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg mb-4">
              <h2 className="text-xl font-bold mb-2">Error</h2>
              <p className="mb-4">
                {error.message ||
                  'An error occurred while loading user details.'}
              </p>
              <Link
                href="/admin/users"
                className="px-4 py-2 bg-[var(--band-via)] text-white rounded hover:bg-[var(--band-from)] transition-colors"
              >
                Return to User List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex">
          <AdminNavigation />
          <div className="flex-1 p-8">
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg mb-4">
              <h2 className="text-xl font-bold mb-2">User Not Found</h2>
              <p className="mb-4">
                The user you are looking for does not exist or has been deleted.
              </p>
              <Link
                href="/admin/users"
                className="px-4 py-2 bg-[var(--band-via)] text-white rounded hover:bg-[var(--band-from)] transition-colors"
              >
                Return to User List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          {/* Header with back button and user actions */}
          <UserHeader user={user} onStatusChange={handleUserStatusChange} />

          {/* User profile card with avatar and basic details */}
          <UserProfile user={user} />

          {/* Main content with tabs */}
          <div className="bg-surface shadow rounded-lg">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="p-6">
              {activeTab === 'overview' && <OverviewTab user={user} />}

              {activeTab === 'achievements' && (
                <AchievementsTab
                  achievements={user.achievements}
                  onAwardClick={() => setIsAwardModalOpen(true)}
                />
              )}

              {activeTab === 'quizzes' && (
                <QuizHistoryTab quizHistory={user.quiz_history} />
              )}

              {activeTab === 'activity' && <ActivityLogTab />}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement award modal */}
      <AwardAchievementModal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        onAward={handleAwardAchievement}
      />
    </div>
  );
}

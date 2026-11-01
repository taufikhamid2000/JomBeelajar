'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/types/users';
import { fetchUserProfileByIdAPI } from '@/services/profileService';
import UserProfileClient from './UserProfileClient';
import { redirect } from 'next/navigation';

interface UserProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = use(params);

  // Fetch user profile using React Query and API route
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ['profile', userId],
    queryFn: () => fetchUserProfileByIdAPI(userId),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes cache
    retry: 2,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand/40 mx-auto"></div>
          <p className="mt-4 text-soft">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error or no user found
  if (error || !user) {
    redirect('/404');
  }

  return <UserProfileClient user={user} />;
}

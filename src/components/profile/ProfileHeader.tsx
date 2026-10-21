import React, { useState } from 'react';
import Image from 'next/image';
import { User } from '@/types/users';

interface ProfileHeaderProps {
  user: User;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  // Fallback "member since" date when the profile has no created_at; read
  // once on mount rather than on every render.
  const [now] = useState(() => Date.now());

  // Helper function to validate image URLs
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;

    // Check if it's a data URL
    if (url.startsWith('data:image/')) return true;

    // Simple check for http/https URLs
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Default avatar if user doesn't have one
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.display_name || 'User'
  )}&background=random`;
  const avatarUrl: string = isValidImageUrl(user.avatar_url)
    ? user.avatar_url!
    : defaultAvatarUrl;
  // Format the date in a consistent way for both server and client
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-gray-800 dark:bg-white shadow rounded-lg overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
      <div className="relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center -mt-12">
          {' '}
          <div className="relative">
            <Image
              src={avatarUrl}
              alt={user.display_name || 'Profile'}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-700 bg-white dark:bg-gray-600 object-cover"
              unoptimized={
                !user.avatar_url || user.avatar_url.includes('ui-avatars.com')
              }
            />
            <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-700"></div>
          </div>
          <div className="mt-6 sm:mt-0 sm:ml-6">
            <h1 className="text-2xl font-bold text-white dark:text-gray-900">
              {user.display_name || 'Anonymous User'}
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Member since {formatDate(new Date(user.created_at || now))}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-auto flex space-x-3">
            <div className="rounded-md bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              Level {user.level}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

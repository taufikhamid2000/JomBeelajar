'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/users';
import { updateUserProfile } from '@/services/profileService';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Image from 'next/image';

interface School {
  id: string;
  name: string;
  type: string;
  district: string;
  state: string;
}

interface ProfileSettingsProps {
  user: User;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState<string>(
    user.display_name || ''
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatar_url || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    user.school_id || ''
  );
  const [isLoadingSchools, setIsLoadingSchools] = useState<boolean>(true);
  const [schoolSearch, setSchoolSearch] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isSchoolVisible, setIsSchoolVisible] = useState<boolean>(
    user.is_school_visible || false
  );

  // Get unique states and types for filters
  const states = [
    'all',
    ...new Set(schools.map((school) => school.state)),
  ].sort();
  const types = [
    'all',
    ...new Set(schools.map((school) => school.type)),
  ].sort();

  // Filter schools based on search and filters
  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      school.district.toLowerCase().includes(schoolSearch.toLowerCase());
    const matchesState =
      selectedState === 'all' || school.state === selectedState;
    const matchesType = selectedType === 'all' || school.type === selectedType;
    return matchesSearch && matchesState && matchesType;
  });

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await fetch('/api/schools');
        if (!res.ok) {
          logger.error('Error fetching schools:', res.status);
          return;
        }
        const data = await res.json();
        setSchools(
          [...data].sort((a: School, b: School) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        logger.error('Error in fetchSchools:', err);
      } finally {
        setIsLoadingSchools(false);
      }
    };

    fetchSchools();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      let updatedAvatarUrl = avatarUrl;

      // Handle avatar upload if a file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          setErrorMessage(`Error uploading avatar: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('user-avatars')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          updatedAvatarUrl = urlData.publicUrl;
        } else {
          setErrorMessage('Error getting avatar URL');
          setIsSubmitting(false);
          return;
        }
      }

      // Update profile      // Only include school_id in the update if a school is selected
      const { success, error } = await updateUserProfile({
        display_name: displayName,
        avatar_url: updatedAvatarUrl,
        ...(selectedSchoolId ? { school_id: selectedSchoolId } : {}),
        is_school_visible: isSchoolVisible,
      });

      if (error) {
        setErrorMessage(`Failed to update profile: ${error.message}`);
      } else if (success) {
        setSuccessMessage('Profile updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      logger.error('Error updating profile:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrorMessage('File size exceeds 5MB limit');
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setErrorMessage('Only JPEG, PNG and GIF files are allowed');
        return;
      }

      setAvatarFile(file);
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrorMessage('');
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      // Shared with Header's sign-out — same implementation, same
      // destination (/auth), so all sign-out entry points behave identically.
      await signOut();
    } catch (err) {
      logger.error('Error signing out:', err);
      setErrorMessage('Failed to sign out. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {' '}
          {/* Display Name Field */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-soft mb-1"
            >
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-brand/40 focus:border-brand/40"
              placeholder="Your display name"
              required
            />
          </div>{' '}
          {/* School Selection */}
          <div className="space-y-4">
            <label
              htmlFor="school"
              className="block text-sm font-medium text-soft"
            >
              School
            </label>

            {/* Search and Filters */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="w-full px-3 py-2 pl-9 border border-border rounded-md shadow-sm focus:outline-none focus:ring-brand/40 focus:border-brand/40"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-soft"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-brand/40 focus:border-brand/40"
              >
                <option value="all">All States</option>
                {states
                  .filter((state) => state !== 'all')
                  .map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-brand/40 focus:border-brand/40"
              >
                <option value="all">All Types</option>
                {types
                  .filter((type) => type !== 'all')
                  .map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
              </select>
            </div>

            {/* School Selection Dropdown */}
            <div>
              <select
                id="school"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-brand/40 focus:border-brand/40"
                disabled={isLoadingSchools}
              >
                <option value="">Select your school</option>
                {filteredSchools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.type}) - {school.district},{' '}
                    {school.state}
                  </option>
                ))}
              </select>{' '}
              {isLoadingSchools ? (
                <p className="mt-1 text-sm text-soft">Loading schools...</p>
              ) : (
                <p className="mt-1 text-sm text-soft">
                  {filteredSchools.length} schools found
                </p>
              )}
              {/* School Visibility Toggle */}
              <div className="mt-4 flex items-center">
                <input
                  type="checkbox"
                  id="schoolVisibility"
                  checked={isSchoolVisible}
                  onChange={(e) => setIsSchoolVisible(e.target.checked)}
                  className="h-4 w-4 text-brand focus:ring-brand/40 border-border rounded"
                />
                <label
                  htmlFor="schoolVisibility"
                  className="ml-2 block text-sm text-soft"
                >
                  Show my school on my public profile{' '}
                  <span className="text-xs text-soft">
                    (other students will be able to see which school you attend)
                  </span>
                </label>
              </div>
            </div>
          </div>
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-soft mb-1">
              Profile Picture
            </label>
            <div className="flex items-center space-x-6 mb-4">
              {avatarUrl ? (
                <div className="w-16 h-16 rounded-full overflow-hidden relative">
                  <Image
                    src={avatarUrl}
                    alt="Profile preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-soft">No image</span>
                </div>
              )}
              <div>
                <label
                  htmlFor="avatarUpload"
                  className="cursor-pointer bg-[var(--band-via)] text-white px-4 py-2 rounded hover:bg-[var(--band-from)]"
                >
                  Choose Image
                </label>
                <input
                  type="file"
                  id="avatarUpload"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                />
              </div>
            </div>
            <p className="text-xs text-soft">
              Recommended: Square image, max 5MB (JPG, PNG, GIF)
            </p>
          </div>
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-[var(--band-via)] text-white rounded-md hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Divider */}
      <div className="my-8 border-t border-border"></div>

      {/* Account Actions */}
      <div>
        <h3 className="text-lg font-medium mb-4">Account Actions</h3>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-muted text-strong rounded-md hover:bg-muted"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

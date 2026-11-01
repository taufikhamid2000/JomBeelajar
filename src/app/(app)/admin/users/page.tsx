'use client';
// Import dynamic config to optimize build
import './config';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import {
  AdminLayout,
  SearchBar,
  FilterSortControls,
  DataTableCardView,
  Pagination,
  Message,
  type Column,
  type CardField,
  type SortDirection,
} from '@/components/admin/ui';

// Define the structure of the user data after processing
interface User {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  created_at: string;
  role: string;
  is_disabled?: boolean;
}

// Filtering options
type FilterOption = 'all' | 'admin' | 'moderator' | 'user' | 'disabled';
type SortOption = 'name' | 'email' | 'level' | 'joined' | 'role';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Filtering and sorting state
  const [roleFilter, setRoleFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);

      logger.log('Attempting to fetch users via client-side service...');

      // Use the adminService directly instead of API route
      const { fetchAdminUsers } = await import('@/services/adminService');
      const { data, error } = await fetchAdminUsers();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from admin service');
      }

      setUsers(data);

      // Log for debugging
      if (data.length > 0) {
        logger.log('First user data:', data[0]);
      } else {
        logger.log('No user data returned');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error('Error fetching users:', error);
      setError(errorMessage);

      // More detailed error logging
      logger.error('User fetch error details:', {
        error,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    try {
      setError(null);
      setSuccessMessage(null);

      // Find the user we're updating for UI feedback
      const targetUser = users.find((user) => user.id === userId);
      const userName = targetUser?.display_name || 'User';

      // Set loading state
      setLoading(true);

      // Use the client-side service instead of API endpoint
      logger.log('Updating user role via client-side service...');
      const { updateUserRole } = await import('@/services/adminService');
      const success = await updateUserRole(
        userId,
        role as 'admin' | 'moderator' | 'user'
      );

      if (!success) {
        throw new Error('Failed to update user role');
      }

      // Update the local state
      setUsers(
        users.map((user) => (user.id === userId ? { ...user, role } : user))
      );

      // Show success message
      const message = `Role updated successfully: ${userName} is now ${role}`;
      logger.log(message);
      setSuccessMessage(message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Role update failed: ${errorMessage}`);
      logger.error('Error updating user role:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleDisabled(userId: string) {
    try {
      setError(null);
      setSuccessMessage(null);

      // Find the user we're updating for UI feedback
      const targetUser = users.find((user) => user.id === userId);
      if (!targetUser) {
        throw new Error('User not found');
      }

      const userName = targetUser.display_name || 'User';
      const newDisabledState = !targetUser.is_disabled;

      // Set loading state
      setLoading(true);

      // Use the client-side service to toggle disable status
      logger.log(
        `${newDisabledState ? 'Disabling' : 'Enabling'} user account...`
      );
      const { toggleUserDisabled } = await import('@/services/adminService');
      const success = await toggleUserDisabled(userId, newDisabledState);

      if (!success) {
        throw new Error(
          `Failed to ${newDisabledState ? 'disable' : 'enable'} user account`
        );
      }

      // Update the local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, is_disabled: newDisabledState } : user
        )
      );

      // Show success message
      const action = newDisabledState ? 'disabled' : 'enabled';
      const message = `Account ${action}: ${userName}`;
      logger.log(message);
      setSuccessMessage(message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Account status update failed: ${errorMessage}`);
      logger.error('Error updating user account status:', error);
    } finally {
      setLoading(false);
    }
  }
  const filteredUsers = users.filter((user) => {
    // Apply search filter
    const matchesSearch =
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.display_name &&
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply role filter
    let matchesRole = false;
    if (roleFilter === 'all') {
      matchesRole = true;
    } else if (roleFilter === 'disabled') {
      matchesRole = !!user.is_disabled;
    } else {
      matchesRole = user.role === roleFilter;
    }

    return matchesSearch && matchesRole;
  });

  // Sort the filtered users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let compareA: string | number = '';
    let compareB: string | number = '';

    switch (sortBy) {
      case 'name':
        compareA = a.display_name || a.email || '';
        compareB = b.display_name || b.email || '';
        break;
      case 'email':
        compareA = a.email || '';
        compareB = b.email || '';
        break;
      case 'level':
        compareA = a.level;
        compareB = b.level;
        break;
      case 'joined':
        compareA = new Date(a.created_at).getTime();
        compareB = new Date(b.created_at).getTime();
        break;
      case 'role':
        compareA = a.role;
        compareB = b.role;
        break;
    }

    // Compare based on direction
    if (typeof compareA === 'string' && typeof compareB === 'string') {
      return sortDirection === 'asc'
        ? compareA.localeCompare(compareB)
        : compareB.localeCompare(compareA);
    } else {
      return sortDirection === 'asc'
        ? Number(compareA) - Number(compareB)
        : Number(compareB) - Number(compareA);
    }
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      toggleSortDirection();
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };
  // Define filter options for the FilterSortControls component
  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'admin', label: 'Admin' },
    { id: 'moderator', label: 'Moderator' },
    { id: 'user', label: 'User' },
    { id: 'disabled', label: 'Disabled' },
  ];

  // Define sort options for the FilterSortControls component
  const sortOptions = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'level', label: 'Level' },
    { id: 'joined', label: 'Join Date' },
    { id: 'role', label: 'Role' },
  ];

  // Define columns for the DataTableCardView component
  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div className="flex items-center">
          <div
            className={`flex-shrink-0 h-10 w-10 relative ${user.is_disabled ? 'opacity-60' : ''}`}
          >
            {user.avatar_url ? (
              <Image
                className={`h-10 w-10 rounded-full object-cover ${user.is_disabled ? 'grayscale' : ''}`}
                src={user.avatar_url}
                alt={user.display_name || 'User avatar'}
                width={40}
                height={40}
                unoptimized={user.avatar_url.startsWith('data:')}
              />
            ) : (
              <div
                className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center text-soft ${user.is_disabled ? 'opacity-60' : ''}`}
              >
                {(user.display_name || user.email || '?')
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            {user.is_disabled && (
              <div
                className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white"
                title="Account disabled"
              ></div>
            )}
          </div>
          <div className="ml-4">
            <div
              className={`text-sm font-medium ${
                user.is_disabled ? 'text-soft line-through' : 'text-strong'
              }`}
            >
              {user.display_name || 'Unnamed User'}
              {user.is_disabled && (
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-md font-semibold no-underline">
                  DISABLED
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => <div className="text-sm text-soft">{user.email}</div>,
    },
    {
      key: 'level',
      header: 'Level/XP',
      render: (user) => (
        <>
          <div className="text-sm font-medium text-strong">
            Level {user.level}
          </div>
          <div className="text-sm text-soft">{user.xp} XP</div>
        </>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user) => (
        <div className="text-sm text-soft">
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value)}
          className="text-sm border rounded py-1 px-2"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
      ),
    },
  ];

  // Define card fields for mobile view
  const cardFields: CardField<User>[] = [
    {
      key: 'user-header',
      label: 'User',
      isHeader: true,
      render: (user) => (
        <div className="flex items-center mb-3">
          <div
            className={`flex-shrink-0 h-12 w-12 mr-3 relative ${user.is_disabled ? 'opacity-60' : ''}`}
          >
            {user.avatar_url ? (
              <Image
                className={`h-12 w-12 rounded-full object-cover ${user.is_disabled ? 'grayscale' : ''}`}
                src={user.avatar_url}
                alt={user.display_name || 'User avatar'}
                width={48}
                height={48}
                unoptimized={user.avatar_url.startsWith('data:')}
              />
            ) : (
              <div
                className={`h-12 w-12 rounded-full bg-muted flex items-center justify-center text-soft ${user.is_disabled ? 'opacity-60' : ''}`}
              >
                {(user.display_name || user.email || '?')
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            {user.is_disabled && (
              <div
                className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white"
                title="Account disabled"
              ></div>
            )}
          </div>
          <div>
            <div
              className={`text-base font-medium ${
                user.is_disabled ? 'text-soft' : 'text-strong'
              }`}
            >
              {user.display_name || 'Unnamed User'}
              {user.is_disabled && (
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-md font-semibold">
                  DISABLED
                </span>
              )}
            </div>
            <div
              className={`text-sm text-soft break-all ${user.is_disabled ? 'line-through' : ''}`}
            >
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      label: 'Level/XP',
      render: (user) => (
        <div className="text-sm text-strong">
          Level {user.level} ({user.xp} XP)
        </div>
      ),
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (user) => (
        <div className="text-sm text-strong">
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      isFooter: true,
      render: (user) => (
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value)}
          className="w-full text-sm border rounded py-2 px-2 focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
      ),
    },
  ];
  const renderActions = (user: User) => (
    <>
      <Link
        href={`/admin/users/${user.id}`}
        className="text-brand hover:text-brand"
      >
        View
      </Link>
      <span className="mx-2">|</span>
      <button
        onClick={() => handleToggleDisabled(user.id)}
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
      >
        {user.is_disabled ? 'Enable' : 'Disable'}
      </button>
    </>
  );
  const renderMobileActions = (user: User) => (
    <div className="flex justify-between text-sm font-medium gap-2 mt-3">
      <Link
        href={`/admin/users/${user.id}`}
        className="flex-1 text-center text-brand hover:text-brand py-2 px-3 border border-brand/40 rounded focus:outline-none focus:ring-2 focus:ring-brand/40"
      >
        View Details
      </Link>
      <button
        onClick={() => handleToggleDisabled(user.id)}
        className="flex-1 text-center text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 py-2 px-3 border border-red-500 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        {user.is_disabled ? 'Enable Account' : 'Disable Account'}
      </button>
    </div>
  );

  return (
    <AdminLayout
      title="User Management"
      refreshAction={fetchUsers}
      isLoading={loading}
    >
      {/* Desktop Search */}
      <div className="hidden md:block mb-4">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search users..."
        />
      </div>

      {/* Mobile search and filter */}
      <div className="md:hidden flex flex-col gap-3 mb-4">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search users..."
        />

        <button
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-soft focus:outline-none focus:ring-2 focus:ring-brand/40 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter & Sort
        </button>

        {isFilterMenuOpen && (
          <div className="mt-2 p-4 bg-surface border border-border rounded-lg shadow-lg">
            <h3 className="text-sm font-medium text-soft mb-2">
              Filter by Role
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRoleFilter(option.id as FilterOption)}
                  className={`px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                    roleFilter === option.id
                      ? 'bg-[var(--band-via)] text-white'
                      : 'bg-muted text-soft'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <h3 className="text-sm font-medium text-soft mb-2">Sort By</h3>
            <div className="flex flex-col gap-2">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={toggleSortDirection}
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-soft focus:outline-none focus:ring-2 focus:ring-brand/40 flex items-center justify-center"
                >
                  Sort: {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  {sortDirection === 'asc' ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                      />
                    </svg>
                  )}
                </button>

                <select
                  value={usersPerPage}
                  onChange={(e) => setUsersPerPage(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Filter/Sort controls */}
      <div className="hidden md:block">
        <FilterSortControls
          selectedFilter={roleFilter}
          onFilterChange={(filter) => setRoleFilter(filter as FilterOption)}
          filterOptions={filterOptions}
          selectedSort={sortBy}
          onSortChange={(sort) => handleSortChange(sort as SortOption)}
          sortOptions={sortOptions}
          sortDirection={sortDirection}
          onSortDirectionChange={toggleSortDirection}
          perPageOptions={[5, 10, 25, 50]}
          itemsPerPage={usersPerPage}
          onItemsPerPageChange={setUsersPerPage}
        />
      </div>

      {/* Error and Success Messages */}
      <Message
        type="error"
        message={error}
        onDismiss={() => setError(null)}
        onRetry={fetchUsers}
      />

      <Message
        type="success"
        message={successMessage}
        onDismiss={() => setSuccessMessage(null)}
      />

      {/* Users Table/Card View */}
      <DataTableCardView<User>
        data={currentUsers}
        isLoading={loading}
        columns={columns}
        cardFields={cardFields}
        keyExtractor={(user) => user.id}
        emptyMessage="No users found in the system."
        emptyFilteredMessage="No users found matching your filters."
        isFiltered={searchTerm !== '' || roleFilter !== 'all'}
        actions={renderActions}
      />

      {/* Mobile card action buttons - rendered after each card */}
      {!loading &&
        currentUsers.map((user) => (
          <div key={`mobile-actions-${user.id}`} className="md:hidden mb-2">
            {renderMobileActions(user)}
          </div>
        ))}

      {/* Pagination Controls */}
      {sortedUsers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={usersPerPage}
          totalItems={sortedUsers.length}
          onPageChange={paginate}
        />
      )}
    </AdminLayout>
  );
}

import Link from 'next/link';
import { UserDetail } from './types';

interface UserHeaderProps {
  user: UserDetail;
  onStatusChange: (isDisabled: boolean) => void;
}

export default function UserHeader({ user, onStatusChange }: UserHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <Link
          href="/admin/users"
          className="text-brand hover:text-brand mb-2 inline-flex items-center"
        >
          ← Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-strong">
          {user.display_name}
          {user.is_disabled && (
            <span className="ml-3 text-sm px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-md font-semibold">
              DISABLED
            </span>
          )}
        </h1>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onStatusChange(!user.is_disabled)}
          className={`px-4 py-2 ${
            user.is_disabled
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-red-500 hover:bg-red-600'
          } text-white rounded`}
        >
          {user.is_disabled ? 'Enable Account' : 'Disable Account'}
        </button>
      </div>
    </div>
  );
}

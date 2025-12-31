'use client';

import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

interface AdminHeaderProps {
  user: User;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search (Future) */}
        <div className="flex flex-1" />

        {/* User Menu */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* User Info */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          <div className="flex items-center gap-x-4">
            <span className="text-sm font-semibold text-gray-900">
              {user.email}
            </span>

            <button
              onClick={handleLogout}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

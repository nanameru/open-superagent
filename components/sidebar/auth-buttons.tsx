'use client';

import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthButtonsProps {
  isCollapsed?: boolean;
}

export default function AuthButtons({ isCollapsed }: AuthButtonsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', currentUser.id)
            .single();
          
          if (userData) {
            setUsername(userData.username);
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('ログアウトエラー:', error.message);
        return;
      }
      router.push('/');
    } catch (error) {
      console.error('予期せぬエラー:', error);
    }
  };

  if (!user) {
    if (isCollapsed) return null;
    return (
      <div className="space-y-2 p-2">
        <Link
          href="/sign-in"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white dark:text-black bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          ログイン
        </Link>
        <Link
          href="/sign-up"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-black dark:text-white bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-all duration-200"
        >
          新規登録
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col",
      isCollapsed ? "px-2 py-2" : "gap-2 p-2"
    )}>
      <div className={cn(
        isCollapsed ? "flex flex-col items-center space-y-2" : "p-3"
      )}>
        <div className={cn(
          "flex items-center",
          !isCollapsed && "gap-3 mb-3"
        )}>
          <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-medium">
            {username ? username[0].toUpperCase() : user.email?.[0].toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black dark:text-white truncate">
                {username || user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          )}
        </div>
        <div className={cn(
          "flex",
          isCollapsed ? "flex-col items-center space-y-2" : "flex-col space-y-1"
        )}>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md transition-all duration-200 group",
              isCollapsed ? "p-2" : "px-3 py-2"
            )}
          >
            <Settings className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white" />
            {!isCollapsed && <span className="font-medium">設定</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md transition-all duration-200 group",
              isCollapsed ? "p-2" : "px-3 py-2 w-full"
            )}
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white" />
            {!isCollapsed && <span className="font-medium">ログアウト</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

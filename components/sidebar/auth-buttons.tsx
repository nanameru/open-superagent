'use client';

import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';

export default function AuthButtons() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 現在のユーザー情報を取得
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

    // 認証状態の変更を監視
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

  return (
    <div className="flex flex-col gap-2 p-2">
      {user ? (
        <>
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-medium">
                {username ? username[0].toUpperCase() : user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black dark:text-white truncate">
                  {username || user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md transition-all duration-200 group"
              >
                <Settings className="w-4 h-4 text-gray-400 group-hover:text-black dark:group-hover:text-white" />
                <span className="font-medium">設定</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md transition-all duration-200 group"
              >
                <svg
                  className="w-4 h-4 text-gray-400 group-hover:text-black dark:group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="font-medium">ログアウト</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            会員登録
          </Link>
        </div>
      )}
    </div>
  );
}

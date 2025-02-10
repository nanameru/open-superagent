'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Monitor, Sun, Moon, ChevronRight, Edit2, ExternalLink } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch user data...');
        
        // 1. Get auth user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          setUser(null);
          setLoading(false);
          return;
        }

        if (!authData.user) {
          console.log('No authenticated user found');
          setUser(null);
          setLoading(false);
          return;
        }

        console.log('Auth user found:', authData.user);
        setUser(authData.user);

        // 2. Get user data from users table
        const { data: dbUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          // If user doesn't exist in users table, create it
          if (userError.code === 'PGRST116') {
            console.log('Creating new user record...');
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .upsert({
                id: authData.user.id,
                email: authData.user.email,
                username: '',  // 空の文字列で初期化
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating user:', createError);
            } else {
              console.log('New user record created:', newUser);
              setUserData(newUser);
              setNewUsername(newUser.username);
            }
          }
        } else {
          console.log('User record found:', dbUser);
          setUserData(dbUser);
          setNewUsername(dbUser.username);
        }
      } catch (error) {
        console.error('Unexpected error in getUser:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Fetch user data when auth state changes
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUserData(data);
              setNewUsername(data.username);
            }
          });
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateUsername = async () => {
    if (!user || !newUsername.trim()) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: newUsername.trim(),
          email: user.email,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating username:', error);
        alert('ユーザー名の更新に失敗しました');
        return;
      }

      // Get updated user data
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated user:', fetchError);
      } else {
        setUserData(updatedUser);
      }
      
      setIsEditingName(false);
      alert('ユーザー名を更新しました');
      
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('予期せぬエラーが発生しました。もう一度お試しください。');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111827] flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111827]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">設定</h1>
            <div className="flex items-center space-x-6">
              <button className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">
                アカウント
              </button>
              <button className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">
                プロフィール
              </button>
            </div>
          </div>
        </div>

        {/* General セクション */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">一般</h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
            {/* Appearance */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">外観</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    デバイスでの表示方法を設定
                  </p>
                </div>
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    システム ({theme === 'light' ? 'ライト' : 'ダーク'})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account セクション */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">アカウント</h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
            {/* Avatar */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">アバター</h3>
                {user ? (
                  <div className="relative group">
                    <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white text-xl font-semibold relative overflow-hidden">
                      {user.email?.[0].toUpperCase()}
                      <button className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <Edit2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500">?</span>
                  </div>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">ユーザー名</h3>
                {user ? (
                  <div className="flex items-center space-x-2">
                    {isEditingName ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="px-2 py-1 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="新しいユーザー名"
                        />
                        <button
                          onClick={handleUpdateUsername}
                          className="px-3 py-1 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setNewUsername(userData?.username || '');
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-gray-900 dark:text-white">
                          {userData?.username || '-'}
                        </span>
                        <button
                          onClick={() => {
                            setIsEditingName(true);
                            setNewUsername(userData?.username || '');
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">ログインが必要です</span>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">メールアドレス</h3>
                {user ? (
                  <span className="text-gray-900 dark:text-white">{user.email}</span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">ログインが必要です</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
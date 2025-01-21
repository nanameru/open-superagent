'use client';

import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function AuthButtons() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');
  const router = useRouter();
  const supabase = createClient();

  const clearUserData = () => {
    setUser(null);
    setUsername('');
    setSession(null);
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Current session:', currentSession);
        setSession(currentSession);
        
        if (!currentSession) {
          clearUserData();
          setDebugInfo('Session state: LOGGED_OUT');
          return;
        }

        setDebugInfo(`Session state: LOGGED_IN`);
        setUser(currentSession.user);

        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', currentSession.user.id)
          .single();
        
        console.log('User data from database:', userData);
        if (userData) {
          setUsername(userData.username);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        clearUserData();
        setDebugInfo('Error getting session');
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_OUT' || !session) {
        clearUserData();
        setDebugInfo(`Auth Event: ${event}, Session: NONE`);
        router.push('/sign-in');
        return;
      }

      setSession(session);
      setUser(session.user);
      setDebugInfo(`Auth Event: ${event}, Session: ACTIVE`);
      
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUsername(userData.username);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    try {
      setDebugInfo('Signing out...');
      
      // すべてのセッションを削除
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      // クッキーをクリア
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      clearUserData();
      setDebugInfo('Sign out completed');
      
      // 少し待ってからリダイレクト
      setTimeout(() => {
        router.push('/sign-in');
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
      setDebugInfo(`Sign out error: ${error}`);
    }
  };

  // Debug information display
  const renderDebugInfo = () => (
    <div className="p-2 mt-2 text-xs bg-gray-100 rounded">
      <p>Debug Info: {debugInfo}</p>
      <p>Session ID: {session?.access_token ? session.access_token.slice(0, 10) + '...' : 'None'}</p>
      <p>User Email: {session?.user?.email || 'None'}</p>
    </div>
  );

  if (session && user) {
    return (
      <div className="flex flex-col gap-3 p-4 border-t border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{username}</span>
            <span className="text-xs text-gray-500">{user.email}</span>
          </div>
        </div>
        {renderDebugInfo()}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center px-5 py-3 text-sm font-medium bg-black/5 text-gray-700 rounded-xl hover:bg-black/10 transition-all duration-200"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 border-t border-black/5">
      {renderDebugInfo()}
      <Link
        href="/sign-in"
        className="w-full flex items-center justify-center px-5 py-3 text-sm font-medium bg-black/5 text-gray-700 rounded-xl hover:bg-black/10 transition-all duration-200"
      >
        Sign in
      </Link>
    </div>
  );
}

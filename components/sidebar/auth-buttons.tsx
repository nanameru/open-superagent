'use client';

import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export default function AuthButtons() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setUsername(userData.username);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUsername(userData.username);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (user) {
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
        <form action="/auth/signout" method="post">
          <button className="w-full flex items-center justify-center px-5 py-3 text-sm font-medium bg-black/5 text-gray-700 rounded-xl hover:bg-black/10 transition-all duration-200">
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 border-t border-black/5">
      <Link href="/sign-up" className="w-full">
        <button className="w-full flex items-center justify-center px-5 py-3 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-900 transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg">
          Sign up
        </button>
      </Link>
      <Link href="/sign-in" className="w-full">
        <button className="w-full flex items-center justify-center px-5 py-3 text-sm font-medium bg-white text-black rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-black transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md">
          Log in
        </button>
      </Link>
    </div>
  );
}

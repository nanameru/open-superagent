'use client';

import { ArrowUpIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface FooterInputProps {
  currentQueryId?: string;
}

export default function FooterInput({ currentQueryId }: FooterInputProps) {
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // ログイン状態を確認
  useEffect(() => {
    const supabase = createClient();
    
    // 初期ログイン状態の確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // ログイン状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // テキストエリアの高さを自動調整する関数
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 300); // 最大300px
      textarea.style.height = `${newHeight}px`;
    }
  };

  // 値が変更されたときに高さを調整
  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;
    
    if (!isLoggedIn) {
      router.push('/sign-in');
      return;
    }

    const supabase = createClient();
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) {
      console.error('User not found');
      return;
    }

    try {
      // 新しいクエリを作成
      const { data: newQuery, error: queryError } = await supabase
        .from('queries')
        .insert([
          {
            query_text: value.trim(),
            user_id: userId,
            conversation_query_id: currentQueryId ? [currentQueryId] : [] // 配列型として設定
          }
        ])
        .select()
        .single();

      if (queryError) {
        throw queryError;
      }

      // 検索ページに遷移
      const encodedQuery = encodeURIComponent(value.trim());
      router.push(`/search/new?q=${encodedQuery}`);
      setValue('');
    } catch (error) {
      console.error('Error creating query:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enterの場合は改行を許可
    if (e.key === 'Enter' && !e.shiftKey) {
      // 日本語入力中でない場合のみ送信
      if (!isComposing && value.trim()) {
        if (!isLoggedIn) {
          e.preventDefault();
          router.push('/sign-in');
          return;
        }
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  // Command + Kでフォーカス
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative" style={{ zIndex: 40 }}>
      <div className="relative group">
        <div 
          className="relative bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md transition-all duration-200 ease-in-out"
        >
          <div className="flex items-end">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={isLoggedIn ? "追加でPitattoに質問をする" : "ログインしてメッセージを送信"}
              rows={1}
              className="w-full py-3.5 pl-4 pr-14 text-base text-gray-900 dark:text-gray-100 bg-transparent rounded-xl resize-none outline-none min-h-[52px] max-h-[300px] overflow-y-auto placeholder:text-gray-400 dark:placeholder:text-gray-500"
              style={{
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            />
            <div className="absolute right-3 bottom-2.5">
              <button 
                type="submit"
                disabled={!value.trim() || !isLoggedIn}
                className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:hover:bg-black dark:disabled:hover:bg-white relative group"
              >
                <ArrowUpIcon className="w-4 h-4" />
                {!isLoggedIn && value.trim() && (
                  <div className="absolute bottom-full right-0 mb-2 w-max opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      ログインが必要です
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:opacity-100 opacity-0 transition duration-500" style={{ zIndex: -1 }} />
      </div>
    </form>
  );
}

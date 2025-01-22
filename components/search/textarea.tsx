'use client';

import { PaperclipIcon, ArrowUpIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { generateSubQueries } from '@/utils/deepseek';
import SubQueries from './sub-queries';

interface SearchTextareaProps {
  value: string;
  onChange: (value: string) => void;
}

interface QueryItem {
  query: string;
}

export default function SearchTextarea({ value, onChange }: SearchTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [subQueries, setSubQueries] = useState<QueryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // 検索クエリが3文字以上の場合にサブクエリを生成
    if (newValue.length >= 3) {
      setIsLoading(true);
      try {
        console.log('[SearchTextarea] Generating sub-queries for:', newValue);
        const queries = await generateSubQueries(newValue);
        console.log('[SearchTextarea] Generated queries:', queries);
        setSubQueries(queries.map((query) => ({ query })));
      } catch (error) {
        console.error('[SearchTextarea] Error generating queries:', error);
        setSubQueries([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSubQueries([]);
    }
  };

  const handleSubmit = async () => {
    if (value.length >= 3) {
      setIsLoading(true);
      try {
        console.log('[SearchTextarea] Generating sub-queries for:', value);
        const queries = await generateSubQueries(value);
        console.log('[SearchTextarea] Generated queries:', queries);
        setSubQueries(queries.map((query) => ({ query })));
      } catch (error) {
        console.error('[SearchTextarea] Error generating queries:', error);
        setSubQueries([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubQuerySelect = (query: string) => {
    onChange(query);
  };

  return (
    <div>
      <div className="relative flex items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder="AIアシスタントにメッセージを送信"
          rows={1}
          className="w-full py-3.5 px-14 text-base text-gray-900 dark:text-gray-100 bg-transparent rounded-xl resize-none outline-none min-h-[52px] max-h-[300px] overflow-y-auto placeholder:text-gray-400 dark:placeholder:text-gray-500"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        />
        <div className="absolute left-3 bottom-2.5">
          <button className="p-1.5 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
            <PaperclipIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute right-3 bottom-2.5">
          <button 
            onClick={handleSubmit}
            disabled={value.length < 3 || isLoading}
            className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:hover:bg-black dark:disabled:hover:bg-white relative"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUpIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      {isLoading && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          DeepSeek APIを実行中...
        </div>
      )}
      <SubQueries queries={subQueries} onSelect={handleSubQuerySelect} />
    </div>
  );
}

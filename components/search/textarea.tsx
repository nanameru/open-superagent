'use client';

import { ArrowUpIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SearchTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

export default function SearchTextarea({ value, onChange, onSubmit }: SearchTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enterの場合は改行を許可
    if (e.key === 'Enter' && !e.shiftKey) {
      // 日本語入力中でない場合のみ送信
      if (!isComposing && onSubmit && value.trim()) {
        e.preventDefault();
        onSubmit();
      }
    }
  };

  return (
    <div>
      <div className="relative flex items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="AIアシスタントにメッセージを送信"
          rows={1}
          className="w-full py-3.5 pl-4 pr-14 text-base text-gray-900 dark:text-gray-100 bg-transparent rounded-xl resize-none outline-none min-h-[52px] max-h-[300px] overflow-y-auto placeholder:text-gray-400 dark:placeholder:text-gray-500"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        />
        <div className="absolute right-3 bottom-2.5">
          <button 
            type="button"
            onClick={onSubmit}
            disabled={!value.trim()}
            className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:hover:bg-black dark:disabled:hover:bg-white relative"
          >
            <ArrowUpIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

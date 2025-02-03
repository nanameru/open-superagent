'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchTextarea from './textarea';
import SearchActions from './actions';
import Suggestions from './suggestions';

export default function SearchInput() {
  const [inputText, setInputText] = useState('');
  const router = useRouter();

  const suggestions = [
    { icon: '🔥', text: 'AIの最新情報を教えて', action: 'latest' },
    { icon: '⏰', text: '1日前のAI情報を教えて', action: 'yesterday' },
    { icon: '📅', text: '10月中のAI情報を教えて', action: 'october' },
  ];

  const handleSuggestionClick = (text: string) => {
    setInputText(text);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputText.trim()) {
      router.push(`/search/new?q=${encodeURIComponent(inputText.trim())}`);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <div className="relative bg-[#F7F7F8] dark:bg-[#444654] rounded-xl">
          <SearchTextarea 
            value={inputText} 
            onChange={setInputText}
            onSubmit={() => handleSubmit()}
          />
        </div>
      </div>
      <Suggestions items={suggestions} onSuggestionClick={handleSuggestionClick} />
      <button type="button" onClick={handleSubmit} className="hidden">Submit</button>
    </form>
  );
}

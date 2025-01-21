'use client';

import SearchTextarea from './textarea';
import SearchActions from './actions';
import Suggestions from './suggestions';

export default function SearchInput() {
  const suggestions = [
    { icon: '💻', text: 'Code', action: 'code' },
    { icon: '💡', text: 'Brainstorm', action: 'brainstorm' },
    { icon: '📝', text: 'Summarize text', action: 'summarize' },
    { icon: '✨', text: 'Surprise me', action: 'surprise' },
    { icon: '📋', text: 'Make a plan', action: 'plan' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <div className="relative bg-[#F7F7F8] dark:bg-[#444654] rounded-xl">
          <SearchTextarea />
        </div>
      </div>
      <Suggestions items={suggestions} />
    </div>
  );
}

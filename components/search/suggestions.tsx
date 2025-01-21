'use client';

interface Suggestion {
  icon: string;
  text: string;
  action: string;
}

interface SuggestionsProps {
  items: Suggestion[];
  onSuggestionClick: (text: string) => void;
}

export default function Suggestions({ items, onSuggestionClick }: SuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(item.text)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-[#444654] hover:bg-gray-50 dark:hover:bg-[#4F5361] rounded-lg border border-gray-200 dark:border-gray-600/50 transition-colors"
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.text}</span>
        </button>
      ))}
    </div>
  );
}

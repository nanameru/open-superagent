'use client';

interface SuggestionItem {
  emoji: string;
  text: string;
  gradient: string;
}

interface SuggestionsProps {
  items: SuggestionItem[];
}

export default function Suggestions({ items }: SuggestionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item, index) => (
        <button
          key={index}
          className="group relative flex items-center gap-3 p-3.5 text-left transition-all duration-300"
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl opacity-[0.08] group-hover:opacity-[0.12] transition-opacity`} />
          <div className="relative flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/95 shadow-sm shadow-black/5 ring-1 ring-black/5 transition-colors group-hover:bg-white">
              {item.emoji}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {item.text}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

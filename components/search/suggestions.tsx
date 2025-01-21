interface Suggestion {
  emoji: string;
  text: string;
  gradient: string;
}

interface SuggestionsProps {
  items: Suggestion[];
}

export default function Suggestions({ items }: SuggestionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((suggestion, index) => (
        <button
          key={index}
          className="group relative card-hover"
        >
          <div className={`absolute -inset-0.5 bg-gradient-to-br ${suggestion.gradient} rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-500`}></div>
          <div className="relative flex items-center p-4 glassmorphism rounded-lg">
            <span className="text-xl mr-3">{suggestion.emoji}</span>
            <span className="text-sm text-gray-700 font-medium group-hover:text-black transition-colors">{suggestion.text}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

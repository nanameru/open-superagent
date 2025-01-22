'use client';

interface GeneratedAnswerProps {
  isCompleted?: boolean;
}

export default function GeneratedAnswer({ isCompleted }: GeneratedAnswerProps) {
  if (!isCompleted) return null;

  return (
    <div className="flex items-start gap-4 p-6 bg-black/[0.02] rounded-xl backdrop-blur-sm">
      <div className="w-full">
        <div className="text-gray-600">
          回答を生成しました！
        </div>
      </div>
    </div>
  );
}

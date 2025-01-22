'use client';

import { FormattedResponse } from '@/utils/coze';

interface ParsedPostsProps {
  results?: FormattedResponse[];
}

export default function ParsedPosts({ results }: ParsedPostsProps) {
  if (!results || results.length === 0) return null;

  const totalPosts = results.reduce((sum, result) => sum + result.posts.length, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <span>🔍</span>
        <span>{totalPosts}件の投稿を取得</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {results.flatMap((result) =>
          result.posts.map((post, postIndex) => (
            <div
              key={`${result.query}-${postIndex}`}
              className="group relative w-full px-4 py-3 bg-black/[0.02] hover:bg-black/[0.04] rounded-xl text-sm text-gray-900 transition-all duration-200"
            >
              <div className="space-y-2">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-4">
                  {post.text}
                </p>
                <div className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleString('ja-JP')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

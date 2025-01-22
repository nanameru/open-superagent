'use client';

import { TwitterPost } from '@/utils/coze';

interface PostListProps {
  posts: TwitterPost[];
}

export default function PostList({ posts }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.slice(0, 100).map((post) => (
        <div key={post.id} className="p-4 bg-white rounded-lg border border-[#EEEEEE]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {/* Author info */}
              <div className="font-medium text-[#1D9BF0]">@{post.author.username}</div>
              <div className="text-sm text-gray-500">{post.author.name}</div>
            </div>
            <div className="flex-grow">
              {/* Post content */}
              <p className="text-sm text-[#444444] whitespace-pre-wrap">{post.text}</p>
              
              {/* Media content */}
              {post.media && post.media.length > 0 && (
                <div className="mt-2 space-y-2">
                  {post.media.map((media, index) => (
                    <div key={index}>
                      {media.type === 'photo' && (
                        <img
                          src={media.url}
                          alt={media.alt_text || '画像'}
                          className="rounded-lg max-h-64 object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Metrics */}
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>♺ {post.metrics.retweets}</span>
                <span>♡ {post.metrics.likes}</span>
                <span className="text-xs">{new Date(post.created_at).toLocaleString('ja-JP')}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

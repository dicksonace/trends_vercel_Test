'use client';

import { MessageCircle, Repeat2, Heart, Share2, ArrowLeft, Bookmark } from 'lucide-react';
import { Tweet, Comment } from '@/types';
import { mockComments } from '@/lib/mockData';
import { useState } from 'react';

interface CommentViewProps {
  tweet: Tweet;
  onBack: () => void;
}

export default function CommentView({ tweet, onBack }: CommentViewProps) {
  const [comments] = useState<Comment[]>(mockComments.filter(c => c.tweetId === tweet.id));
  const [newComment, setNewComment] = useState('');

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 lg:px-6 py-4 z-10 flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Comments</h2>
      </div>

      {/* Original Tweet */}
      <div className="border-b border-gray-200 px-4 lg:px-6 py-4 bg-gray-50">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {tweet.user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-bold text-gray-900">{tweet.user.name}</span>
              {tweet.user.verified && <span className="text-blue-500">✓</span>}
              <span className="text-gray-500 text-sm">@{tweet.user.username}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-sm">{tweet.timestamp}</span>
            </div>
            <p className="text-gray-900 leading-relaxed">{tweet.content}</p>
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              Y
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Trend your reply"
              className="w-full resize-none border-none outline-none text-lg placeholder-gray-500 min-h-[100px] focus:outline-none"
            />
            <div className="flex items-center justify-end mt-4">
              <button
                disabled={!newComment.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="border-b border-gray-200 px-4 lg:px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex space-x-4">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-gray-900">{comment.user.name}</span>
                    {comment.user.verified && <span className="text-blue-500">✓</span>}
                    <span className="text-gray-500 text-sm">@{comment.user.username}</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500 text-sm">{comment.timestamp}</span>
                  </div>

                  {/* Comment Text */}
                  <p className="text-gray-900 mb-3 leading-relaxed break-words">{comment.content}</p>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between max-w-md mt-2">
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center">
                      <div className="p-2 rounded-full group-hover:bg-blue-50">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-sm hidden sm:inline">{comment.replies}</span>
                    </button>

                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center">
                      <div className="p-2 rounded-full group-hover:bg-green-50">
                        <Repeat2 className="w-4 h-4" />
                      </div>
                    </button>

                    <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center">
                      <div className="p-2 rounded-full group-hover:bg-red-50">
                        <Heart className="w-4 h-4" />
                      </div>
                      <span className="text-sm hidden sm:inline">{comment.likes}</span>
                    </button>

                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center">
                      <div className="p-2 rounded-full group-hover:bg-blue-50">
                        <Bookmark className="w-4 h-4" />
                      </div>
                    </button>

                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center">
                      <div className="p-2 rounded-full group-hover:bg-blue-50">
                        <Share2 className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="px-4 lg:px-6 py-12 text-center text-gray-500">
            <p>No comments yet. Be the first to reply!</p>
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import TweetCard from './TweetCard';
import { Tweet } from '@/types';
import Link from 'next/link';
import { useEffect } from 'react';

interface FeedProps {
  tweets: Tweet[];
  highlightedPostId?: string;
  postRef?: React.RefObject<HTMLDivElement>;
}

export default function Feed({ tweets, highlightedPostId, postRef }: FeedProps) {
  useEffect(() => {
    // Trigger a custom event when feed is rendered
    const event = new CustomEvent('feedRendered');
    window.dispatchEvent(event);
  }, [tweets]);

  if (!tweets || tweets.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto lg:max-w-[600px] p-8 text-center text-muted-foreground">
        <p>No posts available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4 z-10 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Home</h2>
        <Link
          href="/login"
          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition-colors shadow-md text-sm touch-manipulation"
        >
          Login
        </Link>
      </div>

      {/* Tweet Input */}
      <div className="border-b border-border px-4 lg:px-6 py-4 bg-background">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              Y
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              placeholder="What's happening?"
              className="w-full resize-none border-none outline-none text-xl placeholder-muted-foreground min-h-[100px] focus:outline-none bg-background text-foreground"
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 text-blue-500">
                {/* Media icons would go here */}
              </div>
              <button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation">
                Tweet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tweets */}
      <div>
        {tweets.map((tweet) => (
          <div
            key={tweet.id}
            ref={tweet.id === highlightedPostId ? postRef : undefined}
          >
            <TweetCard 
              tweet={tweet} 
              isHighlighted={tweet.id === highlightedPostId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

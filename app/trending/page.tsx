'use client';

import Feed from '@/components/Feed';
import { mockTweets } from '@/lib/mockData';

export default function TrendingPage() {
  // Filter for trending posts (high engagement)
  const trendingTweets = mockTweets
    .filter(tweet => (tweet.likes + tweet.retweets) > 100)
    .sort((a, b) => (b.likes + b.retweets) - (a.likes + a.retweets));

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <div className="px-4 lg:px-6 py-4">
          <h2 className="text-2xl font-bold text-foreground">Trending</h2>
          <p className="text-sm text-muted-foreground mt-1">Discover what's trending now</p>
        </div>
      </div>

      {/* Trending Feed */}
      <Feed tweets={trendingTweets} />
    </main>
  );
}

'use client';

import { Search, TrendingUp, Hash, Sparkles } from 'lucide-react';
import { mockTweets } from '@/lib/mockData';
import TweetCard from '@/components/TweetCard';

export default function ExplorePage() {
  const trendingTopics = [
    { tag: 'Technology', tweets: '125K', category: 'Technology', trend: 'up' },
    { tag: 'Web Development', tweets: '89K', category: 'Technology', trend: 'up' },
    { tag: 'Design', tweets: '67K', category: 'Design', trend: 'stable' },
    { tag: 'AI', tweets: '234K', category: 'Technology', trend: 'up' },
    { tag: 'React', tweets: '45K', category: 'Technology', trend: 'up' },
  ];

  // Get some tweets for "For You" section
  const forYouTweets = mockTweets.slice(0, 5);

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search TrendsHub"
            className="w-full pl-10 pr-4 py-3 rounded-full bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6 py-6">
        {/* Trending Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
          </div>
          
          <div className="space-y-3">
            {trendingTopics.map((topic, index) => (
              <div
                key={index}
                className="group p-4 rounded-xl bg-muted/50 border border-border hover:bg-accent hover:border-blue-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{topic.category}</span>
                    {topic.trend === 'up' && (
                      <span className="text-xs text-green-500 font-semibold">↑ Trending</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{topic.tweets} Tweets</span>
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">{topic.tag}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* For You Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">For You</h2>
          </div>
          <div>
            {forYouTweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import { Bookmark } from 'lucide-react';
import { mockTweets } from '@/lib/mockData';
import TweetCard from '@/components/TweetCard';

export default function BookmarksPage() {
  // Use first few tweets as bookmarked posts
  const bookmarkedPosts = mockTweets.slice(0, 5);

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Bookmark className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Bookmarks</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {bookmarkedPosts.length} saved {bookmarkedPosts.length === 1 ? 'post' : 'posts'}
        </p>
      </div>

      {/* Bookmarked Posts */}
      <div>
        {bookmarkedPosts.length > 0 ? (
          bookmarkedPosts.map((tweet) => (
            <div key={tweet.id} className="border-b border-border relative">
              <div className="absolute top-4 right-4 z-10">
                <div className="p-2 rounded-full bg-yellow-500/10">
                  <Bookmark className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
              <TweetCard tweet={tweet} />
            </div>
          ))
        ) : (
          <div className="px-4 lg:px-6 py-12">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Save posts for later</h3>
              <p className="text-muted-foreground mb-4">
                Bookmark posts to easily find them again in the future.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <p className="text-sm text-muted-foreground">
                  💡 Tip: Click the bookmark icon on any post to save it here!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

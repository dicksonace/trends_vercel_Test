'use client';

import { Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import TweetCard from '@/components/TweetCard';
import { fetchBookmarks, getAuthToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { FeedPost } from '@/lib/api';
import type { Tweet } from '@/types';

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      console.log('🔍 DEBUG: Bookmarks page loading bookmarks');
      
      const token = getAuthToken();
      if (!token) {
        console.log('🔍 DEBUG: No token found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('🔍 DEBUG: Token found, loading bookmarks');
      setIsLoading(true);
      
      try {
        console.log('🔍 DEBUG: Making API call to fetch bookmarks');
        const response = await fetchBookmarks();
        
        console.log('🔍 DEBUG: Bookmarks API response:', response);
        console.log('🔍 DEBUG: Response status:', response.status);
        console.log('🔍 DEBUG: Response error:', response.error);
        console.log('🔍 DEBUG: Response data:', response.data);
        
        if (response.error) {
          console.error('🔍 DEBUG: Bookmarks API error:', response.error);
          // Show error in UI instead of silent fail
          return;
        } else if (response.data) {
          console.log('🔍 DEBUG: Bookmarks data received:', response.data);
          
          // Handle different response formats
          let posts = [];
          if (response.data.posts) {
            posts = response.data.posts;
          } else if (Array.isArray(response.data)) {
            posts = response.data;
          } else {
            console.warn('🔍 DEBUG: Unexpected data format:', response.data);
            posts = [];
          }
          
          console.log('🔍 DEBUG: Posts to convert:', posts);
          
          // Convert FeedPost to Tweet format
          const convertedTweets: Tweet[] = posts.map((post: any) => ({
            id: post.id,
            user: {
              id: post.user.id,
              name: post.user.name,
              username: post.user.username,
              avatar: post.user.avatar,
              verified: post.user.verified || false,
            },
            content: post.content,
            images: post.images,
            timestamp: post.timestamp,
            likes: post.likes,
            retweets: post.retweets,
            replies: post.replies,
            liked: post.liked || false,
            retweeted: post.retweeted || false,
            bookmarked: true, // All posts here are bookmarked
            poll: post.poll,
          }));
          
          console.log('🔍 DEBUG: Converted tweets:', convertedTweets);
          console.log('🔍 DEBUG: Setting bookmarked posts:', convertedTweets.length);
          setBookmarkedPosts(convertedTweets);
        } else {
          console.warn('🔍 DEBUG: No data in response');
        }
      } catch (error) {
        console.error('🔍 DEBUG: Error loading bookmarks:', error);
        console.error('🔍 DEBUG: Error details:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        console.log('🔍 DEBUG: Loading bookmarks complete');
        setIsLoading(false);
      }
    };

    loadBookmarks();
  }, [router]);

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
        {isLoading ? (
          <div className="px-4 lg:px-6 py-12 text-center text-muted-foreground">
            <p>Loading bookmarks...</p>
          </div>
        ) : bookmarkedPosts.length > 0 ? (
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

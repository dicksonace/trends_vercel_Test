'use client';

import { Search, TrendingUp, Hash, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import TweetCard from '@/components/TweetCard';
import TweetSkeleton from '@/components/TweetSkeleton';
import { searchTrends, fetchHashtag, fetchFeed } from '@/lib/api';
import type { Tweet } from '@/types';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tweet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [hashtagResults, setHashtagResults] = useState<Tweet[]>([]);
  const [isLoadingHashtag, setIsLoadingHashtag] = useState(false);
  const [forYouTweets, setForYouTweets] = useState<Tweet[]>([]);
  const [isLoadingForYou, setIsLoadingForYou] = useState(true);
  
  // Popular hashtags (could be fetched from API in the future)
  const trendingTopics = [
    { tag: 'Technology', tweets: '125K', category: 'Technology', trend: 'up' },
    { tag: 'Web Development', tweets: '89K', category: 'Technology', trend: 'up' },
    { tag: 'Design', tweets: '67K', category: 'Design', trend: 'stable' },
    { tag: 'AI', tweets: '234K', category: 'Technology', trend: 'up' },
    { tag: 'React', tweets: '45K', category: 'Technology', trend: 'up' },
  ];

  // Load "For You" feed on mount
  useEffect(() => {
    const loadForYou = async () => {
      setIsLoadingForYou(true);
      try {
        const response = await fetchFeed('for-you', 1, 5);
        if (response.status === 200 && response.data) {
          // Convert response to Tweet format (same logic as Feed component)
          const postsArray = (response.data as any)?.data || (response.data as any)?.posts || (response.data as any)?.trend || [];
          if (Array.isArray(postsArray) && postsArray.length > 0) {
            const convertedTweets = postsArray.slice(0, 5).map((post: any) => {
              let avatarUrl: string = '';
              if (post.user?.picture) {
                avatarUrl = post.user.picture.startsWith('http') 
                  ? post.user.picture 
                  : `https://www.trendshub.link/storage/${post.user.picture}`;
              } else if (post.user?.avatar) {
                avatarUrl = post.user.avatar || '';
              }
              
              let images: string[] | undefined = undefined;
              if (post.images && post.images !== null) {
                let imageArray: any[] = [];
                if (typeof post.images === 'string') {
                  try {
                    const parsed = JSON.parse(post.images);
                    imageArray = Array.isArray(parsed) ? parsed : [parsed];
                  } catch (e) {
                    imageArray = [post.images];
                  }
                } else if (Array.isArray(post.images)) {
                  imageArray = post.images;
                } else {
                  imageArray = [post.images];
                }
                
                images = imageArray
                  .filter((img: any) => img !== null && img !== undefined && img !== '' && img !== 'null')
                  .map((img: string) => {
                    if (img.startsWith('http://') || img.startsWith('https://')) {
                      return img;
                    }
                    return `https://www.trendshub.link/storage/${img}`;
                  });
                if (images.length === 0) images = undefined;
              }
              
              return {
                id: String(post.id),
                user: {
                  id: String(post.user?.id || ''),
                  name: post.user?.name || '',
                  username: post.user?.username || '',
                  avatar: avatarUrl,
                  verified: post.user?.verification !== null || post.user?.verified || false,
                },
                content: post.text || post.content || '',
                images: images,
                timestamp: post.created_at || '',
                likes: post.reactions?.length || post.likes || post.likes_count || 0,
                retweets: post.retweets || post.shares_count || 0,
                replies: post.comments?.length || post.replies || post.comments_count || 0,
                liked: post.reactions?.some((r: any) => r.type === 'like') || post.liked || false,
                retweeted: post.retweeted || false,
                bookmarked: post.bookmarked || false,
                poll: post.poll_question ? {
                  question: post.poll_question,
                  options: post.poll_options ? (Array.isArray(post.poll_options) ? post.poll_options : JSON.parse(post.poll_options)) : [],
                  votes: [],
                  endDate: post.poll_end_date || undefined,
                } : undefined,
              };
            });
            setForYouTweets(convertedTweets as Tweet[]);
          } else {
            setForYouTweets([]);
          }
        } else {
          setForYouTweets([]);
        }
      } catch (error) {
        // console.error('Error loading for you feed:', error);
        setForYouTweets([]);
      } finally {
        setIsLoadingForYou(false);
      }
    };

    loadForYou();
  }, []);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchTrends({ query: query.trim(), page: 1 });
      if (response.status === 200 && response.data) {
        // Convert response to Tweet format
        const postsArray = response.data?.data || response.data?.posts || response.data?.trend || [];
        if (Array.isArray(postsArray) && postsArray.length > 0) {
          const convertedTweets: Tweet[] = postsArray.map((post: any) => {
            let avatarUrl: string | undefined = undefined;
            if (post.user?.picture) {
              avatarUrl = post.user.picture.startsWith('http') 
                ? post.user.picture 
                : `https://www.trendshub.link/storage/${post.user.picture}`;
            } else if (post.user?.avatar) {
              avatarUrl = post.user.avatar;
            }
            
            let images: string[] | undefined = undefined;
            if (post.images && post.images !== null) {
              let imageArray: any[] = [];
              if (typeof post.images === 'string') {
                try {
                  const parsed = JSON.parse(post.images);
                  imageArray = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                  imageArray = [post.images];
                }
              } else if (Array.isArray(post.images)) {
                imageArray = post.images;
              } else {
                imageArray = [post.images];
              }
              
              images = imageArray
                .filter((img: any) => img !== null && img !== undefined && img !== '' && img !== 'null')
                .map((img: string) => {
                  if (img.startsWith('http://') || img.startsWith('https://')) {
                    return img;
                  }
                  return `https://www.trendshub.link/storage/${img}`;
                });
              if (images.length === 0) images = undefined;
            }
            
            return {
              id: String(post.id),
              user: {
                id: String(post.user?.id || ''),
                name: post.user?.name || '',
                username: post.user?.username || '',
                avatar: avatarUrl,
                verified: post.user?.verification !== null || post.user?.verified || false,
              },
              content: post.text || post.content || '',
              images: images,
              timestamp: post.created_at || '',
              likes: post.reactions?.length || post.likes || post.likes_count || 0,
              retweets: post.retweets || post.shares_count || 0,
              replies: post.comments?.length || post.replies || post.comments_count || 0,
              liked: post.reactions?.some((r: any) => r.type === 'like') || post.liked || false,
              retweeted: post.retweeted || false,
              bookmarked: post.bookmarked || false,
              poll: post.poll_question ? {
                question: post.poll_question,
                options: post.poll_options ? (Array.isArray(post.poll_options) ? post.poll_options : JSON.parse(post.poll_options)) : [],
                votes: [],
                endDate: post.poll_end_date || undefined,
              } : undefined,
            };
          });
          setSearchResults(convertedTweets as Tweet[]);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      // console.error('Error searching trends:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle hashtag click
  const handleHashtagClick = useCallback(async (hashtag: string) => {
    setSelectedHashtag(hashtag);
    setIsLoadingHashtag(true);
    setHashtagResults([]);
    
    try {
      const response = await fetchHashtag(hashtag);
      if (response.status === 200 && response.data) {
        // Convert response to Tweet format
        const postsArray = response.data?.data || response.data?.posts || response.data?.trend || [];
        if (Array.isArray(postsArray) && postsArray.length > 0) {
          const convertedTweets: Tweet[] = postsArray.map((post: any) => {
            let avatarUrl: string | undefined = undefined;
            if (post.user?.picture) {
              avatarUrl = post.user.picture.startsWith('http') 
                ? post.user.picture 
                : `https://www.trendshub.link/storage/${post.user.picture}`;
            } else if (post.user?.avatar) {
              avatarUrl = post.user.avatar;
            }
            
            let images: string[] | undefined = undefined;
            if (post.images && post.images !== null) {
              let imageArray: any[] = [];
              if (typeof post.images === 'string') {
                try {
                  const parsed = JSON.parse(post.images);
                  imageArray = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                  imageArray = [post.images];
                }
              } else if (Array.isArray(post.images)) {
                imageArray = post.images;
              } else {
                imageArray = [post.images];
              }
              
              images = imageArray
                .filter((img: any) => img !== null && img !== undefined && img !== '' && img !== 'null')
                .map((img: string) => {
                  if (img.startsWith('http://') || img.startsWith('https://')) {
                    return img;
                  }
                  return `https://www.trendshub.link/storage/${img}`;
                });
              if (images.length === 0) images = undefined;
            }
            
            return {
              id: String(post.id),
              user: {
                id: String(post.user?.id || ''),
                name: post.user?.name || '',
                username: post.user?.username || '',
                avatar: avatarUrl,
                verified: post.user?.verification !== null || post.user?.verified || false,
              },
              content: post.text || post.content || '',
              images: images,
              timestamp: post.created_at || '',
              likes: post.reactions?.length || post.likes || post.likes_count || 0,
              retweets: post.retweets || post.shares_count || 0,
              replies: post.comments?.length || post.replies || post.comments_count || 0,
              liked: post.reactions?.some((r: any) => r.type === 'like') || post.liked || false,
              retweeted: post.retweeted || false,
              bookmarked: post.bookmarked || false,
              poll: post.poll_question ? {
                question: post.poll_question,
                options: post.poll_options ? (Array.isArray(post.poll_options) ? post.poll_options : JSON.parse(post.poll_options)) : [],
                votes: [],
                endDate: post.poll_end_date || undefined,
              } : undefined,
            };
          });
          setHashtagResults(convertedTweets as Tweet[]);
        } else {
          setHashtagResults([]);
        }
      } else {
        setHashtagResults([]);
      }
    } catch (error) {
      // console.error('Error fetching hashtag:', error);
      setHashtagResults([]);
    } finally {
      setIsLoadingHashtag(false);
    }
  }, []);

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search TrendsHub"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                handleSearch(e.target.value);
              } else {
                setSearchResults([]);
                setIsSearching(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                handleSearch(searchQuery);
              }
            }}
            className="w-full pl-10 pr-4 py-3 rounded-full bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6 py-6">
        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-blue-500" />
              <h2 className="text-2xl font-bold text-foreground">
                Search Results for &quot;{searchQuery}&quot;
              </h2>
            </div>
            {isSearching ? (
              <div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TweetSkeleton key={i} showImage={i % 3 === 0} />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((tweet) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No results found for &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        )}

        {/* Hashtag Results */}
        {selectedHashtag && !searchQuery.trim() && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Hash className="w-5 h-5 text-blue-500" />
              <h2 className="text-2xl font-bold text-foreground">
                #{selectedHashtag}
              </h2>
              <button
                onClick={() => {
                  setSelectedHashtag(null);
                  setHashtagResults([]);
                }}
                className="ml-auto text-sm text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            {isLoadingHashtag ? (
              <div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TweetSkeleton key={i} showImage={i % 3 === 0} />
                ))}
              </div>
            ) : hashtagResults.length > 0 ? (
              <div>
                {hashtagResults.map((tweet) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts found for #{selectedHashtag}</p>
              </div>
            )}
          </div>
        )}

        {/* Trending Section - Only show if no search or hashtag selected */}
        {!searchQuery.trim() && !selectedHashtag && (
          <>
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
                    onClick={() => handleHashtagClick(topic.tag)}
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
                    <h3 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">#{topic.tag}</h3>
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
              {isLoadingForYou ? (
                <div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TweetSkeleton key={i} showImage={i % 3 === 0} />
                  ))}
                </div>
              ) : forYouTweets.length > 0 ? (
                <div>
                  {forYouTweets.map((tweet) => (
                    <TweetCard key={tweet.id} tweet={tweet} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts available</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

'use client';

import PostView from '@/components/PostView';
import { fetchPost, fetchFeed, fetchBitsForYou, getAuthToken } from '@/lib/api';
import { Tweet } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setError('Post ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // First, try to find the post in cached feed data (check both cache key formats)
      if (typeof window !== 'undefined') {
        try {
          // Try both cache key formats
          const cacheKeys = ['feedCache', 'feed_cache'];
          let cachedPost: Tweet | null = null;
          
          for (const cacheKey of cacheKeys) {
            const cachedFeed = sessionStorage.getItem(cacheKey);
            if (cachedFeed) {
              try {
                const feedTweets: Tweet[] = JSON.parse(cachedFeed);
                const found = feedTweets.find(t => String(t.id) === String(id));
                
                if (found) {
                  cachedPost = found;
                  // console.log(`✅ Found post in cached feed data (key: ${cacheKey}), using cached version`);
                  break;
                }
              } catch (parseError) {
                // console.warn(`Error parsing cached feed from ${cacheKey}:`, parseError);
              }
            }
          }
          
          if (cachedPost) {
            setTweet(cachedPost);
            setIsLoading(false);
            return; // Use cached data and skip API call
          }
        } catch (e) {
          // console.error('Error checking cached feed:', e);
        }
      }

      try {
        // console.log('=== PostPage: Loading Post ===');
        // console.log('Post ID:', id);
        
        const response = await fetchPost(id);
        
        // console.log('PostPage Response Status:', response.status);
        // console.log('PostPage Response Data:', JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data) {
          // Convert backend post format to Tweet format
          const post = response.data;
          
          // console.log('PostPage: Raw response.data:', JSON.stringify(post, null, 2));
          // console.log('PostPage: Response data type:', typeof post);
          // console.log('PostPage: Response data keys:', post ? Object.keys(post) : 'null');
          
          // Handle different response structures
          let postData = post;
          if (post.trend) {
            // console.log('PostPage: Found post.trend structure');
            postData = post.trend;
          } else if (post.post) {
            // console.log('PostPage: Found post.post structure');
            postData = post.post;
          } else if (post.data) {
            // console.log('PostPage: Found post.data structure');
            postData = post.data;
          } else if (Array.isArray(post)) {
            // console.log('PostPage: Response is directly an array');
            postData = post;
          } else {
            // console.log('PostPage: Using response.data directly');
            postData = post;
          }

          // Check if it's a single post object or an array
          const actualPost = Array.isArray(postData) ? postData[0] : postData;

          // console.log('PostPage: Actual post data:', JSON.stringify(actualPost, null, 2));

          if (actualPost && actualPost.id) {
            // Handle avatar URL construction
            let avatarUrl: string | undefined = undefined;
            if (actualPost.user?.picture) {
              if (actualPost.user.picture.startsWith('http')) {
                avatarUrl = actualPost.user.picture;
              } else {
                avatarUrl = `https://www.trendshub.link/storage/${actualPost.user.picture}`;
              }
            } else if (actualPost.user?.avatar) {
              avatarUrl = actualPost.user.avatar;
            }

            // Handle images - could be images, image_urls, or video thumbnail
            let images: string[] | undefined = undefined;
            if (actualPost.images) {
              images = Array.isArray(actualPost.images) ? actualPost.images : [actualPost.images];
            } else if (actualPost.image_urls) {
              images = Array.isArray(actualPost.image_urls) ? actualPost.image_urls : [actualPost.image_urls];
            } else if (actualPost.media_thumbnail_url) {
              // For video posts (bits), use thumbnail as image
              images = [actualPost.media_thumbnail_url];
            } else if (actualPost.videoThumbnail) {
              images = Array.isArray(actualPost.videoThumbnail) ? actualPost.videoThumbnail : [actualPost.videoThumbnail];
            }

            // Handle video_file for bits (video posts)
            const videoFile = actualPost.video_url || actualPost.video || undefined;

            const convertedTweet: Tweet = {
              id: String(actualPost.id),
              user: {
                id: String(actualPost.user?.id || ''),
                name: actualPost.user?.name || '',
                username: actualPost.user?.username || '',
                avatar: avatarUrl,
                verified: actualPost.user?.verification !== null || actualPost.user?.verified || false,
              },
              content: actualPost.text || actualPost.content || actualPost.caption || '',
              images: images,
              video_file: videoFile,
              timestamp: actualPost.created_at || actualPost.timestamp || '',
              likes: actualPost.reactions?.length || actualPost.likes || actualPost.likes_count || 0,
              retweets: actualPost.retweets || actualPost.shares_count || 0,
              replies: actualPost.comments?.length || actualPost.replies || actualPost.comments_count || 0,
              liked: actualPost.reactions?.some((r: any) => r.type === 'like') || actualPost.liked || false,
              retweeted: actualPost.retweeted || false,
              bookmarked: actualPost.bookmarked || false,
              poll: actualPost.poll_question ? {
                question: actualPost.poll_question,
                options: actualPost.poll_options 
                  ? (Array.isArray(actualPost.poll_options) 
                      ? actualPost.poll_options 
                      : typeof actualPost.poll_options === 'string'
                      ? JSON.parse(actualPost.poll_options)
                      : [])
                  : [],
                votes: [],
                endDate: actualPost.poll_end_date || undefined,
              } : undefined,
            };

            // console.log('✅ Converted Tweet:', JSON.stringify(convertedTweet, null, 2));
            setTweet(convertedTweet);
          } else {
            // console.error('PostPage: Post data is invalid or missing ID');
            // console.error('Actual post:', actualPost);
            setError('Post not found or invalid data');
          }
        } else if (response.status === 404) {
          // console.error('PostPage: 404 - Post not found');
          
          // Try to find the post in cached feed data as a fallback (check both cache key formats)
          if (typeof window !== 'undefined') {
            try {
              const cacheKeys = ['feedCache', 'feed_cache'];
              let cachedPost: Tweet | null = null;
              
              for (const cacheKey of cacheKeys) {
                const cachedFeed = sessionStorage.getItem(cacheKey);
                if (cachedFeed) {
                  try {
                    const feedTweets: Tweet[] = JSON.parse(cachedFeed);
                    const found = feedTweets.find(t => String(t.id) === String(id));
                    
                    if (found) {
                      cachedPost = found;
                      // console.log(`✅ Found post in cached feed data (key: ${cacheKey}) after 404`);
                      break;
                    }
                  } catch (parseError) {
                    // console.warn(`Error parsing cached feed from ${cacheKey}:`, parseError);
                  }
                }
              }
              
              if (cachedPost) {
                setTweet(cachedPost);
                setIsLoading(false);
                return;
              }
            } catch (e) {
              // console.error('Error checking cached feed:', e);
            }
          }
          
          // Last resort: Try fetching from feed and searching for the post
          // console.log('⚠️ Post not found via direct endpoint. Trying to fetch from feed...');
          try {
            let foundPost: any = null;
            
            // First try regular feed
            const feedResponse = await fetchFeed('for-you');
            
            if (feedResponse.status === 200 && feedResponse.data) {
              // Search through feed data for the post
              // Handle different feed response structures
              if (Array.isArray(feedResponse.data)) {
                foundPost = feedResponse.data.find((p: any) => String(p.id) === String(id));
              } else if (feedResponse.data.posts && Array.isArray(feedResponse.data.posts)) {
                foundPost = feedResponse.data.posts.find((p: any) => String(p.id) === String(id));
              } else if (feedResponse.data.trend && Array.isArray(feedResponse.data.trend)) {
                foundPost = feedResponse.data.trend.find((p: any) => String(p.id) === String(id));
              } else if (feedResponse.data.data && Array.isArray(feedResponse.data.data)) {
                foundPost = feedResponse.data.data.find((p: any) => String(p.id) === String(id));
              }
            }
            
            // If not found in regular feed, try bits feed
            if (!foundPost) {
              // console.log('⚠️ Post not found in regular feed. Trying bits feed...');
              const bitsResponse = await fetchBitsForYou();
              
              if (bitsResponse.status === 200 && bitsResponse.data) {
                const bits = bitsResponse.data.data || [];
                foundPost = bits.find((b: any) => String(b.id) === String(id));
              }
            }
            
            if (foundPost) {
              // console.log('✅ Found post in feed response');
              
              // Handle avatar URL construction for bits
              let avatarUrl: string | undefined = undefined;
              if (foundPost.user?.picture) {
                if (foundPost.user.picture.startsWith('http')) {
                  avatarUrl = foundPost.user.picture;
                } else {
                  avatarUrl = `https://www.trendshub.link/storage/${foundPost.user.picture}`;
                }
              } else if (foundPost.user?.avatar) {
                avatarUrl = foundPost.user.avatar;
              }
              
              // Handle images/video for bits - check for video_url and media_thumbnail_url
              let images: string[] | undefined = undefined;
              if (foundPost.images) {
                images = Array.isArray(foundPost.images) ? foundPost.images : [foundPost.images];
              } else if (foundPost.image_urls) {
                images = Array.isArray(foundPost.image_urls) ? foundPost.image_urls : [foundPost.image_urls];
              } else if (foundPost.media_thumbnail_url) {
                // For video posts (bits), use thumbnail as image
                images = [foundPost.media_thumbnail_url];
              } else if (foundPost.videoThumbnail) {
                images = Array.isArray(foundPost.videoThumbnail) ? foundPost.videoThumbnail : [foundPost.videoThumbnail];
              }
              
              // Convert to Tweet format (same conversion logic as above)
              const convertedTweet: Tweet = {
                id: String(foundPost.id),
                user: {
                  id: String(foundPost.user?.id || ''),
                  name: foundPost.user?.name || '',
                  username: foundPost.user?.username || '',
                  avatar: avatarUrl,
                  verified: foundPost.user?.verification !== null || foundPost.user?.verified || false,
                },
                content: foundPost.text || foundPost.content || foundPost.caption || '',
                images: images,
                video_file: foundPost.video_url || undefined, // Add video_file for bits
                timestamp: foundPost.created_at || foundPost.timestamp || '',
                likes: foundPost.reactions?.length || foundPost.likes || foundPost.likes_count || 0,
                retweets: foundPost.retweets || foundPost.shares_count || 0,
                replies: foundPost.comments?.length || foundPost.replies || foundPost.comments_count || 0,
                liked: foundPost.reactions?.some((r: any) => r.type === 'like') || foundPost.liked || false,
                retweeted: foundPost.retweeted || false,
                bookmarked: foundPost.bookmarked || false,
                poll: foundPost.poll_question ? {
                  question: foundPost.poll_question,
                  options: foundPost.poll_options 
                    ? (Array.isArray(foundPost.poll_options) 
                        ? foundPost.poll_options 
                        : typeof foundPost.poll_options === 'string'
                        ? JSON.parse(foundPost.poll_options)
                        : [])
                    : [],
                  votes: [],
                  endDate: foundPost.poll_end_date || undefined,
                } : undefined,
              };
              
              setTweet(convertedTweet);
              setIsLoading(false);
              return;
            }
          } catch (feedError) {
            // console.error('Error fetching from feed as fallback:', feedError);
          }
          
          setError(`Post not found. The post with ID ${id} may have been deleted or doesn't exist.`);
        } else if (response.status === 429) {
          // console.error('PostPage: 429 - Too Many Requests');
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          // console.error('PostPage: Failed to load post. Status:', response.status);
          // console.error('PostPage: Error:', response.error);
          setError(response.error || 'Failed to load post');
        }
      } catch (err) {
        // console.error('Error loading post:', err);
        setError('An error occurred while loading the post');
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [id]);

  if (isLoading) {
    return (
      <main className="border-x border-border bg-background min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading post...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !tweet) {
    return (
      <main className="border-x border-border bg-background min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Post not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="border-x border-border bg-background">
      <PostView tweet={tweet} />
    </main>
  );
}

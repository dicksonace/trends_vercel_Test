'use client';

import TweetCard from './TweetCard';
import TweetSkeleton from './TweetSkeleton';
import { Tweet } from '@/types';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Home as HomeIcon, Image as ImageIcon, Video, Smile, MapPin, Calendar, BarChart3, X, Search, Clock, Plus, RefreshCw } from 'lucide-react';
import { getAuthToken, fetchFeed, fetchBitsForYou, type FeedPost } from '@/lib/api';

interface FeedProps {
  tweets: Tweet[];
  highlightedPostId?: string;
  postRef?: React.RefObject<HTMLDivElement>;
  initialTab?: 'discover' | 'for-you' | 'following';
}

type TabType = 'discover' | 'for-you' | 'following';

export default function Feed({ tweets: initialTweets, highlightedPostId, postRef, initialTab = 'for-you' }: FeedProps) {
  const router = useRouter();
  // Use useEffect to set initial tab to avoid hydration mismatch
  const [activeTab, setActiveTab] = useState<TabType>('for-you');
  // Always initialize with initialTweets to avoid hydration mismatch
  // Cache will be loaded in useEffect after mount
  const [tweets, setTweets] = useState<Tweet[]>(initialTweets);
  const [discoverTweets, setDiscoverTweets] = useState<Tweet[]>([]);
  const [hasLoadedFromCache, setHasLoadedFromCache] = useState(false);
  const [hasLoadedDiscoverCache, setHasLoadedDiscoverCache] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pullToRefreshY, setPullToRefreshY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set()); // Track which pages we've loaded
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [trendText, setTrendText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('1');
  const [hasPoll, setHasPoll] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Function to refresh feed (bypasses cache, always gets fresh content)
  const refreshFeed = async (forceRefresh = false) => {
    const token = getAuthToken();
    if (!token || (activeTab !== 'for-you' && activeTab !== 'following' && activeTab !== 'discover')) {
      // console.log('⚠️ Refresh skipped - No token or invalid tab. Active tab:', activeTab);
      return;
    }

    // console.log(`🔄 ===== REFRESHING ${activeTab.toUpperCase()} FEED =====`);
    // console.log('🔄 Step 1: Clearing cache and resetting state');
    setIsRefreshing(true);
    
    // Always clear cache and reset pagination for refresh
    if (activeTab === 'discover') {
      sessionStorage.removeItem('discover_cache');
      sessionStorage.removeItem('discover_cache_timestamp');
      setHasLoadedDiscoverCache(false);
    } else {
      sessionStorage.removeItem('feed_cache');
      sessionStorage.removeItem('feed_cache_timestamp');
      setHasLoadedFromCache(false);
    }
    sessionStorage.setItem('feed_was_refreshed', 'true'); // Mark that we're refreshing
    setCurrentPage(1);
    setLastPage(1);
    setHasMore(true);
    setLoadedPages(new Set()); // Clear loaded pages tracking

    try {
      // console.log('🔄 Step 2: Making API call to get fresh content');
      
      let feedType: 'for-you' | 'following' | 'trending' = 'for-you';
      if (activeTab === 'following') {
        feedType = 'following';
        // console.log('🔄 Endpoint: /api/v1/following?page=1&pageSize=20');
      } else if (activeTab === 'discover') {
        feedType = 'trending';
        // console.log('🔄 Endpoint: /api/v1/trending?page=1&pageSize=20');
      } else {
        // console.log('🔄 Endpoint: /api/v1/for-you-trends?page=1&pageSize=20');
        // console.log('🔄 Backend uses inRandomOrder() - each request returns different random content');
      }
      
      let response = await fetchFeed(feedType, 1, 20); // Always start from page 1
      
      // console.log('🔄 Step 3: API Response received');
      // console.log('🔄 Response Status:', response.status);
      
      if (response.status === 404) {
        // console.warn('⚠️ All /api/v1/for-you* endpoints returned 404, trying fetch-bits-for-you as fallback...');
        // console.warn('⚠️ NOTE: Bits feed may not use inRandomOrder() - using random page for variety');
        // Use a random page between 1 and 20 to get different content on refresh
        // This is a workaround if bits feed doesn't use random ordering
        const randomPage = Math.floor(Math.random() * 20) + 1;
        // console.log('🔄 Using random page', randomPage, 'for bits feed to get different content on refresh');
        const bitsResponse = await fetchBitsForYou(randomPage, 20);
        if (bitsResponse.status === 200 && bitsResponse.data) {
          // console.log('✅ Using bits feed as fallback with pagination (page', randomPage, ')');
          response = bitsResponse;
        } else {
          // If random page fails or returns empty, try page 1
          // console.log('⚠️ Random page failed or empty, trying page 1...');
          const bitsResponsePage1 = await fetchBitsForYou(1, 20);
          if (bitsResponsePage1.status === 200 && bitsResponsePage1.data) {
            // console.log('✅ Using bits feed as fallback with page 1');
            response = bitsResponsePage1;
          }
        }
      }
      
      // Process response (same logic as loadFeed)
      // console.log('🔄 Step 4: Processing response data');
      // console.log('🔄 Response structure:', {
      //   hasData: !!response.data,
      //   isArray: Array.isArray(response.data),
      //   hasDataArray: Array.isArray(response.data?.data),
      //   hasPosts: Array.isArray(response.data?.posts),
      //   hasTrend: Array.isArray(response.data?.trend),
      //   currentPage: response.data?.current_page,
      //   lastPage: response.data?.last_page,
      //   dataLength: response.data?.data?.length || 0
      // });
      
      const isDirectArray = Array.isArray(response.data);
      const isDataFormat = Array.isArray(response.data?.data); // Backend format: { data: [...] }
      const isBitsFormat = isDataFormat && response.data.data.some((item: any) => item.video_url || item.caption !== undefined);
      const isPostsFormat = Array.isArray(response.data?.posts);
      const isTrendFormat = Array.isArray(response.data?.trend);
      
      let convertedTweets: Tweet[] = [];
      
      // Handle backend format: { data: [...], current_page, last_page, success }
      if (isDataFormat && !isBitsFormat) {
        // console.log('🔄 Processing backend FeedResource format');
        // console.log('🔄 Posts count from backend:', response.data.data.length);
        convertedTweets = response.data.data.map((post: any) => {
          // Handle avatar URL construction
          let avatarUrl: string | undefined = undefined;
          if (post.user?.picture) {
            if (post.user.picture.startsWith('http')) {
              avatarUrl = post.user.picture;
            } else {
              avatarUrl = `https://www.trendshub.link/storage/${post.user.picture}`;
            }
          } else if (post.user?.avatar) {
            avatarUrl = post.user.avatar;
          }
          
            // Handle images - construct full URLs if needed
            let images: string[] | undefined = undefined;
            if (post.images) {
              const imageArray = Array.isArray(post.images) ? post.images : [post.images];
              images = imageArray.map((img: string) => {
                if (!img) return img;
                if (img.startsWith('http://') || img.startsWith('https://')) {
                  return img;
                }
                return `https://www.trendshub.link/storage/${img}`;
              });
            } else if (post.image_urls) {
              const imageArray = Array.isArray(post.image_urls) ? post.image_urls : [post.image_urls];
              images = imageArray.map((img: string) => {
                if (!img) return img;
                if (img.startsWith('http://') || img.startsWith('https://')) {
                  return img;
                }
                return `https://www.trendshub.link/storage/${img}`;
              });
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
            timestamp: post.created_at || post.timestamp || '',
            likes: post.reactions?.length || post.likes || post.likes_count || 0,
            retweets: post.retweets || post.shares_count || 0,
            replies: post.comments?.length || post.replies || post.comments_count || 0,
            liked: post.reactions?.some((r: any) => r.type === 'like') || post.liked || false,
            retweeted: post.retweeted || false,
            bookmarked: post.bookmarked || false,
            poll: post.poll_question ? {
              question: post.poll_question,
              options: post.poll_options 
                ? (Array.isArray(post.poll_options) 
                    ? post.poll_options 
                    : typeof post.poll_options === 'string'
                    ? JSON.parse(post.poll_options)
                    : [])
                : [],
              votes: [],
              duration: post.poll_duration || '1',
              endTime: post.poll_end_date || undefined,
            } : undefined,
          };
        });
      } else if (isDirectArray) {
        convertedTweets = (response.data as any[]).map((item: any) => {
          if (item.caption !== undefined || item.video_url !== undefined) {
            return {
              id: String(item.id),
              user: {
                id: String(item.user?.id || ''),
                name: item.user?.name || '',
                username: item.user?.username || '',
                avatar: item.user?.picture || undefined,
                verified: item.user?.verification !== null || false,
              },
              content: item.caption || '',
              images: item.image_urls ? (Array.isArray(item.image_urls) ? item.image_urls : [item.image_urls]) : undefined,
              timestamp: item.created_at || '',
              likes: item.likes_count || 0,
              retweets: item.shares_count || 0,
              replies: item.comments_count || 0,
              liked: false,
              retweeted: false,
              bookmarked: false,
              poll: undefined,
            };
          } else {
            return {
              id: String(item.id),
              user: {
                id: String(item.user?.id || ''),
                name: item.user?.name || '',
                username: item.user?.username || '',
                avatar: item.user?.picture || item.user?.avatar || undefined,
                verified: item.user?.verification !== null || item.user?.verified || false,
              },
              content: item.text || item.content || '',
              images: item.images ? (Array.isArray(item.images) ? item.images : [item.images]) : undefined,
              timestamp: item.created_at || item.timestamp || '',
              likes: item.reactions?.length || item.likes || item.likes_count || 0,
              retweets: item.retweets || item.shares_count || 0,
              replies: item.comments?.length || item.replies || item.comments_count || 0,
              liked: item.reactions?.some((r: any) => r.type === 'like') || item.liked || false,
              retweeted: item.retweeted || false,
              bookmarked: item.bookmarked || false,
              poll: item.poll_question ? {
                question: item.poll_question,
                options: item.poll_options ? (Array.isArray(item.poll_options) ? item.poll_options : JSON.parse(item.poll_options)) : [],
                votes: [],
                duration: item.poll_duration || '1',
                endTime: item.poll_end_date || undefined,
                endDate: item.poll_end_date || undefined,
              } : undefined,
            };
          }
        });
      } else if (isPostsFormat && response.data.posts) {
        convertedTweets = response.data.posts.map((post: FeedPost) => ({
          id: String(post.id),
          user: {
            id: String(post.user.id),
            name: post.user.name,
            username: post.user.username,
            avatar: post.user.avatar,
            verified: post.user.verified || false,
          },
          content: post.content,
          images: post.images ? (() => {
            const imageArray = Array.isArray(post.images) ? post.images : [post.images];
            return imageArray.map((img: string) => {
              if (!img) return img;
              if (img.startsWith('http://') || img.startsWith('https://')) return img;
              return `https://www.trendshub.link/storage/${img}`;
            });
          })() : undefined,
          timestamp: post.timestamp,
          likes: post.likes,
          retweets: post.retweets,
          replies: post.replies,
          liked: post.liked,
          retweeted: post.retweeted,
          bookmarked: post.bookmarked,
          poll: post.poll,
        }));
      } else if (isTrendFormat && response.data.trend) {
        convertedTweets = response.data.trend.map((post: any) => ({
          id: String(post.id),
          user: {
            id: String(post.user?.id || ''),
            name: post.user?.name || '',
            username: post.user?.username || '',
            avatar: post.user?.picture ? `https://www.trendshub.link/storage/${post.user.picture}` : undefined,
            verified: post.user?.verification !== null || false,
          },
          content: post.text || post.content || '',
          images: post.images ? (() => {
            const imageArray = Array.isArray(post.images) ? post.images : [post.images];
            return imageArray.map((img: string) => {
              if (!img) return img;
              if (img.startsWith('http://') || img.startsWith('https://')) return img;
              return `https://www.trendshub.link/storage/${img}`;
            });
          })() : undefined,
          timestamp: post.created_at || post.timestamp || '',
          likes: post.reactions?.length || post.likes || 0,
          retweets: post.retweets || 0,
          replies: post.comments?.length || post.replies || 0,
          liked: post.reactions?.some((r: any) => r.type === 'like') || post.liked || false,
          retweeted: post.retweeted || false,
          bookmarked: false,
          poll: post.poll_question ? {
            question: post.poll_question,
            options: post.poll_options ? (Array.isArray(post.poll_options) ? post.poll_options : JSON.parse(post.poll_options)) : [],
            votes: [],
            duration: post.poll_duration || '1',
            endTime: post.poll_end_date || undefined,
            endDate: post.poll_end_date || undefined,
          } : undefined,
        }));
      } else if (isBitsFormat && response.data.data) {
          convertedTweets = response.data.data.map((bit: any) => {
            // Handle images/video for bits - check for video_url and media_thumbnail_url
            let images: string[] | undefined = undefined;
            if (bit.image_urls) {
              const imageArray = Array.isArray(bit.image_urls) ? bit.image_urls : [bit.image_urls];
              images = imageArray.map((img: string) => {
                if (!img) return img;
                if (img.startsWith('http://') || img.startsWith('https://')) return img;
                return `https://www.trendshub.link/storage/${img}`;
              });
            } else if (bit.media_thumbnail_url) {
              // For video posts (bits), use thumbnail as image
              const thumbUrl = bit.media_thumbnail_url.startsWith('http://') || bit.media_thumbnail_url.startsWith('https://')
                ? bit.media_thumbnail_url
                : `https://www.trendshub.link/storage/${bit.media_thumbnail_url}`;
              images = [thumbUrl];
            }
          
          return {
            id: String(bit.id),
            user: {
              id: String(bit.user?.id || ''),
              name: bit.user?.name || '',
              username: bit.user?.username || '',
              avatar: bit.user?.picture || undefined,
              verified: bit.user?.verification !== null || false,
            },
            content: bit.caption || '',
            images: images,
            video_file: bit.video_url || undefined, // Add video_file for bits
            timestamp: bit.created_at || '',
            likes: bit.likes_count || 0,
            retweets: bit.shares_count || 0,
            replies: bit.comments_count || 0,
            liked: false,
            retweeted: false,
            bookmarked: false,
            poll: undefined,
          };
        });
      }
      
      if (convertedTweets.length > 0) {
        // Reset tweets to new content (refresh always replaces, doesn't append)
        if (activeTab === 'discover') {
          setDiscoverTweets(convertedTweets);
          setHasLoadedDiscoverCache(true);
        } else {
          setTweets(convertedTweets);
          setHasLoadedFromCache(true);
        }
        setIsLoadingFeed(false);
        
        // Update pagination info from response
        // NOTE: Even if we used a random page for bits feed, we reset to page 1
        // so that infinite scroll continues normally from page 2, 3, etc.
        if (response.data?.current_page !== undefined) {
          const loadedPage = response.data.current_page;
          // Always reset to page 1 after refresh, so next scroll loads page 2
          // This ensures infinite scroll works correctly even if we used a random page
          setCurrentPage(1);
          // Track that we've loaded page 1 (even if we actually loaded a random page)
          setLoadedPages(new Set([1]));
          // console.log('🔄 Loaded random page', loadedPage, 'for variety, but resetting currentPage to 1 for infinite scroll');
        } else {
          // If no current_page info, assume we're on page 1
          setCurrentPage(1);
          setLoadedPages(new Set([1]));
          // console.log('🔄 No current_page info, assuming page 1');
        }
        if (response.data?.last_page !== undefined) {
          setLastPage(response.data.last_page);
          // Since we reset to page 1, check if page 1 < last_page
          setHasMore(1 < response.data.last_page);
          // console.log('🔄 Last page:', response.data.last_page);
          // console.log('🔄 Has more pages:', 1 < response.data.last_page);
        } else {
          // If no last_page info, assume there's more (for bits feed fallback)
          // console.log('🔄 No last_page info, assuming there are more pages');
          setHasMore(true);
          // Set a reasonable default last_page for bits feed
          setLastPage(100); // Assume there are many pages
        }
        
        // Don't cache on refresh - we want fresh content each time
        // Cache is only for initial load
        // Backend uses inRandomOrder(), so each page 1 request returns different random content
        // This means refresh always gets NEW content without needing to track what was seen
        // console.log('✅ ===== REFRESH COMPLETE =====');
        // console.log('✅ Fresh random content loaded from page 1');
        // console.log('✅ Backend uses inRandomOrder() - each refresh gets different random posts');
        // console.log('✅ Total tweets displayed:', convertedTweets.length);
        // console.log('📊 Backend uses inRandomOrder() - each refresh gets different random posts');
      } else {
        setIsLoadingFeed(false);
        setTweets([]); // Clear tweets if no content
      }
    } catch (error) {
      // console.error('Error refreshing feed:', error);
      setIsLoadingFeed(false); // Clear loading state on error
    } finally {
      setIsRefreshing(false);
      window.dispatchEvent(new CustomEvent('feedRendered'));
    }
  };

  // Load cached data on mount (client-side only) to avoid hydration mismatch
  // BUT: Don't use cache if user just refreshed - always get fresh content
  useEffect(() => {
    if (typeof window === 'undefined' || hasLoadedFromCache || (activeTab !== 'for-you' && activeTab !== 'following')) return;
    
    // Detect browser refresh (F5 or reload button)
    // Check if this is a browser refresh by checking performance.navigation or performance.getEntriesByType
    let isBrowserRefresh = false;
    if (typeof window !== 'undefined' && window.performance) {
      // Check legacy navigation API
      if ((window.performance as any).navigation && (window.performance as any).navigation.type === 1) {
        isBrowserRefresh = true;
      }
      // Check Navigation Timing API v2
      try {
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const navEntry = navEntries[0] as any;
          if (navEntry && navEntry.type === 'reload') {
            isBrowserRefresh = true;
          }
        }
      } catch (e) {
        // Navigation Timing API not available, ignore
      }
    }
    
    // Check if this is a page refresh (not initial load)
    // If user refreshed, don't use cache - get fresh content
    const wasRefreshed = sessionStorage.getItem('feed_was_refreshed') === 'true';
    
    if (isBrowserRefresh || wasRefreshed) {
      if (isBrowserRefresh) {
        // console.log('🔄 Browser refresh detected - clearing cache and fetching fresh random content');
        // Clear cache on browser refresh to ensure fresh content
        sessionStorage.removeItem('feed_cache');
        sessionStorage.removeItem('feed_cache_timestamp');
        // Set a flag to use random page for initial load
        sessionStorage.setItem('browser_refresh_random', 'true');
      }
      if (wasRefreshed) {
        sessionStorage.removeItem('feed_was_refreshed');
      }
      // console.log('🔄 Page was refreshed - skipping cache, will fetch fresh content');
      return; // Skip cache, let loadFeed fetch fresh content
    }
    
    try {
      const cacheKey = 'feed_cache';
      const cacheTimestampKey = 'feed_cache_timestamp';
      const CACHE_DURATION = 2 * 60 * 1000; // Reduced to 2 minutes - shorter cache for fresher content
      
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheTimestamp = sessionStorage.getItem(cacheTimestampKey);
      const now = Date.now();
      
      // Use cached data if it exists and is fresh (less than 2 minutes old)
      if (cachedData && cacheTimestamp) {
        const cacheAge = now - parseInt(cacheTimestamp, 10);
        if (cacheAge < CACHE_DURATION) {
          // console.log('✅ Using cached feed data on mount (age:', Math.round(cacheAge / 1000), 'seconds)');
          const parsedTweets = JSON.parse(cachedData);
          if (Array.isArray(parsedTweets) && parsedTweets.length > 0) {
            setTweets(parsedTweets);
            setHasLoadedFromCache(true);
            setLoadedPages(new Set([1])); // Track that we've loaded page 1 from cache
          }
        } else {
          // console.log('⚠️ Cache expired, will fetch fresh content');
        }
      }
    } catch (e) {
      // console.warn('Error reading cache on mount:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // Fetch feed data from API
  useEffect(() => {
    const loadFeed = async () => {
      const token = getAuthToken();
      
      if (activeTab === 'for-you' || activeTab === 'following' || activeTab === 'discover') {
        // Discover tab doesn't require authentication
        if ((activeTab === 'for-you' || activeTab === 'following') && !token) {
          // Not logged in, show empty state
          setTweets([]);
          return;
        }

        // Don't load if refresh is in progress (refreshFeed will handle it)
        if (isRefreshing) {
          return;
        }

        // Check if we should refresh (e.g., after composing a post)
        const shouldRefresh = sessionStorage.getItem('should_refresh_feed') === 'true';
        if (shouldRefresh) {
          // console.log('🔄 should_refresh_feed flag detected - refreshing feed');
          sessionStorage.removeItem('should_refresh_feed');
          // Force refresh by clearing cache and calling refreshFeed
          if (activeTab === 'discover') {
            sessionStorage.removeItem('discover_cache');
            sessionStorage.removeItem('discover_cache_timestamp');
            setHasLoadedDiscoverCache(false);
          } else {
            sessionStorage.removeItem('feed_cache');
            sessionStorage.removeItem('feed_cache_timestamp');
            setHasLoadedFromCache(false);
          }
          refreshFeed(true);
          return;
        }
        
        // Check for cached feed data first (if not already loaded)
        const isDiscover = activeTab === 'discover';
        const cacheKey = isDiscover ? 'discover_cache' : 'feed_cache';
        const cacheTimestampKey = isDiscover ? 'discover_cache_timestamp' : 'feed_cache_timestamp';
        const hasLoadedCache = isDiscover ? hasLoadedDiscoverCache : hasLoadedFromCache;
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        
        if (!hasLoadedCache) {
          try {
            const cachedData = sessionStorage.getItem(cacheKey);
            const cacheTimestamp = sessionStorage.getItem(cacheTimestampKey);
            const now = Date.now();
            
            // Use cached data if it exists and is fresh (less than 5 minutes old)
            if (cachedData && cacheTimestamp) {
              const cacheAge = now - parseInt(cacheTimestamp, 10);
              if (cacheAge < CACHE_DURATION) {
                // console.log(`✅ Using cached ${activeTab} feed data (age:`, Math.round(cacheAge / 1000), 'seconds)');
                const parsedTweets = JSON.parse(cachedData);
                if (Array.isArray(parsedTweets) && parsedTweets.length > 0) {
                  if (isDiscover) {
                    setDiscoverTweets(parsedTweets);
                    setHasLoadedDiscoverCache(true);
                  } else {
                    setTweets(parsedTweets);
                    setHasLoadedFromCache(true);
                  }
                  setIsLoadingFeed(false);
                  return; // Use cached data, don't fetch
                }
              } else {
                // console.log(`⚠️ Cached ${activeTab} feed data expired, fetching fresh data`);
              }
            }
          } catch (e) {
            // console.warn('Error reading cache:', e);
          }
        } else {
          // Already loaded from cache, skip fetching
          setIsLoadingFeed(false);
          return;
        }

        setIsLoadingFeed(true);
        try {
          // Determine feed type first, before any console.log statements that might reference it
          let feedType: 'for-you' | 'following' | 'trending' = 'for-you';
          if (activeTab === 'following') {
            feedType = 'following';
          } else if (activeTab === 'discover') {
            feedType = 'trending';
          }
          
          // Check if this is a browser refresh - if so, use random page for variety
          const isBrowserRefreshRandom = sessionStorage.getItem('browser_refresh_random') === 'true';
          let pageToLoad = hasLoadedCache ? currentPage : 1;
          
          // On browser refresh, use a random page (1-20) to ensure different content
          // This works especially well for bits feed fallback which doesn't use inRandomOrder()
          // Don't remove the flag yet - we need it later for pagination logic
          if (isBrowserRefreshRandom && activeTab === 'for-you' && !hasLoadedCache) {
            const randomPage = Math.floor(Math.random() * 20) + 1;
            pageToLoad = randomPage;
            // console.log('🔄 Browser refresh detected - using random page', randomPage, 'for fresh content');
          }
          
          if (activeTab === 'for-you') {
            // console.log('📰 ===== LOADING FOR YOU FEED =====');
            // console.log('📰 Tab: For You');
            // console.log('📰 Page:', pageToLoad, isBrowserRefreshRandom ? '(random for browser refresh)' : '');
            // console.log('📰 Endpoint: /api/v1/for-you-trends?page=' + pageToLoad + '&pageSize=20');
          } else if (activeTab === 'following') {
            // console.log('👥 ===== LOADING FOLLOWING FEED =====');
            // console.log('👥 Tab: Following');
            // console.log('👥 Page:', pageToLoad);
            // console.log('👥 Endpoint: /api/v1/following?page=' + pageToLoad + '&pageSize=20');
          } else if (activeTab === 'discover') {
            // console.log('🔍 ===== LOADING DISCOVER FEED =====');
            // console.log('🔍 Tab: Discover');
            // console.log('🔍 Page:', pageToLoad);
            // console.log('🔍 Endpoint: /api/v1/trending?page=' + pageToLoad + '&pageSize=20');
          }
          
          // console.log('🔍 DEBUG: Active Tab:', activeTab);
          // console.log('🔍 DEBUG: Feed Type:', feedType);
          
          let response = await fetchFeed(feedType, pageToLoad, 20);
          
          // If for-you returns 404, try fetch-bits-for-you as fallback with pagination
          if (response.status === 404) {
            // console.warn('⚠️ /api/v1/for-you returned 404, trying fetch-bits-for-you as fallback...');
            // If browser refresh, we already have a random page, use it
            // Otherwise, use pageToLoad (which is 1 for initial load)
            const bitsResponse = await fetchBitsForYou(pageToLoad, 20);
            if (bitsResponse.status === 200 && bitsResponse.data) {
              // console.log('✅ Using bits feed as fallback with pagination (page', pageToLoad, ')');
              response = bitsResponse;
            }
          }
          
          // console.log('=== Feed Component: Feed Response ===');
          // console.log('Response Status:', response.status);
          // console.log('Response Data:', JSON.stringify(response.data, null, 2));
          // console.log('Response Error:', response.error);
          // console.log('Response Data Type:', typeof response.data);
          // console.log('Response Data Keys:', response.data ? Object.keys(response.data) : 'null');
          
          // Check if response has posts array (normal feed) or data array (bits feed or backend format)
          // Backend returns: { data: [...], current_page, last_page, success }
          // Handle case where response.data itself might be an array (direct array response)
          const isDirectArray = Array.isArray(response.data);
          const isDataFormat = Array.isArray(response.data?.data); // Backend format: { data: [...] }
          const isBitsFormat = isDataFormat && response.data.data.some((item: any) => item.video_url || item.caption !== undefined);
          const isPostsFormat = Array.isArray(response.data?.posts);
          const isTrendFormat = Array.isArray(response.data?.trend);
          
          // console.log('Is Direct Array:', isDirectArray);
          // console.log('Is Data Format (backend):', isDataFormat);
          // console.log('Is Bits Format:', isBitsFormat);
          // console.log('Is Posts Format:', isPostsFormat);
          // console.log('Is Trend Format:', isTrendFormat);
          
          let convertedTweets: Tweet[] = [];
          
          // Handle backend format: { data: [...], current_page, last_page, success }
          if (isDataFormat && !isBitsFormat) {
            if (activeTab === 'for-you') {
              // console.log('📰 Processing backend FeedResource format');
              // console.log('📰 Posts count from backend:', response.data.data.length);
              // console.log('📰 Current page:', response.data.current_page);
              // console.log('📰 Last page:', response.data.last_page);
            }
            convertedTweets = response.data.data.map((post: any) => {
              // Handle avatar URL construction
              let avatarUrl: string | undefined = undefined;
              if (post.user?.picture) {
                if (post.user.picture.startsWith('http')) {
                  avatarUrl = post.user.picture;
                } else {
                  avatarUrl = `https://www.trendshub.link/storage/${post.user.picture}`;
                }
              } else if (post.user?.avatar) {
                avatarUrl = post.user.avatar;
              }
              
              // Handle images - construct full URLs if needed
              let images: string[] | undefined = undefined;
              
              // Debug logging for discover tab
              if (activeTab === 'discover' || activeTab === 'following') {
                // console.log('🔍 DEBUG: Post ID:', post.id);
                // console.log('🔍 DEBUG: Post images:', post.images);
                // console.log('🔍 DEBUG: Post image_urls:', post.image_urls);
                // console.log('🔍 DEBUG: Post video:', post.video);
                // console.log('🔍 DEBUG: Post videoThumbnail:', post.videoThumbnail);
                // console.log('🔍 DEBUG: Post background:', post.background);
              }
              
              // Check multiple possible image field names
              // Handle images field (can be string, array, JSON string, or null)
              if (post.images && post.images !== null) {
                let imageArray: any[] = [];
                
                // Try to parse if it's a JSON string
                if (typeof post.images === 'string') {
                  try {
                    const parsed = JSON.parse(post.images);
                    imageArray = Array.isArray(parsed) ? parsed : [parsed];
                  } catch (e) {
                    // Not JSON, treat as single string
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
                    const fullUrl = `https://www.trendshub.link/storage/${img}`;
                    if (activeTab === 'discover' || activeTab === 'following') {
                      // console.log('🔍 DEBUG: Converting image URL:', img, '→', fullUrl);
                    }
                    return fullUrl;
                  });
                if (images && images.length === 0) images = undefined;
              } else if (post.image_urls && post.image_urls !== null) {
                const imageArray = Array.isArray(post.image_urls) ? post.image_urls : [post.image_urls];
                images = imageArray
                  .filter((img: any) => img !== null && img !== undefined && img !== '')
                  .map((img: string) => {
                    if (img.startsWith('http://') || img.startsWith('https://')) {
                      return img;
                    }
                    const fullUrl = `https://www.trendshub.link/storage/${img}`;
                    if (activeTab === 'discover' || activeTab === 'following') {
                      // console.log('🔍 DEBUG: Converting image_urls URL:', img, '→', fullUrl);
                    }
                    return fullUrl;
                  });
                if (images && images.length === 0) images = undefined;
              } else if (post.videoThumbnail && post.videoThumbnail !== null) {
                // Use video thumbnail as image
                const thumbUrl = post.videoThumbnail.startsWith('http://') || post.videoThumbnail.startsWith('https://')
                  ? post.videoThumbnail
                  : `https://www.trendshub.link/storage/${post.videoThumbnail}`;
                images = [thumbUrl];
                if (activeTab === 'discover' || activeTab === 'following') {
                  // console.log('🔍 DEBUG: Using videoThumbnail as image:', thumbUrl);
                }
              } else if (post.video && post.video !== null) {
                // If there's a video but no thumbnail, we might want to show a placeholder
                // For now, we'll leave images as undefined and let the video be handled separately
                if (activeTab === 'discover' || activeTab === 'following') {
                  // console.log('🔍 DEBUG: Post has video but no thumbnail:', post.video);
                }
              } else if (post.background && post.background !== null) {
                // Use background as image
                const bgUrl = post.background.startsWith('http://') || post.background.startsWith('https://')
                  ? post.background
                  : `https://www.trendshub.link/storage/${post.background}`;
                images = [bgUrl];
                if (activeTab === 'discover' || activeTab === 'following') {
                  // console.log('🔍 DEBUG: Using background as image:', bgUrl);
                }
              } else if (post.media && post.media !== null) {
                // Check for media field (could be array of objects with url property)
                const mediaArray = Array.isArray(post.media) ? post.media : [post.media];
                images = mediaArray
                  .map((media: any) => {
                    const img = typeof media === 'string' ? media : (media?.url || media?.image_url || media?.src);
                    if (!img || img === null || img === '') return null;
                    if (img.startsWith('http://') || img.startsWith('https://')) {
                      return img;
                    }
                    const fullUrl = `https://www.trendshub.link/storage/${img}`;
                    if (activeTab === 'discover' || activeTab === 'following') {
                      // console.log('🔍 DEBUG: Converting media URL:', img, '→', fullUrl);
                    }
                    return fullUrl;
                  })
                  .filter((img: string | null) => img !== null) as string[];
                if (images.length === 0) images = undefined;
              } else if (post.media_urls && post.media_urls !== null) {
                const imageArray = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
                images = imageArray
                  .filter((img: any) => img !== null && img !== undefined && img !== '')
                  .map((img: string) => {
                    if (img.startsWith('http://') || img.startsWith('https://')) {
                      return img;
                    }
                    const fullUrl = `https://www.trendshub.link/storage/${img}`;
                    if (activeTab === 'discover' || activeTab === 'following') {
                      // console.log('🔍 DEBUG: Converting media_urls URL:', img, '→', fullUrl);
                    }
                    return fullUrl;
                  });
                if (images && images.length === 0) images = undefined;
              }
              
              if (activeTab === 'discover' || activeTab === 'following') {
                // console.log('🔍 DEBUG: Final images array:', images);
                // console.log('🔍 DEBUG: Images array length:', images?.length || 0);
              }
              
              const convertedTweet = {
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
                timestamp: post.created_at || post.timestamp || '',
                likes: post.reactions?.length || post.likes || post.likes_count || 0,
                retweets: post.retweets || post.shares_count || 0,
                replies: post.comments?.length || post.replies || post.comments_count || 0,
                liked: post.reactions?.some((r: any) => r.type === 'like') || post.liked || false,
                retweeted: post.retweeted || false,
                bookmarked: post.bookmarked || false,
                poll: post.poll_question ? {
                  question: post.poll_question,
                  options: post.poll_options 
                    ? (Array.isArray(post.poll_options) 
                        ? post.poll_options 
                        : typeof post.poll_options === 'string'
                        ? JSON.parse(post.poll_options)
                        : [])
                    : [],
                  votes: [],
                  endDate: post.poll_end_date || undefined,
                } : undefined,
              };
              
              if (activeTab === 'discover' || activeTab === 'following') {
                // console.log('🔍 DEBUG: Converted tweet:', {
                //   id: convertedTweet.id,
                //   hasImages: !!convertedTweet.images,
                //   imagesCount: convertedTweet.images?.length || 0,
                //   firstImage: convertedTweet.images?.[0]
                // });
              }
              
              return convertedTweet;
            });
          } else if (isDirectArray) {
            // Response is directly an array (unlikely but handle it)
            // console.log('Processing direct array format, count:', response.data.length);
            convertedTweets = (response.data as any[]).map((item: any) => {
              // Try to detect if it's a bit or post
              if (item.caption !== undefined || item.video_url !== undefined) {
                // It's a bit
                return {
                  id: String(item.id),
                  user: {
                    id: String(item.user?.id || ''),
                    name: item.user?.name || '',
                    username: item.user?.username || '',
                    avatar: item.user?.picture || undefined,
                    verified: item.user?.verification !== null || false,
                  },
                  content: item.caption || '',
                  images: item.image_urls ? (() => {
                    const imageArray = Array.isArray(item.image_urls) ? item.image_urls : [item.image_urls];
                    return imageArray.map((img: string) => {
                      if (!img) return img;
                      if (img.startsWith('http://') || img.startsWith('https://')) return img;
                      return `https://www.trendshub.link/storage/${img}`;
                    });
                  })() : undefined,
                  timestamp: item.created_at || '',
                  likes: item.likes_count || 0,
                  retweets: item.shares_count || 0,
                  replies: item.comments_count || 0,
                  liked: false,
                  retweeted: false,
                  bookmarked: false,
                  poll: undefined,
                };
              } else {
                // It's a post
                return {
                  id: String(item.id),
                  user: {
                    id: String(item.user?.id || ''),
                    name: item.user?.name || '',
                    username: item.user?.username || '',
                    avatar: item.user?.picture || item.user?.avatar || undefined,
                    verified: item.user?.verification !== null || item.user?.verified || false,
                  },
                  content: item.text || item.content || '',
                  images: item.images ? (() => {
                    const imageArray = Array.isArray(item.images) ? item.images : [item.images];
                    return imageArray.map((img: string) => {
                      if (!img) return img;
                      if (img.startsWith('http://') || img.startsWith('https://')) return img;
                      return `https://www.trendshub.link/storage/${img}`;
                    });
                  })() : undefined,
                  timestamp: item.created_at || item.timestamp || '',
                  likes: item.reactions?.length || item.likes || item.likes_count || 0,
                  retweets: item.retweets || item.shares_count || 0,
                  replies: item.comments?.length || item.replies || item.comments_count || 0,
                  liked: item.reactions?.some((r: any) => r.type === 'like') || item.liked || false,
                  retweeted: item.retweeted || false,
                  bookmarked: item.bookmarked || false,
                  poll: item.poll_question ? {
                    question: item.poll_question,
                    options: item.poll_options ? (Array.isArray(item.poll_options) ? item.poll_options : JSON.parse(item.poll_options)) : [],
                    votes: [],
                    duration: item.poll_duration || '1',
                    endTime: item.poll_end_date || undefined,
                    endDate: item.poll_end_date || undefined,
                  } : undefined,
                };
              }
            });
          } else if (isPostsFormat && response.data.posts) {
            // Normal feed format: { posts: [...] }
            // console.log('Processing posts format, count:', response.data.posts.length);
            convertedTweets = response.data.posts.map((post: FeedPost) => ({
              id: String(post.id),
              user: {
                id: String(post.user.id),
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
              liked: post.liked,
              retweeted: post.retweeted,
              bookmarked: post.bookmarked,
              poll: post.poll,
            }));
          } else if (isTrendFormat && response.data.trend) {
            // Trend format: { trend: [...] }
            // console.log('Processing trend format, count:', response.data.trend.length);
            convertedTweets = response.data.trend.map((post: any) => ({
              id: String(post.id),
              user: {
                id: String(post.user?.id || ''),
                name: post.user?.name || '',
                username: post.user?.username || '',
                avatar: post.user?.picture ? `https://www.trendshub.link/storage/${post.user.picture}` : undefined,
                verified: post.user?.verification !== null || false,
              },
              content: post.text || post.content || '',
          images: post.images ? (() => {
            const imageArray = Array.isArray(post.images) ? post.images : [post.images];
            return imageArray.map((img: string) => {
              if (!img) return img;
              if (img.startsWith('http://') || img.startsWith('https://')) return img;
              return `https://www.trendshub.link/storage/${img}`;
            });
          })() : undefined,
          timestamp: post.created_at || post.timestamp || '',
          likes: post.reactions?.length || post.likes || 0,
              retweets: post.retweets || 0,
              replies: post.comments?.length || post.replies || 0,
              liked: post.reactions?.some((r: any) => r.type === 'like') || post.liked || false,
              retweeted: post.retweeted || false,
              bookmarked: post.bookmarked || false,
              poll: post.poll_question ? {
                question: post.poll_question,
                options: post.poll_options ? (Array.isArray(post.poll_options) ? post.poll_options : JSON.parse(post.poll_options)) : [],
                votes: [],
                endDate: post.poll_end_date || undefined,
              } : undefined,
            }));
          } else if (isBitsFormat && response.data.data) {
            // Bits format: { data: [...] }
            // console.log('Processing bits format, count:', response.data.data.length);
            // console.log('First bit sample:', JSON.stringify(response.data.data[0], null, 2));
            convertedTweets = response.data.data.map((bit: any) => {
              // Handle images/video for bits - check for video_url and media_thumbnail_url
              let images: string[] | undefined = undefined;
              if (bit.image_urls) {
                const imageArray = Array.isArray(bit.image_urls) ? bit.image_urls : [bit.image_urls];
                images = imageArray.map((img: string) => {
                  if (!img) return img;
                  if (img.startsWith('http://') || img.startsWith('https://')) return img;
                  return `https://www.trendshub.link/storage/${img}`;
                });
              } else if (bit.media_thumbnail_url) {
                // For video posts (bits), use thumbnail as image
                const thumbUrl = bit.media_thumbnail_url.startsWith('http://') || bit.media_thumbnail_url.startsWith('https://')
                  ? bit.media_thumbnail_url
                  : `https://www.trendshub.link/storage/${bit.media_thumbnail_url}`;
                images = [thumbUrl];
              }
              
              return {
                id: String(bit.id),
                user: {
                  id: String(bit.user?.id || ''),
                  name: bit.user?.name || '',
                  username: bit.user?.username || '',
                  avatar: bit.user?.picture || undefined,
                  verified: bit.user?.verification !== null || false,
                },
                content: bit.caption || '',
                images: images,
                video_file: bit.video_url || undefined, // Add video_file for bits
                timestamp: bit.created_at || '',
                likes: bit.likes_count || 0,
                retweets: bit.shares_count || 0,
                replies: bit.comments_count || 0,
                liked: false, // Bits don't have liked status in response
                retweeted: false,
                bookmarked: false,
                poll: undefined,
              };
            });
          } else {
            // console.warn('⚠️ Unknown response format. Response data:', response.data);
            // console.warn('Response data type:', typeof response.data);
            if (response.data) {
              // console.warn('Response data keys:', Object.keys(response.data));
            }
          }
          
          // console.log('Converted Tweets Count:', convertedTweets.length);
          // console.log('Converted Tweets Sample (first 2):', JSON.stringify(convertedTweets.slice(0, 2), null, 2));
          
          if (convertedTweets.length > 0) {
            if (activeTab === 'for-you') {
              // console.log('📰 Setting tweets, count:', convertedTweets.length);
            } else if (activeTab === 'following') {
              // console.log('👥 Setting tweets, count:', convertedTweets.length);
            } else if (activeTab === 'discover') {
              // console.log('🔍 Setting discover tweets, count:', convertedTweets.length);
            }
            
            // Check if this is an initial load (not pagination)
            // If we used a random page for browser refresh, we still want to replace (not append)
            const isInitialLoad = !hasLoadedCache && (pageToLoad === 1 || isBrowserRefreshRandom);
            
            if (isDiscover) {
              // Discover tab - always replace (no pagination for now)
              setDiscoverTweets(convertedTweets);
              setHasLoadedDiscoverCache(true);
              // Cache discover feed
              try {
                sessionStorage.setItem('discover_cache', JSON.stringify(convertedTweets));
                sessionStorage.setItem('discover_cache_timestamp', Date.now().toString());
                // console.log('🔍 Cached discover feed data');
              } catch (e) {
                // console.warn('Error caching discover feed data:', e);
              }
            } else if (isInitialLoad) {
              // Replace tweets for initial load (including browser refresh with random page)
              setTweets(convertedTweets);
              if (activeTab === 'for-you') {
                if (isBrowserRefreshRandom) {
                  // console.log('📰 Replaced all tweets with random page', pageToLoad, 'content (browser refresh)');
                } else {
                  // console.log('📰 Replaced all tweets with page 1 content');
                }
              } else if (activeTab === 'following') {
                // console.log('👥 Replaced all tweets with page 1 content');
              }
            } else {
              // Append for pagination - deduplicate by filtering out items that already exist
              setTweets(prev => {
                const existingIds = new Set(prev.map(t => t.id));
                const newTweets = convertedTweets.filter(t => !existingIds.has(t.id));
                const combined = [...prev, ...newTweets];
                if (activeTab === 'for-you') {
                  // console.log('📰 Appended', newTweets.length, 'new tweets (filtered', convertedTweets.length - newTweets.length, 'duplicates). Total now:', combined.length);
                } else if (activeTab === 'following') {
                  // console.log('👥 Appended', newTweets.length, 'new tweets (filtered', convertedTweets.length - newTweets.length, 'duplicates). Total now:', combined.length);
                }
                return combined;
              });
            }
            
            // Update pagination state
            // NOTE: If we used a random page for browser refresh, reset to page 1 for infinite scroll
            if (response.data?.current_page !== undefined) {
              const loadedPage = response.data.current_page;
              
              // If browser refresh used a random page, reset to page 1 so infinite scroll continues normally
              if (isBrowserRefreshRandom && isInitialLoad) {
                setCurrentPage(1);
                setLoadedPages(new Set([1]));
                if (activeTab === 'for-you') {
                  // console.log('📰 Loaded random page', loadedPage, 'for variety, but resetting currentPage to 1 for infinite scroll');
                }
              } else {
                setCurrentPage(loadedPage);
                // Track loaded page
                setLoadedPages(prev => {
                  const newSet = new Set([...prev, loadedPage]);
                  if (activeTab === 'for-you') {
                    // console.log('📰 Loaded pages so far:', Array.from(newSet));
                  }
                  return newSet;
                });
                if (activeTab === 'for-you') {
                  // console.log('📰 Updated current page to:', loadedPage);
                }
              }
            }
            if (response.data?.last_page !== undefined) {
              setLastPage(response.data.last_page);
              // If browser refresh used random page, we reset to page 1, so check 1 < last_page
              const currentPageForCheck = (isBrowserRefreshRandom && isInitialLoad) ? 1 : response.data.current_page;
              const hasMorePages = currentPageForCheck < response.data.last_page;
              setHasMore(hasMorePages);
              if (activeTab === 'for-you') {
                // console.log('📰 Last page:', response.data.last_page);
                // console.log('📰 Has more pages:', hasMorePages);
              }
            } else {
              // If no last_page info, assume there's more (for bits feed fallback)
              if (activeTab === 'for-you') {
                // console.log('📰 No last_page info, assuming there are more pages');
              }
              setHasMore(true);
              // Set a reasonable default last_page for bits feed
              if (!response.data?.last_page) {
                setLastPage(100); // Assume there are many pages
              }
            }
            
            // Clear browser refresh flag after processing (if it was set)
            if (isBrowserRefreshRandom) {
              sessionStorage.removeItem('browser_refresh_random');
            }
            
            // Cache the feed data (only for first page, not for random pages on browser refresh)
            if (pageToLoad === 1 && !isBrowserRefreshRandom && !isDiscover) {
              try {
                sessionStorage.setItem('feed_cache', JSON.stringify(convertedTweets));
                sessionStorage.setItem('feed_cache_timestamp', Date.now().toString());
                if (activeTab === 'for-you') {
                  // console.log('📰 Cached feed data for future loads');
                } else if (activeTab === 'following') {
                  // console.log('👥 Cached feed data for future loads');
                }
              } catch (e) {
                // console.warn('Error caching feed data:', e);
              }
            }
            
            if (activeTab === 'for-you') {
              // console.log('✅ ===== FOR YOU FEED LOADED =====');
            } else if (activeTab === 'following') {
              // console.log('✅ ===== FOLLOWING FEED LOADED =====');
            } else if (activeTab === 'discover') {
              // console.log('✅ ===== DISCOVER FEED LOADED =====');
            }
          } else {
            // console.warn('⚠️ No posts/bits found in response');
            // console.warn('Response data was:', JSON.stringify(response.data, null, 2));
            
            // Only set empty array if we don't have cached data
            const cachedData = sessionStorage.getItem('feed_cache');
            if (!cachedData) {
              setTweets([]);
            } else {
              // Use cached data even if API returns empty
              try {
                const parsedTweets = JSON.parse(cachedData);
                if (Array.isArray(parsedTweets) && parsedTweets.length > 0) {
                  // console.log('✅ Using cached data instead of empty response');
                  setTweets(parsedTweets);
          } else {
            setTweets([]);
                }
              } catch (e) {
                setTweets([]);
              }
            }
          }
        } catch (error) {
          // console.error('=== Feed Component: Error ===');
          // console.error('Error fetching feed:', error);
          // console.error('Error details:', error instanceof Error ? error.message : String(error));
          
          // On error, try to use cached data
          try {
            const cachedData = sessionStorage.getItem('feed_cache');
            if (cachedData) {
              const parsedTweets = JSON.parse(cachedData);
              if (Array.isArray(parsedTweets) && parsedTweets.length > 0) {
                // console.log('✅ Using cached data after error');
                setTweets(parsedTweets);
                setIsLoadingFeed(false);
                return;
              }
            }
          } catch (e) {
            // console.warn('Error reading cache after error:', e);
          }
          
          setTweets([]);
        } finally {
          setIsLoadingFeed(false);
          // console.log('=== Feed Component: Loading Complete ===');
        }
      }
    };

    // Load feed for all tabs
    if (activeTab === 'for-you' || activeTab === 'following' || activeTab === 'discover') {
      loadFeed();
    }
  }, [activeTab, hasLoadedFromCache, hasLoadedDiscoverCache]);

  // Function to load more content (infinite scroll)
  const loadMore = async () => {
    const token = getAuthToken();
    // Discover tab doesn't require auth, but following and for-you do
    if ((activeTab === 'for-you' || activeTab === 'following') && !token) {
      return;
    }
    if (activeTab !== 'for-you' && activeTab !== 'following' && activeTab !== 'discover') {
      return;
    }
    if (isLoadingMore || !hasMore || isRefreshing) {
      return;
    }

    // Find next page that hasn't been loaded yet
    // Since backend uses random order, each page is different, but we still track to avoid duplicates
    let nextPage = currentPage + 1;
    
    // Skip pages we've already loaded (shouldn't happen with random order, but safety check)
    while (loadedPages.has(nextPage) && nextPage <= lastPage) {
      nextPage++;
    }
    
    if (nextPage > lastPage) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    try {
      // Determine feed type based on active tab
      let feedType: 'for-you' | 'following' | 'trending' = 'for-you';
      if (activeTab === 'following') {
        feedType = 'following';
        // console.log('👥 ===== LOADING MORE FOLLOWING FEED =====');
        // console.log('👥 Loading page:', nextPage);
        // console.log('👥 Endpoint: /api/v1/following?page=' + nextPage + '&pageSize=20');
      } else if (activeTab === 'discover') {
        feedType = 'trending';
        // console.log('🔍 ===== LOADING MORE DISCOVER FEED =====');
        // console.log('🔍 Loading page:', nextPage);
        // console.log('🔍 Endpoint: /api/v1/trending?page=' + nextPage + '&pageSize=20');
      } else {
        // console.log('📜 ===== LOADING MORE FOR YOU FEED =====');
        // console.log('📜 Loading page:', nextPage);
        // console.log('📜 Endpoint: /api/v1/for-you-trends?page=' + nextPage + '&pageSize=20');
        // console.log('📜 Backend uses inRandomOrder() - this page will have different random content');
      }
      // console.log('Current page:', currentPage);
      // console.log('Last page:', lastPage);
      
      let response = await fetchFeed(feedType, nextPage, 20);
      
      if (response.status === 404) {
        // console.warn('⚠️ /api/v1/for-you returned 404, trying fetch-bits-for-you as fallback with pagination...');
        const bitsResponse = await fetchBitsForYou(nextPage, 20); // Use nextPage for infinite scroll
        if (bitsResponse.status === 200 && bitsResponse.data) {
          // console.log('✅ Using bits feed as fallback with pagination for page', nextPage);
          response = bitsResponse;
        }
      }

      if (response.status === 200 && response.data) {
        // Process response (same conversion logic as loadFeed)
        const isDataFormat = Array.isArray(response.data?.data);
        const isBitsFormat = isDataFormat && response.data.data.some((item: any) => item.video_url || item.caption !== undefined);
        const isPostsFormat = Array.isArray(response.data?.posts);
        const isTrendFormat = Array.isArray(response.data?.trend);
        
        let convertedTweets: Tweet[] = [];
        
        // Use same conversion logic as loadFeed
        if (isDataFormat && !isBitsFormat) {
          convertedTweets = response.data.data.map((post: any) => {
            let avatarUrl: string | undefined = undefined;
            if (post.user?.picture) {
              avatarUrl = post.user.picture.startsWith('http') 
                ? post.user.picture 
                : `https://www.trendshub.link/storage/${post.user.picture}`;
            } else if (post.user?.avatar) {
              avatarUrl = post.user.avatar;
            }
            
            let images: string[] | undefined = undefined;
            
            // Handle images field (can be string, array, JSON string, or null)
            if (post.images && post.images !== null) {
              let imageArray: any[] = [];
              
              // Try to parse if it's a JSON string
              if (typeof post.images === 'string') {
                try {
                  const parsed = JSON.parse(post.images);
                  imageArray = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                  // Not JSON, treat as single string
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
                  if (img.startsWith('http://') || img.startsWith('https://')) return img;
                  return `https://www.trendshub.link/storage/${img}`;
                });
              if (images.length === 0) images = undefined;
            } else if (post.image_urls && post.image_urls !== null) {
              const imageArray = Array.isArray(post.image_urls) ? post.image_urls : [post.image_urls];
              images = imageArray
                .filter((img: any) => img !== null && img !== undefined && img !== '' && img !== 'null')
                .map((img: string) => {
                  if (img.startsWith('http://') || img.startsWith('https://')) return img;
                  return `https://www.trendshub.link/storage/${img}`;
                });
              if (images && images.length === 0) images = undefined;
            } else if (post.videoThumbnail && post.videoThumbnail !== null) {
              const thumbUrl = post.videoThumbnail.startsWith('http://') || post.videoThumbnail.startsWith('https://')
                ? post.videoThumbnail
                : `https://www.trendshub.link/storage/${post.videoThumbnail}`;
              images = [thumbUrl];
            } else if (post.background && post.background !== null) {
              const bgUrl = post.background.startsWith('http://') || post.background.startsWith('https://')
                ? post.background
                : `https://www.trendshub.link/storage/${post.background}`;
              images = [bgUrl];
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
              timestamp: post.created_at || post.timestamp || '',
              likes: post.reactions?.length || post.likes || post.likes_count || 0,
              retweets: post.retweets || post.shares_count || 0,
              replies: post.comments?.length || post.replies || post.comments_count || 0,
              liked: post.reactions?.some((r: any) => r.type === 'like') || post.liked || false,
              retweeted: post.retweeted || false,
              bookmarked: post.bookmarked || false,
              poll: post.poll_question ? {
                question: post.poll_question,
                options: post.poll_options 
                  ? (Array.isArray(post.poll_options) 
                      ? post.poll_options 
                      : typeof post.poll_options === 'string'
                      ? JSON.parse(post.poll_options)
                      : [])
                  : [],
                votes: [],
                endDate: post.poll_end_date || undefined,
              } : undefined,
            };
          });
        } else if (isBitsFormat && response.data.data) {
          convertedTweets = response.data.data.map((bit: any) => {
            let images: string[] | undefined = undefined;
            if (bit.image_urls) {
              const imageArray = Array.isArray(bit.image_urls) ? bit.image_urls : [bit.image_urls];
              images = imageArray.map((img: string) => {
                if (!img) return img;
                if (img.startsWith('http://') || img.startsWith('https://')) return img;
                return `https://www.trendshub.link/storage/${img}`;
              });
            } else if (bit.media_thumbnail_url) {
              const thumbUrl = bit.media_thumbnail_url.startsWith('http://') || bit.media_thumbnail_url.startsWith('https://')
                ? bit.media_thumbnail_url
                : `https://www.trendshub.link/storage/${bit.media_thumbnail_url}`;
              images = [thumbUrl];
            }
            
            return {
              id: String(bit.id),
              user: {
                id: String(bit.user?.id || ''),
                name: bit.user?.name || '',
                username: bit.user?.username || '',
                avatar: bit.user?.picture || undefined,
                verified: bit.user?.verification !== null || false,
              },
              content: bit.caption || '',
              images: images,
              video_file: bit.video_url || undefined,
              timestamp: bit.created_at || '',
              likes: bit.likes_count || 0,
              retweets: bit.shares_count || 0,
              replies: bit.comments_count || 0,
              liked: false,
              retweeted: false,
              bookmarked: false,
              poll: undefined,
            };
          });
        }
        
        if (convertedTweets.length > 0) {
          // Append new tweets - handle discover tab separately
          // Deduplicate by filtering out items that already exist
          if (activeTab === 'discover') {
            setDiscoverTweets(prev => {
              const existingIds = new Set(prev.map(t => t.id));
              const newTweets = convertedTweets.filter(t => !existingIds.has(t.id));
              return [...prev, ...newTweets];
            });
          } else {
            setTweets(prev => {
              const existingIds = new Set(prev.map(t => t.id));
              const newTweets = convertedTweets.filter(t => !existingIds.has(t.id));
              return [...prev, ...newTweets];
            });
          }
          
          // Update pagination state
          if (response.data?.current_page !== undefined) {
            const loadedPage = response.data.current_page;
            setCurrentPage(loadedPage);
            // Track that we've loaded this page
            setLoadedPages(prev => {
              const newSet = new Set([...prev, loadedPage]);
              // console.log('📜 Loaded pages:', Array.from(newSet));
              return newSet;
            });
            // console.log('📜 Updated current page to:', loadedPage);
          }
          if (response.data?.last_page !== undefined) {
            setLastPage(response.data.last_page);
            const hasMorePages = response.data.current_page < response.data.last_page;
            setHasMore(hasMorePages);
            // console.log('📜 Last page:', response.data.last_page);
            // console.log('📜 Has more:', hasMorePages);
          } else {
            // If no last_page info, assume there's more (for bits feed fallback)
            // console.log('📜 No last_page info, assuming there are more pages');
            setHasMore(true);
          }
        } else {
          setHasMore(false);
          // console.log('⚠️ No tweets in response, setting hasMore to false');
        }
        
        // console.log('✅ Loaded more content from page', nextPage, '- Total loaded pages:', Array.from(loadedPages));
      }
    } catch (error) {
      // console.error('Error loading more feed:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll: detect when user scrolls near bottom
  useEffect(() => {
    if (activeTab !== 'for-you' && activeTab !== 'following' && activeTab !== 'discover') {
      return;
    }
    if (!hasMore || isLoadingMore || isRefreshing) {
      return;
    }

    const handleScroll = () => {
      // Check if user is near bottom (within 500px)
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more when user is 500px from bottom
      if (documentHeight - (scrollTop + windowHeight) < 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, hasMore, isLoadingMore, isRefreshing, currentPage, lastPage]);

  useEffect(() => {
    // Update activeTab when initialTab prop changes (e.g., from URL params)
    // Use useEffect to avoid hydration mismatch
    if (typeof window !== 'undefined') {
    setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    // Get current user's username from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.username) {
          setCurrentUsername(user.username);
        }
      } catch (e) {
        // Invalid JSON
      }
    }
  }, []);

  const handleProfileClick = () => {
    if (currentUsername) {
      router.push(`/profile/${currentUsername}`);
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === 'for-you' || tab === 'following') {
      // Check authentication when trying to access For You or Following tab
      const token = getAuthToken();
      if (!token) {
        // Not authenticated, redirect to login with return URL
        const returnUrl = encodeURIComponent('/?tab=discover');
        router.push(`/login?returnUrl=${returnUrl}`);
        return;
      }
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    // Trigger a custom event when feed is rendered
    const event = new CustomEvent('feedRendered');
    window.dispatchEvent(event);
  }, [tweets]);

  useEffect(() => {
    // Show floating button when scrolling
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      setShowFloatingButton(scrollY > 200); // Show after scrolling 200px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleComposeClick = () => {
    router.push('/compose');
  };

  // Don't show empty state while loading
  // if (!tweets || tweets.length === 0) {
  //   return (
  //     <div className="w-full max-w-2xl mx-auto lg:max-w-[600px] p-8 text-center text-muted-foreground">
  //       <p>No posts available</p>
  //     </div>
  //   );
  // }

  // Discover tweets are now fetched from API and stored in discoverTweets state

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedMedia((prev) => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedMedia((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTrend = async () => {
    if (isPosting) return;
    
    setIsPosting(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create new tweet/post
    const newTweet: Tweet = {
      id: `trend-${Date.now()}`,
      user: {
        id: 'current-user',
        name: 'You',
        username: 'you',
        avatar: '',
        verified: false,
      },
      content: trendText.trim() || selectedMedia.length > 0 
        ? (trendText.trim() || 'Shared some media')
        : 'New trend!',
      timestamp: 'now',
      images: selectedMedia.filter(media => media.startsWith('data:image/') || media.startsWith('http')),
      likes: 0,
      retweets: 0,
      replies: 0,
      liked: false,
      retweeted: false,
    };

    // Add location to content if selected
    if (selectedLocation) {
      newTweet.content += ` 📍 ${selectedLocation}`;
    }

    // Add scheduled info to content if scheduled
    if (scheduledDate && scheduledTime) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString();
      newTweet.content += ` ⏰ Scheduled for ${scheduledDateTime}`;
    }

    // Add poll data if poll exists
    if (hasPoll && pollOptions.filter(opt => opt.trim()).length >= 2) {
      const validOptions = pollOptions.filter(opt => opt.trim());
      const days = parseInt(pollDuration);
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + days);
      
      newTweet.poll = {
        options: validOptions,
        votes: new Array(validOptions.length).fill(0),
        duration: pollDuration,
        endTime: endTime.toISOString(),
      };
    }

    // Add the new tweet to the beginning of the feed
    setTweets(prevTweets => [newTweet, ...prevTweets]);
    
    // Clear feed cache since we have a new post
    try {
      sessionStorage.removeItem('feed_cache');
      sessionStorage.removeItem('feed_cache_timestamp');
    } catch (e) {
      // console.warn('Error clearing cache:', e);
    }
    
    // Reset form
    setTrendText('');
    setSelectedMedia([]);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    setShowPollCreator(false);
    setShowLocationPicker(false);
    setShowSchedulePicker(false);
    setPollOptions(['', '']);
    setPollDuration('1');
    setHasPoll(false);
    setSelectedLocation('');
    setLocationSearch('');
    setScheduledDate('');
    setScheduledTime('');
    setIsPosting(false);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    
    // Scroll to top to show the new post
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Popular GIFs (simulated)
  const popularGifs = [
    { id: 1, url: 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif', title: 'Happy' },
    { id: 2, url: 'https://media.giphy.com/media/l0MYC0Laj6Po2f5Kw/giphy.gif', title: 'Excited' },
    { id: 3, url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', title: 'Dancing' },
    { id: 4, url: 'https://media.giphy.com/media/3o7abldet0lRJPcpSo/giphy.gif', title: 'Celebrate' },
    { id: 5, url: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif', title: 'Thumbs Up' },
    { id: 6, url: 'https://media.giphy.com/media/3o7aD2sa0qmm3lq8G4/giphy.gif', title: 'Love' },
  ];

  const handleGifSelect = (gifUrl: string) => {
    setSelectedMedia((prev) => [...prev, gifUrl]);
    setShowGifPicker(false);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const popularLocations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'San Jose, CA',
    'Austin, TX',
    'Jacksonville, FL',
    'Fort Worth, TX',
    'Columbus, OH',
    'Charlotte, NC',
    'San Francisco, CA',
    'Indianapolis, IN',
    'Seattle, WA',
    'Denver, CO',
    'Washington, DC',
    'Boston, MA',
    'El Paso, TX',
    'Nashville, TN',
    'Detroit, MI',
    'Oklahoma City, OK',
    'Portland, OR',
    'Las Vegas, NV',
    'Memphis, TN',
    'Louisville, KY',
    'Baltimore, MD',
    'Milwaukee, WI',
    'Albuquerque, NM',
    'Tucson, AZ',
    'Fresno, CA',
    'Sacramento, CA',
    'Kansas City, MO',
    'Mesa, AZ',
    'Atlanta, GA',
    'Omaha, NE',
    'Raleigh, NC',
    'Miami, FL',
    'Oakland, CA',
    'Minneapolis, MN',
    'Tulsa, OK',
    'Cleveland, OH',
    'Wichita, KS',
    'Arlington, TX',
    'New Orleans, LA',
    'London, UK',
    'Paris, France',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Toronto, Canada',
    'Berlin, Germany',
    'Madrid, Spain',
    'Rome, Italy',
    'Amsterdam, Netherlands',
    'Dubai, UAE',
    'Singapore',
    'Hong Kong',
    'Bangkok, Thailand',
    'Mumbai, India',
    'São Paulo, Brazil',
    'Mexico City, Mexico',
    'Buenos Aires, Argentina',
    'Cairo, Egypt',
    'Lagos, Nigeria',
    'Johannesburg, South Africa',
  ];

  // Filter locations based on search query
  const filteredLocations = popularLocations.filter(location =>
    location.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (showGifPicker && gifPickerRef.current && !gifPickerRef.current.contains(target) && !target.closest('button[aria-label="Add GIF"]')) {
        setShowGifPicker(false);
      }
      if (showPollCreator && pollRef.current && !pollRef.current.contains(target) && !target.closest('button[aria-label="Create poll"]')) {
        setShowPollCreator(false);
      }
      if (showLocationPicker && locationRef.current && !locationRef.current.contains(target) && !target.closest('button[aria-label="Add location"]')) {
        setShowLocationPicker(false);
        setLocationSearch('');
      }
      if (showSchedulePicker && scheduleRef.current && !scheduleRef.current.contains(target) && !target.closest('button[aria-label="Schedule post"]')) {
        setShowSchedulePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGifPicker, showPollCreator, showLocationPicker, showSchedulePicker]);

  // Comprehensive emoji categories with extensive emoji list
  const emojiCategories = {
    'Frequently Used': ['😀', '😂', '❤️', '🔥', '👍', '🎉', '😍', '✨', '💯', '🙌', '😊', '🥰', '😎', '🤔', '😭', '😱', '🤯', '💪', '👏', '🎊'],
    'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
    'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍', '🌎', '🌏', '🌐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌝', '🌞', '⭐', '🌟', '💫', '✨', '☄️', '💥', '🔥', '🌈', '☀️', '⛅', '☁️', '⛈️', '🌤️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌫️'],
    'Food & Drink': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊'],
    'Travel & Places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⌛', '⏳', '⌚', '⏰', '⏱️', '⏲️', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦', '🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚟', '🚠', '🚡', '🚀', '🛸'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '🥃', '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
    'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '⏱', '⏲', '⏰', '🕰️', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🪓', '🪚', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪛', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧴', '🧷', '🧹', '🪣', '🧽', '🪣', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🪪', '🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🔢', '🔟', '🔢', '🔠', '🔡', '🔤', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔤', '🆎', '🆑', '🆒', '🆓', '🆔', '🆕', '🆖', '🆗', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯', '🉐', '🈹', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲'],
  };

  // Comprehensive emoji search keywords mapping
  const emojiKeywords: Record<string, string[]> = {
    // Smileys
    '😀': ['happy', 'smile', 'grinning', 'face', 'joy'],
    '😂': ['laugh', 'laughing', 'tears', 'joy', 'funny'],
    '😊': ['smile', 'happy', 'blush', 'pleased'],
    '😍': ['heart', 'eyes', 'love', 'adore', 'infatuated'],
    '🥰': ['smiling', 'hearts', 'love', 'adore'],
    '😎': ['cool', 'sunglasses', 'awesome'],
    '🤔': ['think', 'thinking', 'ponder'],
    '😭': ['cry', 'crying', 'sad', 'tears'],
    '😱': ['scream', 'shock', 'surprised'],
    '🤯': ['exploding', 'mind', 'blown'],
    '❤️': ['heart', 'love', 'red', 'like'],
    '🔥': ['fire', 'hot', 'flame', 'lit', 'trending'],
    '👍': ['thumbs', 'up', 'good', 'like', 'approve'],
    '🎉': ['party', 'celebration', 'congrats', 'tada'],
    '✨': ['sparkles', 'star', 'magic', 'shine'],
    '💯': ['100', 'hundred', 'perfect', 'score'],
    '🙌': ['hands', 'raise', 'praise', 'hooray'],
    // Animals
    '🐶': ['dog', 'puppy', 'pet', 'animal'],
    '🐱': ['cat', 'kitten', 'pet', 'animal'],
    '🐼': ['panda', 'bear', 'cute'],
    '🦁': ['lion', 'king', 'animal'],
    '🐯': ['tiger', 'stripes', 'animal'],
    // Food
    '🍎': ['apple', 'fruit', 'red', 'food'],
    '🍕': ['pizza', 'food', 'slice'],
    '🍔': ['burger', 'hamburger', 'food'],
    '☕': ['coffee', 'drink', 'cafe'],
    '🍰': ['cake', 'birthday', 'sweet'],
    // Travel
    '🚗': ['car', 'vehicle', 'drive', 'auto'],
    '✈️': ['plane', 'airplane', 'travel', 'flight'],
    '🏠': ['house', 'home', 'building'],
    '🌍': ['earth', 'world', 'globe'],
    // Activities
    '⚽': ['soccer', 'football', 'sport', 'ball'],
    '🏀': ['basketball', 'sport', 'ball'],
    '🎮': ['game', 'gaming', 'controller'],
    '🎵': ['music', 'note', 'song'],
    // Objects
    '📱': ['phone', 'mobile', 'smartphone', 'device'],
    '💻': ['laptop', 'computer', 'tech'],
    '📷': ['camera', 'photo', 'picture'],
    '🎁': ['gift', 'present', 'box'],
  };

  // Get all emojis as a flat array for search
  const allEmojis = Object.values(emojiCategories).flat();

  // Filter emojis based on search
  const getFilteredEmojis = () => {
    if (!emojiSearch.trim()) {
      return emojiCategories;
    }

    const searchLower = emojiSearch.toLowerCase();
    const filtered: Record<string, string[]> = {};

    Object.entries(emojiCategories).forEach(([category, emojis]) => {
      const matchingEmojis = emojis.filter((emoji) => {
        // Check if category name matches
        if (category.toLowerCase().includes(searchLower)) return true;
        
        // Check if emoji has matching keywords
        const keywords = emojiKeywords[emoji] || [];
        return keywords.some(keyword => keyword.includes(searchLower));
      });

      if (matchingEmojis.length > 0) {
        filtered[category] = matchingEmojis;
      }
    });

    return filtered;
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textBefore = trendText.substring(0, start);
      const textAfter = trendText.substring(end);
      const newText = textBefore + emoji + textAfter;
      setTrendText(newText);
      
      // Set cursor position after the inserted emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      // Fallback if textarea ref is not available
      setTrendText(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
    setEmojiSearch(''); // Clear search when emoji is inserted
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[aria-label="Add emoji"]')
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <div className="w-full">
      {/* Header with Tabs */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <div className="w-full">
          {/* Tabs - Flex to fill width */}
          <div className="flex border-b border-border">
            <button
              onClick={() => handleTabChange('discover')}
              className={`relative flex-1 flex items-center justify-center space-x-2 py-4 transition-colors ${
                activeTab === 'discover'
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>Discover</span>
              {activeTab === 'discover' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
            {activeTab === 'discover' && (
              <button
                onClick={() => refreshFeed(true)}
                disabled={isRefreshing}
                className="px-4 py-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Refresh feed"
                title="Refresh feed"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            <button
              onClick={() => handleTabChange('for-you')}
              className={`relative flex-1 flex items-center justify-center space-x-2 py-4 transition-colors ${
                activeTab === 'for-you'
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span>For You</span>
              {activeTab === 'for-you' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
            {activeTab === 'for-you' && (
              <button
                onClick={() => refreshFeed(true)}
                disabled={isRefreshing}
                className="px-4 py-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Refresh feed"
                title="Refresh feed"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            <button
              onClick={() => handleTabChange('following')}
              className={`relative flex-1 flex items-center justify-center space-x-2 py-4 transition-colors ${
                activeTab === 'following'
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span>Following</span>
              {activeTab === 'following' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
            {activeTab === 'following' && (
              <button
                onClick={() => refreshFeed(true)}
                disabled={isRefreshing}
                className="px-4 py-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Refresh feed"
                title="Refresh feed"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tweet Input - Only show on For You tab */}
      {activeTab === 'for-you' && (
        <div className="border-b border-border px-4 lg:px-6 py-4 bg-background">
          <div className="flex space-x-4">
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={handleProfileClick}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg hover:opacity-90 transition-opacity">
                Y
              </div>
            </div>
            <div className="flex-1 min-w-0 relative overflow-visible">
              <textarea
                ref={textareaRef}
                placeholder="What's happening?"
                value={trendText}
                onChange={(e) => setTrendText(e.target.value)}
                className="w-full resize-none border-none outline-none text-xl placeholder-muted-foreground min-h-[100px] focus:outline-none bg-background text-foreground"
              />
              
              {/* Media Preview */}
              {selectedMedia.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                  {selectedMedia.map((media, index) => (
                    <div key={index} className="relative group">
                      {media.startsWith('data:image/') ? (
                        <img
                          src={media}
                          alt={`Media ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={media}
                          className="w-full h-48 object-cover rounded-lg"
                          controls
                        />
                      )}
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove media"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Poll Preview */}
              {hasPoll && pollOptions.filter(opt => opt.trim()).length >= 2 && (
                <div className="mt-4 p-4 border border-border rounded-xl bg-muted/30 relative group">
                  <button
                    onClick={() => {
                      setHasPoll(false);
                      setShowPollCreator(false);
                      setPollOptions(['', '']);
                      setPollDuration('1');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Remove poll"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <h4 className="font-semibold text-foreground">Poll</h4>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {pollDuration} {pollDuration === '1' ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pollOptions.filter(opt => opt.trim()).map((option, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                      >
                        {option || `Option ${index + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 relative overflow-visible">
                <div className="flex items-center flex-wrap gap-1 sm:gap-2 relative overflow-visible">
                  {/* Image Upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group"
                    aria-label="Upload image"
                    title="Add photos"
                  >
                    <ImageIcon className="w-5 h-5 group-active:scale-110 transition-transform" />
                  </label>

                  {/* Video Upload */}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group"
                    aria-label="Upload video"
                    title="Add video"
                  >
                    <Video className="w-5 h-5 group-active:scale-110 transition-transform" />
                  </label>

                  {/* GIF Picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowGifPicker(!showGifPicker)}
                      className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group font-bold text-xs ${
                        showGifPicker ? 'bg-blue-500/20' : ''
                      }`}
                      aria-label="Add GIF"
                      title="Add GIF"
                    >
                      <span className="group-active:scale-110 transition-transform">GIF</span>
                    </button>

                    {/* GIF Picker Popover */}
                    {showGifPicker && (
                      <>
                        {/* Mobile Backdrop */}
                        <div 
                          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                          onClick={() => setShowGifPicker(false)}
                        />
                        <div
                          ref={gifPickerRef}
                          className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 sm:w-[320px] md:w-[400px] sm:max-w-[400px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 max-h-[70vh] sm:max-h-[400px] overflow-hidden flex flex-col"
                        >
                        <div className="p-3 border-b border-border flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">GIFs</h3>
                          <button
                            onClick={() => setShowGifPicker(false)}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                            aria-label="Close GIF picker"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="overflow-y-auto p-3 grid grid-cols-2 gap-2">
                          {popularGifs.map((gif) => (
                            <button
                              key={gif.id}
                              onClick={() => handleGifSelect(gif.url)}
                              className="relative group rounded-lg overflow-hidden hover:ring-2 ring-blue-500 transition-all"
                              aria-label={`Select ${gif.title} GIF`}
                            >
                              <img src={gif.url} alt={gif.title} className="w-full h-32 object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                      </>
                    )}
                  </div>

                  {/* Emoji Picker - Hidden on small screens */}
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group ${
                        showEmojiPicker ? 'bg-blue-500/20' : ''
                      }`}
                      aria-label="Add emoji"
                      title="Add emoji"
                    >
                      <Smile className={`w-5 h-5 group-active:scale-110 transition-transform ${showEmojiPicker ? 'scale-110' : ''}`} />
                    </button>

                    {/* Emoji Picker Popover */}
                    {showEmojiPicker && (
                      <>
                        {/* Mobile Backdrop */}
                        <div 
                          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                          onClick={() => setShowEmojiPicker(false)}
                        />
                        <div
                          ref={emojiPickerRef}
                          className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 sm:w-[320px] md:w-[380px] sm:max-w-[380px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 max-h-[70vh] sm:max-h-[450px] overflow-hidden flex flex-col"
                        >
                        {/* Header with Search */}
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground">Emoji</h3>
                            <button
                              onClick={() => {
                                setShowEmojiPicker(false);
                                setEmojiSearch('');
                              }}
                              className="p-1 rounded-full hover:bg-accent transition-colors"
                              aria-label="Close emoji picker"
                            >
                              <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search emojis..."
                              value={emojiSearch}
                              onChange={(e) => setEmojiSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Emoji Grid */}
                        <div className="overflow-y-auto p-3 flex-1">
                          {Object.entries(getFilteredEmojis()).length > 0 ? (
                            Object.entries(getFilteredEmojis()).map(([category, emojis]) => (
                              <div key={category} className="mb-4">
                                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-1">
                                  {category}
                                </h4>
                                <div className="grid grid-cols-8 gap-1">
                                  {emojis.map((emoji, index) => (
                                    <button
                                      key={`${category}-${index}`}
                                      onClick={() => insertEmoji(emoji)}
                                      className="p-2 text-2xl hover:bg-accent rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                      aria-label={`Insert ${emoji} emoji`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">No emojis found</p>
                              <p className="text-xs mt-1">Try a different search term</p>
                            </div>
                          )}
                        </div>
                      </div>
                      </>
                    )}
                  </div>

                  {/* Poll Creator */}
                  <div className="relative">
                    <button
                      onClick={() => setShowPollCreator(!showPollCreator)}
                      className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group ${
                        showPollCreator ? 'bg-blue-500/20' : ''
                      }`}
                      aria-label="Create poll"
                      title="Create poll"
                    >
                      <BarChart3 className="w-5 h-5 group-active:scale-110 transition-transform" />
                    </button>

                    {/* Poll Creator Popover */}
                    {showPollCreator && (
                      <>
                        {/* Mobile Backdrop */}
                        <div 
                          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                          onClick={() => setShowPollCreator(false)}
                        />
                        <div
                          ref={pollRef}
                          className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 sm:w-[320px] md:w-[400px] sm:max-w-[400px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 p-4 max-h-[80vh] sm:max-h-none overflow-y-auto"
                        >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Create Poll</h3>
                          <button
                            onClick={() => setShowPollCreator(false)}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                            aria-label="Close poll creator"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          {pollOptions.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => updatePollOption(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {pollOptions.length > 2 && (
                                <button
                                  onClick={() => removePollOption(index)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  aria-label="Remove option"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          {pollOptions.length < 4 && (
                            <button
                              onClick={addPollOption}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-sm">Add option</span>
                            </button>
                          )}
                          <div className="pt-2">
                            <label className="block text-sm font-medium text-foreground mb-2">Poll duration</label>
                            <select
                              value={pollDuration}
                              onChange={(e) => setPollDuration(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="1">1 day</option>
                              <option value="3">3 days</option>
                              <option value="7">7 days</option>
                            </select>
                          </div>
                          {pollOptions.filter(opt => opt.trim()).length >= 2 && (
                            <button
                              onClick={() => {
                                setHasPoll(true);
                                setShowPollCreator(false);
                              }}
                              className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                            >
                              Add Poll
                            </button>
                          )}
                        </div>
                      </div>
                      </>
                    )}
                  </div>

                  {/* Location Picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLocationPicker(!showLocationPicker)}
                      className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group ${
                        selectedLocation ? 'bg-blue-500/20' : ''
                      }`}
                      aria-label="Add location"
                      title="Add location"
                    >
                      <MapPin className={`w-5 h-5 group-active:scale-110 transition-transform ${selectedLocation ? 'fill-current' : ''}`} />
                    </button>

                    {/* Location Picker Popover */}
                    {showLocationPicker && (
                      <>
                        {/* Mobile Backdrop */}
                        <div 
                          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                          onClick={() => {
                            setShowLocationPicker(false);
                            setLocationSearch('');
                          }}
                        />
                        <div
                          ref={locationRef}
                          className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 w-[calc(100vw-2rem)] sm:w-[320px] md:w-[400px] max-w-[400px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 max-h-[70vh] sm:max-h-[400px] overflow-hidden flex flex-col"
                        >
                        <div className="p-3 border-b border-border flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">Add Location</h3>
                          <button
                            onClick={() => {
                              setShowLocationPicker(false);
                              setLocationSearch('');
                            }}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                            aria-label="Close location picker"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        {/* Search Input */}
                        <div className="p-3 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search for a location..."
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto p-2 flex-1">
                          {filteredLocations.length > 0 ? (
                            <div className="space-y-1">
                              {filteredLocations.map((location) => (
                                <button
                                  key={location}
                                  onClick={() => {
                                    setSelectedLocation(location);
                                    setShowLocationPicker(false);
                                    setLocationSearch('');
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors ${
                                    selectedLocation === location ? 'bg-blue-500/10 text-blue-500' : 'text-foreground'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm">{location}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No locations found</p>
                              <p className="text-xs mt-1">Try a different search term</p>
                            </div>
                          )}
                        </div>
                      </div>
                      </>
                    )}
                  </div>

                  {/* Schedule Picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                      className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group ${
                        scheduledDate && scheduledTime ? 'bg-blue-500/20' : ''
                      }`}
                      aria-label="Schedule post"
                      title="Schedule post"
                    >
                      <Calendar className={`w-5 h-5 group-active:scale-110 transition-transform ${scheduledDate && scheduledTime ? 'fill-current' : ''}`} />
                    </button>

                    {/* Schedule Picker Popover */}
                    {showSchedulePicker && (
                      <>
                        {/* Mobile Backdrop */}
                        <div 
                          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                          onClick={() => setShowSchedulePicker(false)}
                        />
                        <div
                          ref={scheduleRef}
                          className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 sm:w-[320px] md:w-[400px] sm:max-w-[400px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 p-4 max-h-[70vh] sm:max-h-none overflow-y-auto"
                        >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Schedule Post</h3>
                          <button
                            onClick={() => {
                              setShowSchedulePicker(false);
                              setScheduledDate('');
                              setScheduledTime('');
                            }}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                            aria-label="Close schedule picker"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                            <input
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Time</label>
                            <input
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {scheduledDate && scheduledTime && (
                            <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg text-sm text-blue-500">
                              <Clock className="w-4 h-4" />
                              <span>Scheduled for {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Trend Submit Button - Responsive */}
                <button
                  onClick={handleTrend}
                  disabled={(!trendText.trim() && selectedMedia.length === 0 && !(hasPoll && pollOptions.filter(opt => opt.trim()).length >= 2) && !selectedLocation && !scheduledDate) || isPosting}
                  className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black font-bold py-2.5 px-6 sm:px-8 rounded-full hover:opacity-90 active:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                >
                  {isPosting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Posting...</span>
                    </span>
                  ) : scheduledDate && scheduledTime ? (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Schedule</span>
                    </span>
                  ) : (
                    'Trend'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="transition-opacity duration-200">
        {activeTab === 'for-you' || activeTab === 'following' ? (
          /* For You / Following Tab - Show feed tweets */
          <div
            ref={feedContainerRef}
            onTouchStart={(e) => {
              if (window.scrollY === 0) {
                touchStartY.current = e.touches[0].clientY;
                setIsPulling(false);
              }
            }}
            onTouchMove={(e) => {
              if (window.scrollY === 0 && touchStartY.current > 0) {
                const currentY = e.touches[0].clientY;
                const pullDistance = currentY - touchStartY.current;
                
                if (pullDistance > 0 && pullDistance < 100) {
                  setIsPulling(true);
                  setPullToRefreshY(Math.min(pullDistance, 80));
                } else if (pullDistance <= 0) {
                  setIsPulling(false);
                  setPullToRefreshY(0);
                }
              }
            }}
            onTouchEnd={() => {
              if (isPulling && pullToRefreshY > 50) {
                refreshFeed(true);
              }
              setIsPulling(false);
              setPullToRefreshY(0);
              touchStartY.current = 0;
            }}
            style={{
              transform: isPulling ? `translateY(${pullToRefreshY}px)` : 'translateY(0)',
              transition: isPulling ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {/* Pull to refresh indicator */}
            {isPulling && (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <RefreshCw className={`w-5 h-5 ${pullToRefreshY > 50 ? 'animate-spin' : ''}`} />
                <span className="ml-2 text-sm">
                  {pullToRefreshY > 50 ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </div>
            )}
            {isRefreshing && !isPulling && (
              <>
                <TweetSkeleton showImage={false} />
                <TweetSkeleton showImage={true} />
              </>
            )}
            {isLoadingFeed ? (
              <>
                <TweetSkeleton showImage={false} />
                <TweetSkeleton showImage={true} />
                <TweetSkeleton showImage={false} />
                <TweetSkeleton showImage={true} />
                <TweetSkeleton showImage={false} />
              </>
            ) : tweets && tweets.length > 0 ? (
              <>
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
                {/* Loading more indicator */}
                {isLoadingMore && (
                  <>
                    <TweetSkeleton showImage={false} />
                    <TweetSkeleton showImage={true} />
                  </>
                )}
                {/* End of feed indicator */}
                {!hasMore && tweets.length > 0 && (
                  <div className="w-full max-w-2xl mx-auto lg:max-w-[600px] p-8 text-center text-muted-foreground">
                    <p className="text-sm">You&apos;ve reached the end of the feed</p>
                  </div>
                )}
              </>
            ) : (
              // Only show empty state if we're not loading and truly have no posts
              !isLoadingFeed && (
              <div className="w-full max-w-2xl mx-auto lg:max-w-[600px] p-8 text-center text-muted-foreground">
                <p>No posts available. Start following people to see posts in your feed!</p>
              </div>
              )
            )}
          </div>
        ) : (
          /* Discover Tab - Show curated/discoverable content */
          <div>
            {isRefreshing && !isPulling && (
              <>
                <TweetSkeleton showImage={false} />
                <TweetSkeleton showImage={true} />
              </>
            )}
            {isLoadingFeed ? (
              <>
                <TweetSkeleton showImage={false} />
                <TweetSkeleton showImage={true} />
                <TweetSkeleton showImage={false} />
                <TweetSkeleton showImage={true} />
                <TweetSkeleton showImage={false} />
              </>
            ) : discoverTweets && discoverTweets.length > 0 ? (
              <>
                <div className="px-4 lg:px-6 py-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Trending Now</h3>
                  <p className="text-sm text-muted-foreground">Discover trending topics and posts</p>
                </div>
                {discoverTweets.map((tweet) => (
                  <div key={tweet.id}>
                    <TweetCard 
                      tweet={tweet} 
                      isHighlighted={false}
                    />
                  </div>
                ))}
                {/* Loading more indicator */}
                {isLoadingMore && (
                  <>
                    <TweetSkeleton showImage={false} />
                    <TweetSkeleton showImage={true} />
                  </>
                )}
              </>
            ) : (
              !isLoadingFeed && (
                <div className="w-full max-w-2xl mx-auto lg:max-w-[600px] p-8 text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium mb-2">Nothing to discover yet</p>
                  <p className="text-sm">Check back later for trending content</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Floating Compose Button - Shows on scroll */}
      {showFloatingButton && (
        <button
          onClick={handleComposeClick}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center z-[90] transition-all duration-300 hover:opacity-90 touch-manipulation"
          aria-label="Compose new trend"
          title="Compose new trend"
        >
          <Plus className="w-6 h-6 md:w-7 md:h-7" />
        </button>
      )}
    </div>
  );
}

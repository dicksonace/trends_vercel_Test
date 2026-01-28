'use client';

import { useParams } from 'next/navigation';
import TweetCard from '@/components/TweetCard';
import TweetSkeleton from '@/components/TweetSkeleton';
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, Image as ImageIcon, Heart, TrendingUp, Pin, Sparkles, Pencil, MessageCircle, X, Camera, Upload, Loader2, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { getCurrentUser, getAuthToken, fetchUserProfile, fetchUserTrends, updateProfile, updateProfilePicture, updateCoverPicture, getUserBits, type UserProfile, type FeedPost } from '@/lib/api';
import type { User } from '@/types/auth';
import type { Tweet } from '@/types';

type TabType = 'posts' | 'bits';
type UploadType = 'profile' | 'cover' | null;

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [userTweets, setUserTweets] = useState<Tweet[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actualUsername, setActualUsername] = useState<string>(username);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userBits, setUserBits] = useState<Tweet[]>([]);
  const [isLoadingBits, setIsLoadingBits] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    bio: '',
    website: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data and check if current user
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      
      let resolvedUsername = username;
      let isCurrentUserProfile = false;
      
      // If username is "you", fetch current user's profile
      if (username === 'you') {
        try {
          // First, try to get from localStorage
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            try {
              const user: User = JSON.parse(storedUser);
              if (user.username) {
                resolvedUsername = user.username;
                isCurrentUserProfile = true;
                setIsCurrentUser(true);
                setCurrentUser(user);
                setActualUsername(user.username);
              }
            } catch (e) {
              // Invalid JSON, continue to API
            }
          }
          
          // If no stored user or no username, try to fetch from API
          if (!resolvedUsername || resolvedUsername === 'you') {
            const token = getAuthToken();
            if (!token) {
              // No token, redirect to login
              // console.log('No auth token found, redirecting to login');
              router.push('/login');
              return;
            }
            
            // Try to fetch from API, but don't fail if it errors
            try {
              const currentUserResponse = await getCurrentUser();
              if (currentUserResponse.data && currentUserResponse.data.username) {
                resolvedUsername = currentUserResponse.data.username;
                isCurrentUserProfile = true;
                setIsCurrentUser(true);
                setCurrentUser(currentUserResponse.data);
                setActualUsername(currentUserResponse.data.username);
                // Store for future use
                localStorage.setItem('currentUser', JSON.stringify(currentUserResponse.data));
              } else {
                // API returned error but we have token
                // console.warn('API returned error but token exists. Status:', currentUserResponse.status);
                // If we still don't have a username, we can't proceed
                if (!resolvedUsername || resolvedUsername === 'you') {
                  // console.warn('Cannot resolve username. Redirecting to login.');
                  router.push('/login');
                  return;
                }
              }
            } catch (error) {
              // console.error('Error fetching current user from API:', error);
              // If API fails but we have stored user data, use it
              if (!resolvedUsername || resolvedUsername === 'you') {
                // No stored data and API failed - check if we have token
                // If token exists, maybe the API is temporarily down, but we should still redirect
                // since we can't load the profile without a username
                // console.warn('Cannot resolve username from API or localStorage. Redirecting to login.');
                router.push('/login');
                return;
              }
              // If we have stored data (resolvedUsername is set), continue with it
              // console.log('Using stored username:', resolvedUsername);
            }
          }
        } catch (error) {
          // console.error('Error in profile loading:', error);
          // Only redirect if we really can't proceed
          const token = getAuthToken();
          if (!token) {
            router.push('/login');
            return;
          }
        }
      } else {
        // Check if this is the current logged-in user (for any username)
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const user: User = JSON.parse(storedUser);
            if (user.username === username) {
              isCurrentUserProfile = true;
              setIsCurrentUser(true);
              setCurrentUser(user);
            }
          } catch (e) {
            // Invalid JSON
          }
        }
        setActualUsername(username);
      }

      // Fetch profile data from API using resolved username
      try {
        const response = await fetchUserProfile(resolvedUsername);
        if (response.data) {
          // Handle different response structures
          // Backend might return: { user: {...} } or { data: {...} } or directly {...}
          let profile: UserProfile;
          const data = response.data as any;
          
          if (data.user) {
            profile = data.user;
          } else if (data.data) {
            profile = data.data;
          } else if (data.profile) {
            profile = data.profile;
          } else {
            profile = data as UserProfile;
          }
          
          // Map backend field names to our interface
          // Backend uses: total_posts, followers_count, following_count, picture
          // Our interface expects: posts, followers, following, avatar
          const picturePath = (profile as any).picture || profile.avatar;
          const coverPath = profile.cover;
          
          // Convert relative paths to full URLs if needed
          const getImageUrl = (path: string | undefined | null) => {
            if (!path) return undefined;
            if (path.startsWith('http://') || path.startsWith('https://')) return path;
            // Backend returns paths like "DicksonAwudu(323)/1707743908_sElJhYnIZA.jpeg"
            // Need to construct full URL - adjust this based on your backend image serving
            return `https://www.trendshub.link/storage/${path}`;
          };
          
          // Parse bio JSON string if it exists (backend stores it as JSON string: {"bio":"...","website":"..."})
          let parsedBio = '';
          let parsedWebsite = '';
          if (profile.bio) {
            try {
              const bioData = typeof profile.bio === 'string' ? JSON.parse(profile.bio) : profile.bio;
              parsedBio = bioData.bio || '';
              parsedWebsite = bioData.website || '';
            } catch (e) {
              // If parsing fails, treat it as plain text
              parsedBio = profile.bio;
            }
          }
          
          const mappedProfile: UserProfile = {
            id: String(profile.id || (profile as any).id),
            username: profile.username,
            name: profile.name,
            email: (profile as any).email,
            bio: parsedBio,
            website: parsedWebsite || profile.website || '',
            avatar: getImageUrl(picturePath),
            cover: getImageUrl(coverPath),
            verified: (profile as any).verification !== null || profile.verified || false,
            // Map backend field names
            followers: (profile as any).followers_count ?? profile.followers ?? 0,
            following: (profile as any).following_count ?? profile.following ?? 0,
            posts: (profile as any).total_posts ?? profile.posts ?? 0,
          };
          
          setProfileData(mappedProfile);
          
          // Check if this is the current user (if not already set)
          if (!isCurrentUserProfile) {
            const token = getAuthToken();
            if (token) {
              const currentUserResponse = await getCurrentUser();
              if (currentUserResponse.data && currentUserResponse.data.username === resolvedUsername) {
                setIsCurrentUser(true);
                setCurrentUser(currentUserResponse.data);
              }
            }
          }
        } else if (response.error) {
          // console.error('Error fetching profile:', response.error);
        }
      } catch (error) {
        // console.error('Error fetching profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [username]);

  // Helper function to convert post to tweet with proper image handling
  const convertPostToTweet = (post: any): Tweet => {
    // Handle images - construct full URLs if needed
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
          if (img.startsWith('http://') || img.startsWith('https://')) {
            return img;
          }
          return `https://www.trendshub.link/storage/${img}`;
        });
      if (images.length === 0) images = undefined;
    } else if (post.image_urls && post.image_urls !== null) {
      const imageArray = Array.isArray(post.image_urls) ? post.image_urls : [post.image_urls];
      images = imageArray
        .filter((img: any) => img !== null && img !== undefined && img !== '' && img !== 'null')
        .map((img: string) => {
          if (img.startsWith('http://') || img.startsWith('https://')) {
            return img;
          }
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
    
    // Handle avatar URL
    let avatarUrl: string | undefined = undefined;
    if (post.user?.picture) {
      if (post.user.picture.startsWith('http://') || post.user.picture.startsWith('https://')) {
        avatarUrl = post.user.picture;
      } else {
        avatarUrl = `https://www.trendshub.link/storage/${post.user.picture}`;
      }
    } else if (post.user?.avatar) {
      avatarUrl = post.user.avatar;
    }
    
    return {
      id: String(post.id),
      user: {
        id: String(post.user?.id || post.user_id || ''),
        name: post.user?.name || '',
        username: post.user?.username || '',
        avatar: avatarUrl || '',
        verified: post.user?.verification !== null || post.user?.verified || false,
      },
      content: post.text || post.content || '',
      images: images || [],
      timestamp: post.created_at || post.timestamp || '',
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
        duration: '24 hours',
        endDate: post.poll_end_date || undefined,
      } : undefined,
    };
  };

  // Fetch user's posts
  useEffect(() => {
    const loadPosts = async () => {
      // Wait for actualUsername to be set if it's "you"
      if (username === 'you' && actualUsername === 'you') {
        return; // Wait for profile to load first
      }
      
      setIsLoadingPosts(true);
      setCurrentPage(1);
      setHasMore(true);
      try {
        const targetUsername = actualUsername || username;
        const response = await fetchUserTrends(targetUsername, 1, 20);
        
        // Backend returns 'trend' array instead of 'posts'
        const postsArray = (response.data as any)?.trend || response.data?.data || response.data?.posts || [];
        
        if (postsArray.length > 0) {
          // Convert backend post format to Tweet format
          const convertedTweets: Tweet[] = postsArray.map((post: any) => convertPostToTweet(post));
          setUserTweets(convertedTweets);
          
          // Update pagination info
          if (response.data?.last_page !== undefined) {
            setLastPage(response.data.last_page);
            setHasMore(1 < response.data.last_page);
          } else if (response.data?.current_page !== undefined) {
            setLastPage(response.data.current_page);
            setHasMore(true); // Assume there's more if we don't know
          }
        } else {
          setUserTweets([]);
          setHasMore(false);
        }
      } catch (error) {
        // console.error('Error fetching user posts:', error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    loadPosts();
  }, [username, actualUsername]);

  // Function to load more posts
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoadingPosts) return;
    
    const nextPage = currentPage + 1;
    if (nextPage > lastPage) {
      setHasMore(false);
      return;
    }
    
    setIsLoadingMore(true);
    try {
      const targetUsername = actualUsername || username;
      const response = await fetchUserTrends(targetUsername, nextPage, 20);
      
      const postsArray = (response.data as any)?.trend || response.data?.data || response.data?.posts || [];
      
      if (postsArray.length > 0) {
        const convertedTweets: Tweet[] = postsArray.map((post: any) => convertPostToTweet(post));
        setUserTweets(prev => [...prev, ...convertedTweets]);
        setCurrentPage(nextPage);
        
        // Update pagination info
        if (response.data?.last_page !== undefined) {
          setLastPage(response.data.last_page);
          setHasMore(nextPage < response.data.last_page);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      // console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, isLoadingPosts, currentPage, lastPage, username, actualUsername]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoadingMore || isLoadingPosts) return;
      
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more when within 500px of bottom
      if (scrollY + windowHeight >= documentHeight - 500) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, isLoadingPosts, loadMorePosts]);

  // Use profile data or show loading/skeleton
  const user = profileData ? {
    id: profileData.id,
    username: profileData.username,
    name: profileData.name,
    avatar: profileData.avatar,
    verified: profileData.verified || false,
    bio: profileData.bio,
    website: profileData.website,
    // Use the actual values from API - check for null/undefined, but allow 0
    followers: profileData.followers != null ? profileData.followers : 0,
    following: profileData.following != null ? profileData.following : 0,
    // Use posts count from API if available, otherwise use actual tweets length
    // If API says 0 but we have posts, use the actual count
    posts: profileData.posts != null 
      ? (profileData.posts > 0 ? profileData.posts : userTweets.length)
      : userTweets.length,
  } : (isLoadingProfile ? {
    // Skeleton/placeholder data while loading
    id: '',
    username: username,
    name: username,
    avatar: undefined,
    verified: false,
    bio: undefined,
    website: undefined,
    followers: 0,
    following: 0,
    posts: 0,
  } : null);

  // Helper function to get image URL
  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Backend returns paths like "DicksonAwudu(323)/1707743908_sElJhYnIZA.jpeg"
    // Need to construct full URL - adjust this based on your backend image serving
    return `https://www.trendshub.link/storage/${path}`;
  };

  // Pinned post (first tweet as pinned if exists)
  const pinnedPost = userTweets.length > 0 ? userTweets[0] : null;
  const regularPosts = userTweets.slice(1);

  // Fetch user bits when bits tab is active
  useEffect(() => {
    const loadBits = async () => {
      if (activeTab !== 'bits') return;
      
      // Wait for actualUsername to be set if it's "you"
      if (username === 'you' && actualUsername === 'you') {
        return; // Wait for profile to load first
      }
      
      setIsLoadingBits(true);
      try {
        const targetUsername = actualUsername || username;
        console.log('🔍 DEBUG: Loading bits for user:', targetUsername);
        const response = await getUserBits(targetUsername);
        console.log('🔍 DEBUG: getUserBits response:', response);
        console.log('🔍 DEBUG: Response status:', response.status);
        console.log('🔍 DEBUG: Response data:', response.data);
        console.log('🔍 DEBUG: Response error:', response.error);
        
        if (response.status === 200 && response.data) {
          // Handle different response structures
          // The API returns: { success: true, data: { user_profile: {...}, bits: Array(20), pagination: {...} } }
          const bitsArray = response.data?.data?.bits || response.data?.bits || response.data?.data || response.data || [];
          console.log('🔍 DEBUG: Extracted bits array:', bitsArray);
          console.log('🔍 DEBUG: Bits array length:', bitsArray.length);
          
          if (Array.isArray(bitsArray) && bitsArray.length > 0) {
            console.log('🔍 DEBUG: First bit sample:', bitsArray[0]);
            // Convert bits to Tweet format
            const convertedBits: Tweet[] = bitsArray.map((bit: any) => {
              let images: string[] | undefined = undefined;
              if (bit.image_urls) {
                const imageArray = Array.isArray(bit.image_urls) ? bit.image_urls : [bit.image_urls];
                images = imageArray
                  .filter((img: any) => img !== null && img !== undefined && img !== '' && img !== 'null')
                  .map((img: string) => {
                    if (img.startsWith('http://') || img.startsWith('https://')) {
                      return img;
                    }
                    return `https://www.trendshub.link/storage/${img}`;
                  });
                if (images && images.length === 0) images = undefined;
              } else if (bit.media_thumbnail_url) {
                const thumbUrl = bit.media_thumbnail_url.startsWith('http://') || bit.media_thumbnail_url.startsWith('https://')
                  ? bit.media_thumbnail_url
                  : `https://www.trendshub.link/storage/${bit.media_thumbnail_url}`;
                images = [thumbUrl];
              }
              
              // Handle avatar URL
              let avatarUrl: string | undefined = undefined;
              if (bit.user?.picture) {
                if (bit.user.picture.startsWith('http://') || bit.user.picture.startsWith('https://')) {
                  avatarUrl = bit.user.picture;
                } else {
                  avatarUrl = `https://www.trendshub.link/storage/${bit.user.picture}`;
                }
              } else if (bit.user?.avatar) {
                avatarUrl = bit.user.avatar;
              }
              
              return {
                id: String(bit.id),
                user: {
                  id: String(bit.user?.id || ''),
                  name: bit.user?.name || '',
                  username: bit.user?.username || '',
                  avatar: avatarUrl || '',
                  verified: bit.user?.verification !== null || bit.user?.verified || false,
                },
                content: bit.caption || '',
                images: images || [],
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
            setUserBits(convertedBits);
            console.log('🔍 DEBUG: Converted bits:', convertedBits);
          } else {
            console.log('🔍 DEBUG: No bits found in response');
            setUserBits([]);
          }
        } else {
          console.log('🔍 DEBUG: API call failed with status:', response.status);
          setUserBits([]);
        }
      } catch (error) {
        console.error('🔍 DEBUG: Error fetching user bits:', error);
        setUserBits([]);
      } finally {
        setIsLoadingBits(false);
      }
    };

    loadBits();
  }, [activeTab, username, actualUsername]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle camera capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // Process and upload image
  const handleImageUpload = async (file: File) => {
    // console.log('=== IMAGE UPLOAD START ===');
    // console.log('File name:', file.name);
    // console.log('File type:', file.type);
    // console.log('File size:', file.size, 'bytes');
    // console.log('Upload type:', uploadType);
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        // console.log('Base64 image length:', base64Image.length);
        // console.log('Base64 preview (first 100 chars):', base64Image.substring(0, 100));
        
        try {
          let response;
          if (uploadType === 'profile') {
            // console.log('Calling updateProfilePicture API...');
            response = await updateProfilePicture(base64Image);
            // console.log('Update Profile Picture Response:', JSON.stringify(response, null, 2));
            // console.log('Response Status:', response.status);
            // console.log('Response Data:', response.data);
            // console.log('Response Error:', response.error);
            
            if (response.data?.success && response.data.avatar) {
              // console.log('✅ Profile picture update successful!');
              setProfileImage(response.data.avatar);
              // Reload profile to get updated data
              // console.log('Reloading profile data...');
              const profileResponse = await fetchUserProfile(username);
              // console.log('Profile Reload Response:', JSON.stringify(profileResponse, null, 2));
              
              if (profileResponse.data) {
                const data = profileResponse.data as any;
                const userData = data.user || data;
                
                // Parse bio JSON string if it exists
                let parsedBio = '';
                let parsedWebsite = '';
                if (userData.bio) {
                  try {
                    const bioData = typeof userData.bio === 'string' ? JSON.parse(userData.bio) : userData.bio;
                    parsedBio = bioData.bio || '';
                    parsedWebsite = bioData.website || '';
                  } catch (e) {
                    // If parsing fails, treat it as plain text
                    parsedBio = userData.bio;
                  }
                }
                
                const mappedProfile: UserProfile = {
                  id: String(userData.id),
                  username: userData.username,
                  name: userData.name,
                  email: userData.email,
                  bio: parsedBio,
                  website: parsedWebsite || userData.website || '',
                  avatar: getImageUrl(userData.picture),
                  cover: getImageUrl(userData.cover),
                  verified: userData.verification !== null || false,
                  followers: userData.followers_count ?? 0,
                  following: userData.following_count ?? 0,
                  posts: userData.total_posts ?? 0,
                };
                setProfileData(mappedProfile);
              }
            } else {
              // console.error('❌ Profile picture update failed:', response.error);
              // console.error('Full error response:', JSON.stringify(response, null, 2));
              alert(response.error || 'Failed to update profile picture');
            }
          } else if (uploadType === 'cover') {
            // console.log('Calling updateCoverPicture API...');
            response = await updateCoverPicture(base64Image);
            // console.log('Update Cover Picture Response:', JSON.stringify(response, null, 2));
            // console.log('Response Status:', response.status);
            // console.log('Response Data:', response.data);
            // console.log('Response Error:', response.error);
            
            if (response.data?.success && response.data.cover) {
              // console.log('✅ Cover picture update successful!');
              setCoverImage(response.data.cover);
              // Reload profile to get updated data
              // console.log('Reloading profile data...');
              const profileResponse = await fetchUserProfile(username);
              // console.log('Profile Reload Response:', JSON.stringify(profileResponse, null, 2));
              
              if (profileResponse.data) {
                const data = profileResponse.data as any;
                const userData = data.user || data;
                
                // Parse bio JSON string if it exists
                let parsedBio = '';
                let parsedWebsite = '';
                if (userData.bio) {
                  try {
                    const bioData = typeof userData.bio === 'string' ? JSON.parse(userData.bio) : userData.bio;
                    parsedBio = bioData.bio || '';
                    parsedWebsite = bioData.website || '';
                  } catch (e) {
                    // If parsing fails, treat it as plain text
                    parsedBio = userData.bio;
                  }
                }
                
                const mappedProfile: UserProfile = {
                  id: String(userData.id),
                  username: userData.username,
                  name: userData.name,
                  email: userData.email,
                  bio: parsedBio,
                  website: parsedWebsite || userData.website || '',
                  avatar: getImageUrl(userData.picture),
                  cover: getImageUrl(userData.cover),
                  verified: userData.verification !== null || false,
                  followers: userData.followers_count ?? 0,
                  following: userData.following_count ?? 0,
                  posts: userData.total_posts ?? 0,
                };
                setProfileData(mappedProfile);
              }
            } else {
              // console.error('❌ Cover picture update failed:', response.error);
              // console.error('Full error response:', JSON.stringify(response, null, 2));
              alert(response.error || 'Failed to update cover picture');
            }
          }
          
          setIsUploading(false);
          setUploadType(null);
          // console.log('=== IMAGE UPLOAD END ===');
        } catch (error) {
          // console.error('❌ Exception uploading image:', error);
          // console.error('Error details:', error instanceof Error ? error.message : String(error));
          // console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          alert('Failed to upload image. Please try again.');
          setIsUploading(false);
          // console.log('=== IMAGE UPLOAD END (ERROR) ===');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      // console.error('❌ Exception reading file:', error);
      // console.error('Error details:', error instanceof Error ? error.message : String(error));
      alert('Failed to read file. Please try again.');
      setIsUploading(false);
      // console.log('=== IMAGE UPLOAD END (ERROR) ===');
    }
  };

  // Open upload modal
  const openUploadModal = (type: UploadType) => {
    setUploadType(type);
  };

  // Close upload modal
  const closeUploadModal = () => {
    setUploadType(null);
    setProfileImage(null);
    setCoverImage(null);
  };

  // Open edit profile modal
  const openEditModal = () => {
    if (profileData) {
      setEditFormData({
        name: profileData.name || '',
        username: profileData.username || '',
        bio: profileData.bio || '',
        website: profileData.website || '',
      });
      setShowEditModal(true);
    }
  };

  // Close edit profile modal
  const closeEditModal = () => {
    setShowEditModal(false);
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!editFormData.name.trim()) {
      alert('Name is required');
      return;
    }

    // console.log('=== UPDATE PROFILE START ===');
    // console.log('Form Data:', JSON.stringify(editFormData, null, 2));
    
    setIsSavingProfile(true);
    try {
      const bioText = editFormData.bio.trim();
      const websiteText = editFormData.website.trim();
      
      const updatePayload: any = {
        name: editFormData.name.trim(),
        username: editFormData.username.trim(),
      };
      
      // Try sending bio as an object - backend might stringify it itself
      // Some backends expect objects and handle stringification internally
      updatePayload.bio = {
        bio: bioText,
        website: websiteText
      };
      
      // console.log('Update Payload:', JSON.stringify(updatePayload, null, 2));
      // console.log('Calling updateProfile API...');
      
      const response = await updateProfile(updatePayload);
      
      // console.log('Update Profile API Response:', JSON.stringify(response, null, 2));
      // console.log('Response Status:', response.status);
      // console.log('Response Data:', response.data);
      // console.log('Response Error:', response.error);

      // Check for success: either response.data.success === true OR status 200 with success message
      const isSuccess = response.status === 200 && (
        response.data?.success === true || 
        response.data?.message?.toLowerCase().includes('success') ||
        !response.error
      );

      if (isSuccess) {
        // console.log('✅ Profile update successful!');
        // Reload profile data
        // console.log('Reloading profile data...');
        const profileResponse = await fetchUserProfile(username);
        // console.log('Profile Reload Response:', JSON.stringify(profileResponse, null, 2));
        
        if (profileResponse.data) {
          const data = profileResponse.data as any;
          const userData = data.user || data;
          
          // Parse bio JSON string if it exists
          let parsedBio = '';
          let parsedWebsite = '';
          if (userData.bio) {
            try {
              const bioData = typeof userData.bio === 'string' ? JSON.parse(userData.bio) : userData.bio;
              parsedBio = bioData.bio || '';
              parsedWebsite = bioData.website || '';
            } catch (e) {
              // If parsing fails, treat it as plain text
              parsedBio = userData.bio;
            }
          }
          
          const mappedProfile: UserProfile = {
            id: String(userData.id),
            username: userData.username,
            name: userData.name,
            email: userData.email,
            bio: parsedBio,
            website: parsedWebsite || userData.website || '',
            avatar: getImageUrl(userData.picture),
            cover: getImageUrl(userData.cover),
            verified: userData.verification !== null || false,
            followers: userData.followers_count ?? 0,
            following: userData.following_count ?? 0,
            posts: userData.total_posts ?? 0,
          };
          // console.log('Mapped Profile Data:', JSON.stringify(mappedProfile, null, 2));
          setProfileData(mappedProfile);
        }
        setShowEditModal(false);
        // If username changed, redirect to new username
        if (editFormData.username.trim() !== username) {
          // console.log('Username changed, redirecting...');
          router.push(`/profile/${editFormData.username.trim()}`);
        }
        // console.log('=== UPDATE PROFILE SUCCESS ===');
      } else {
        // console.error('❌ Profile update failed:', response.error);
        // console.error('Full error response:', JSON.stringify(response, null, 2));
        alert(response.error || 'Failed to update profile');
      }
    } catch (error) {
      // console.error('❌ Exception updating profile:', error);
      // console.error('Error details:', error instanceof Error ? error.message : String(error));
      // console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
      // console.log('=== UPDATE PROFILE END ===');
    }
  };

  // Show loading state with skeleton
  if (isLoadingProfile && !user) {
    return (
      <main className="border-x border-border bg-background min-h-screen">
        {/* Profile Header Skeleton */}
        <div className="border-b border-border">
          {/* Cover Image Skeleton */}
          <div className="relative h-32 md:h-48 bg-muted animate-pulse">
            <div className="absolute top-0 left-0 right-0 px-3 md:px-4 lg:px-6 py-2 md:py-4 flex items-center space-x-3 md:space-x-4">
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20 animate-pulse" />
              <div>
                <div className="h-5 w-32 bg-muted-foreground/20 rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-muted-foreground/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Profile Info Skeleton */}
          <div className="px-3 md:px-4 lg:px-6 pb-3 md:pb-4">
            <div className="flex items-start md:items-end justify-between -mt-8 md:-mt-16 mb-3 md:mb-4">
              {/* Profile Picture Skeleton */}
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-muted animate-pulse border-2 md:border-4 border-background" />
              
              {/* Action Button Skeleton */}
              <div className="h-9 w-24 md:w-32 bg-muted animate-pulse rounded-full mt-16 md:mt-0" />
            </div>
            
            {/* User Info Skeleton */}
            <div className="mb-3 md:mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="h-4 w-32 bg-muted animate-pulse rounded mb-3" />
              
              {/* Bio Skeleton */}
              <div className="space-y-2 mb-3">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </div>
              
              {/* Stats Skeleton */}
              <div className="flex items-center space-x-4 md:space-x-6">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="flex border-b border-border">
          <div className="flex-1 h-12 bg-muted/30 animate-pulse" />
          <div className="flex-1 h-12 bg-muted/30 animate-pulse" />
          <div className="flex-1 h-12 bg-muted/30 animate-pulse" />
        </div>
        
        {/* Content Skeleton */}
        <div>
          {[1, 2, 3].map((i) => (
            <TweetSkeleton key={i} showImage={i === 1} />
          ))}
        </div>
      </main>
    );
  }

  // Show not found state
  if (!isLoadingProfile && !user) {
    return (
      <main className="border-x border-border bg-background min-h-screen">
        <div className="px-4 lg:px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">User not found</h2>
          <p className="text-muted-foreground mb-6">The user you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full transition-colors"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Profile Header with Overlay */}
      <div className="border-b border-border">
        {/* Cover Image Placeholder with Edit Button and Full Header Overlay */}
        <div className="relative h-32 md:h-48 bg-gradient-to-r from-blue-400 to-purple-500 group overflow-hidden">
          {profileData?.cover ? (
            <img 
              src={profileData.cover} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : coverImage ? (
            <img 
              src={coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full"></div>
          )}
          
          {/* Full Header Overlay with Back Button and User Info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            {/* Top Navigation - No Background */}
            <div className="absolute top-0 left-0 right-0 px-3 md:px-4 lg:px-6 py-2 md:py-4 z-20 flex items-center space-x-3 md:space-x-4">
              <button
                onClick={() => router.back()}
                className="p-1.5 md:p-2 rounded-full hover:bg-white/20 transition-colors touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white drop-shadow">{user?.name || username}</h2>
                <p className="text-xs md:text-sm text-white/90 drop-shadow">
                  {profileData?.posts != null ? profileData.posts : userTweets.length} Posts
                </p>
              </div>
            </div>
          </div>
          
          {isCurrentUser && (
            <button 
              onClick={() => openUploadModal('cover')}
              className="absolute top-2 md:top-4 right-2 md:right-4 p-1.5 md:p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10"
            >
              <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </button>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="px-3 md:px-4 lg:px-6 pb-3 md:pb-4 relative z-10">
          {/* Profile Picture and Action Buttons in Flex */}
          <div className="flex items-start md:items-end justify-between -mt-8 md:-mt-16 mb-3 md:mb-4">
            {/* Profile Picture with Edit Button */}
            <div className="relative inline-block group">
              {profileData?.avatar ? (
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg border-2 md:border-4 border-background">
                  <img 
                    src={profileData.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : profileImage ? (
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg border-2 md:border-4 border-background">
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl md:text-4xl shadow-lg border-2 md:border-4 border-background">
                  {user?.name?.charAt(0).toUpperCase() || username.charAt(0).toUpperCase()}
                </div>
              )}
              {isCurrentUser && (
                <button 
                  onClick={() => openUploadModal('profile')}
                  className="absolute bottom-0 right-0 p-1 md:p-2 bg-black hover:bg-gray-800 rounded-full border-2 md:border-4 border-background transition-colors z-30"
                >
                  <Pencil className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            {!isCurrentUser ? (
              <div className="flex items-center space-x-1.5 md:space-x-2 mt-16 md:mt-0 md:pb-2">
                <button className="bg-black dark:bg-white text-white dark:text-black font-semibold md:font-bold text-sm md:text-base py-1.5 md:py-2 px-4 md:px-6 rounded-full hover:opacity-90 transition-opacity">
                  Follow
                </button>
                <button className="p-1.5 md:p-2 border border-border rounded-full hover:bg-accent transition-colors">
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 md:space-x-2 mt-16 md:mt-0 md:pb-2">
                <button
                  onClick={openEditModal}
                  className="bg-black dark:bg-white text-white dark:text-black font-semibold md:font-bold text-sm md:text-base py-1.5 md:py-2 px-4 md:px-6 rounded-full hover:opacity-90 transition-opacity"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="mb-3 md:mb-4">
            <div className="flex items-center space-x-1.5 md:space-x-2 mb-1.5 md:mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{user?.name || username}</h1>
              {user?.verified && (
                <svg viewBox="0 0 22 22" className="w-4 h-4 md:w-6 md:h-6 text-blue-500 fill-current">
                  <g>
                    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.42-3.41 1.42-1.42 2 2 5.5-5.5 1.42 1.42-6.92 6.91z"/>
                  </g>
                </svg>
              )}
            </div>
            <p className="text-muted-foreground text-sm md:text-base mb-2 md:mb-3">@{user?.username || username}</p>
            
            {/* Bio and Details */}
            {user?.bio && (
              <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                <p className="text-foreground text-sm md:text-base">
                  {user.bio}
                </p>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                  {user.website && (
                    <div className="flex items-center space-x-1">
                      <LinkIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500">{user.website}</a>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>Joined {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-4 md:space-x-6 text-xs md:text-sm mb-3 md:mb-4">
              <div className="hover:underline cursor-pointer">
                <span className="font-semibold text-foreground">
                  {profileData?.posts != null ? profileData.posts : userTweets.length}
                </span>
                <span className="text-muted-foreground ml-1">Posts</span>
              </div>
              <div className="hover:underline cursor-pointer">
                <span className="font-semibold text-foreground">
                  {formatNumber(profileData?.following != null ? profileData.following : 0)}
                </span>
                <span className="text-muted-foreground ml-1">Following</span>
              </div>
              <div className="hover:underline cursor-pointer">
                <span className="font-semibold text-foreground">
                  {formatNumber(profileData?.followers != null ? profileData.followers : 0)}
                </span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 min-w-[70px] md:min-w-[80px] py-2.5 md:py-4 text-center text-sm md:text-base font-semibold transition-colors relative ${
            activeTab === 'posts'
              ? 'text-foreground border-b-2 border-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab('bits')}
          className={`flex-1 min-w-[70px] md:min-w-[80px] py-2.5 md:py-4 text-center text-sm md:text-base font-semibold transition-colors relative ${
            activeTab === 'bits'
              ? 'text-foreground border-b-2 border-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Bits
        </button>
      </div>

      {/* Tab Content */}
      <div className="transition-opacity duration-200">
        {activeTab === 'posts' && (
          <div>
            {isLoadingPosts ? (
              <div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TweetSkeleton key={i} showImage={i % 3 === 0} />
                ))}
              </div>
            ) : (
              <>
                {/* Pinned Post */}
                {pinnedPost && (
                  <div className="border-b border-border">
                    <div className="px-3 md:px-4 lg:px-6 pt-3 md:pt-4 pb-1.5 md:pb-2 flex items-center space-x-1.5 md:space-x-2 text-muted-foreground text-xs md:text-sm">
                      <Pin className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                      <span>Pinned</span>
                    </div>
                    <TweetCard tweet={pinnedPost} />
                  </div>
                )}
                
                {/* Regular Posts */}
                {regularPosts.length > 0 ? (
                  <>
                    {regularPosts.map((tweet) => (
                      <TweetCard key={tweet.id} tweet={tweet} />
                    ))}
                    {/* Loading more indicator */}
                    {isLoadingMore && (
                      <div>
                        {[1, 2, 3].map((i) => (
                          <TweetSkeleton key={`more-${i}`} showImage={i === 2} />
                        ))}
                      </div>
                    )}
                    {/* End of feed indicator */}
                    {!hasMore && regularPosts.length > 0 && (
                      <div className="px-3 md:px-4 lg:px-6 py-8 text-center">
                        <p className="text-sm text-muted-foreground">You&apos;ve reached the end of the posts</p>
                      </div>
                    )}
                  </>
                ) : pinnedPost ? null : (
                  <div className="px-3 md:px-4 lg:px-6 py-8 md:py-12">
                    <div className="max-w-md mx-auto text-center">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 md:mb-4">
                        <Pin className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1.5 md:mb-2">No posts yet</h3>
                      <p className="text-muted-foreground text-sm md:text-base mb-4 md:mb-6">When you share your first post, it will show up here.</p>
                      {isCurrentUser && (
                        <button 
                          onClick={() => router.push('/compose')}
                          className="bg-black dark:bg-white text-white dark:text-black font-semibold md:font-bold text-sm md:text-base py-1.5 md:py-2 px-4 md:px-6 rounded-full hover:opacity-90 transition-opacity"
                        >
                          Create your first post
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'bits' && (
          <div>
            {isLoadingBits ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2 p-1 md:p-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-[9/16] bg-muted rounded-lg overflow-hidden">
                    {/* Video thumbnail skeleton */}
                    <div className="w-full h-full bg-muted animate-pulse relative">
                      {/* Play button skeleton */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-background/80 rounded-full animate-pulse flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground" />
                        </div>
                      </div>
                      {/* Bottom info skeleton */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="h-3 bg-white/20 rounded animate-pulse mb-1"></div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-8 bg-white/20 rounded animate-pulse"></div>
                          <div className="h-2 w-6 bg-white/20 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : userBits.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2 p-1 md:p-2">
                {userBits.map((bit) => (
                  <div 
                    key={bit.id} 
                    className="relative aspect-[9/16] bg-muted rounded-lg overflow-hidden group cursor-pointer"
                    onClick={() => {
                      // Navigate to bits page and scroll to this specific bit
                      // For now, just navigate to bits page
                      router.push('/play');
                    }}
                  >
                    {bit.video_file ? (
                      <video
                        src={bit.video_file}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        onMouseEnter={(e) => {
                          const video = e.currentTarget;
                          video.play().catch(() => {});
                        }}
                        onMouseLeave={(e) => {
                          const video = e.currentTarget;
                          video.pause();
                          video.currentTime = 0;
                        }}
                      />
                    ) : bit.images && bit.images.length > 0 ? (
                      <img 
                        src={bit.images[0]} 
                        alt={bit.content}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-4xl">🎬</span>
                      </div>
                    )}
                    
                    {/* Overlay with stats */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <p className="text-xs line-clamp-2 mb-2">{bit.content}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center space-x-1">
                              <Heart className="w-3 h-3" />
                              <span>{bit.likes > 999 ? `${(bit.likes/1000).toFixed(1)}K` : bit.likes}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{bit.replies > 999 ? `${(bit.replies/1000).toFixed(1)}K` : bit.replies}</span>
                            </span>
                          </div>
                          {bit.video_file && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                              <span>Video</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Play button overlay for videos */}
                    {bit.video_file && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Play className="w-6 h-6 text-white" fill="white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 lg:px-6 py-12">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No bits yet</h3>
                  <p className="text-muted-foreground mb-4">Your bits will appear here when you create them.</p>
                  {isCurrentUser && (
                    <button 
                      onClick={() => router.push('/play')}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full transition-colors"
                    >
                      Create your first bit
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">
                {uploadType === 'profile' ? 'Update Profile Picture' : 'Update Cover Photo'}
              </h3>
              <button
                onClick={closeUploadModal}
                className="p-2 rounded-full hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Upload Options */}
            <div className="p-6 space-y-4">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-foreground font-medium">Uploading image...</p>
                  <p className="text-sm text-muted-foreground mt-2">Please wait</p>
                </div>
              ) : (
                <>
                  {/* Option 1: Choose from Device */}
                  <label className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors group">
                    <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                      <Upload className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Choose from Device</p>
                      <p className="text-sm text-muted-foreground">Select an image from your phone or computer</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  {/* Option 2: Take Photo (Mobile) */}
                  <label className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors group">
                    <div className="p-3 bg-green-500/10 rounded-full group-hover:bg-green-500/20 transition-colors">
                      <Camera className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Take Photo</p>
                      <p className="text-sm text-muted-foreground">Use your camera to take a new picture</p>
                    </div>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraCapture}
                      className="hidden"
                    />
                  </label>

                  {/* Info */}
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Supported formats:</strong> JPG, PNG, GIF
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong className="text-foreground">Max size:</strong> 5MB
                    </p>
                    {uploadType === 'profile' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Recommended: Square image, at least 400x400px
                      </p>
                    )}
                    {uploadType === 'cover' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Recommended: 1500x500px for best results
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!isUploading && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
                <button
                  onClick={closeUploadModal}
                  className="px-4 py-2 text-foreground hover:bg-accent rounded-full transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full border border-border max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background">
              <h3 className="text-xl font-bold text-foreground">Edit Profile</h3>
              <button
                onClick={closeEditModal}
                className="p-2 rounded-full hover:bg-accent transition-colors"
                disabled={isSavingProfile}
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Edit Form */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                  disabled={isSavingProfile}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username"
                  disabled={isSavingProfile}
                />
                <p className="text-xs text-muted-foreground mt-1">Changing your username will update your profile URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bio
                </label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                  placeholder="Tell us about yourself"
                  disabled={isSavingProfile}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">{editFormData.bio.length}/160</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                  disabled={isSavingProfile}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-border sticky bottom-0 bg-background">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 border border-border rounded-full hover:bg-accent transition-colors text-foreground"
                disabled={isSavingProfile}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={isSavingProfile || !editFormData.name.trim()}
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingProfile ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

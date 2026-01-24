'use client';

import { useParams } from 'next/navigation';
import TweetCard from '@/components/TweetCard';
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, Image as ImageIcon, Heart, TrendingUp, Pin, Sparkles, Pencil, MessageCircle, X, Camera, Upload, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { getCurrentUser, getAuthToken, fetchUserProfile, fetchUserTrends, updateProfile, updateProfilePicture, updateCoverPicture, getUserBits, type UserProfile, type FeedPost } from '@/lib/api';
import type { User } from '@/types/auth';
import type { Tweet } from '@/types';

type TabType = 'posts' | 'replies' | 'media' | 'likes' | 'highlights';
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
  const [showEditModal, setShowEditModal] = useState(false);
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
      
      // Check if this is the current logged-in user
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user: User = JSON.parse(storedUser);
          if (user.username === username) {
            setIsCurrentUser(true);
            setCurrentUser(user);
          }
        } catch (e) {
          // Invalid JSON
        }
      }

      // Fetch profile data from API
      try {
        const response = await fetchUserProfile(username);
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
          
          // Check if this is the current user
          const token = getAuthToken();
          if (token) {
            const currentUserResponse = await getCurrentUser();
            if (currentUserResponse.data && currentUserResponse.data.username === username) {
              setIsCurrentUser(true);
              setCurrentUser(currentUserResponse.data);
            }
          }
        } else if (response.error) {
          console.error('Error fetching profile:', response.error);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [username]);

  // Fetch user's posts
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const response = await fetchUserTrends(username);
        
        // Backend returns 'trend' array instead of 'posts'
        const postsArray = (response.data as any)?.trend || response.data?.posts || [];
        
        if (postsArray.length > 0) {
          // Convert backend post format to Tweet format
          const convertedTweets: Tweet[] = postsArray.map((post: any) => ({
            id: String(post.id),
            user: {
              id: String(post.user?.id || post.user_id || ''),
              name: post.user?.name || '',
              username: post.user?.username || '',
              avatar: post.user?.picture || post.user?.avatar || undefined,
              verified: post.user?.verification !== null || post.user?.verified || false,
            },
            content: post.text || post.content || '',
            images: post.images ? (Array.isArray(post.images) ? post.images : [post.images]) : undefined,
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
          setUserTweets(convertedTweets);
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    loadPosts();
  }, [username]);

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

  // Get tweets with media
  const mediaTweets = userTweets.filter(tweet => tweet.images && tweet.images.length > 0);
  
  // Pinned post (first tweet as pinned if exists)
  const pinnedPost = userTweets.length > 0 ? userTweets[0] : null;
  const regularPosts = userTweets.slice(1);
  
  
  // Highlights (tweets with high engagement)
  const highlights = userTweets
    .filter(tweet => (tweet.likes + tweet.retweets) > 200)
    .sort((a, b) => (b.likes + b.retweets) - (a.likes + a.retweets));

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
    console.log('=== IMAGE UPLOAD START ===');
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size, 'bytes');
    console.log('Upload type:', uploadType);
    
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
        console.log('Base64 image length:', base64Image.length);
        console.log('Base64 preview (first 100 chars):', base64Image.substring(0, 100));
        
        try {
          let response;
          if (uploadType === 'profile') {
            console.log('Calling updateProfilePicture API...');
            response = await updateProfilePicture(base64Image);
            console.log('Update Profile Picture Response:', JSON.stringify(response, null, 2));
            console.log('Response Status:', response.status);
            console.log('Response Data:', response.data);
            console.log('Response Error:', response.error);
            
            if (response.data?.success && response.data.avatar) {
              console.log('✅ Profile picture update successful!');
              setProfileImage(response.data.avatar);
              // Reload profile to get updated data
              console.log('Reloading profile data...');
              const profileResponse = await fetchUserProfile(username);
              console.log('Profile Reload Response:', JSON.stringify(profileResponse, null, 2));
              
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
              console.error('❌ Profile picture update failed:', response.error);
              console.error('Full error response:', JSON.stringify(response, null, 2));
              alert(response.error || 'Failed to update profile picture');
            }
          } else if (uploadType === 'cover') {
            console.log('Calling updateCoverPicture API...');
            response = await updateCoverPicture(base64Image);
            console.log('Update Cover Picture Response:', JSON.stringify(response, null, 2));
            console.log('Response Status:', response.status);
            console.log('Response Data:', response.data);
            console.log('Response Error:', response.error);
            
            if (response.data?.success && response.data.cover) {
              console.log('✅ Cover picture update successful!');
              setCoverImage(response.data.cover);
              // Reload profile to get updated data
              console.log('Reloading profile data...');
              const profileResponse = await fetchUserProfile(username);
              console.log('Profile Reload Response:', JSON.stringify(profileResponse, null, 2));
              
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
              console.error('❌ Cover picture update failed:', response.error);
              console.error('Full error response:', JSON.stringify(response, null, 2));
              alert(response.error || 'Failed to update cover picture');
            }
          }
          
          setIsUploading(false);
          setUploadType(null);
          console.log('=== IMAGE UPLOAD END ===');
        } catch (error) {
          console.error('❌ Exception uploading image:', error);
          console.error('Error details:', error instanceof Error ? error.message : String(error));
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          alert('Failed to upload image. Please try again.');
          setIsUploading(false);
          console.log('=== IMAGE UPLOAD END (ERROR) ===');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Exception reading file:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      alert('Failed to read file. Please try again.');
      setIsUploading(false);
      console.log('=== IMAGE UPLOAD END (ERROR) ===');
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

    console.log('=== UPDATE PROFILE START ===');
    console.log('Form Data:', JSON.stringify(editFormData, null, 2));
    
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
      
      console.log('Update Payload:', JSON.stringify(updatePayload, null, 2));
      console.log('Calling updateProfile API...');
      
      const response = await updateProfile(updatePayload);
      
      console.log('Update Profile API Response:', JSON.stringify(response, null, 2));
      console.log('Response Status:', response.status);
      console.log('Response Data:', response.data);
      console.log('Response Error:', response.error);

      // Check for success: either response.data.success === true OR status 200 with success message
      const isSuccess = response.status === 200 && (
        response.data?.success === true || 
        response.data?.message?.toLowerCase().includes('success') ||
        !response.error
      );

      if (isSuccess) {
        console.log('✅ Profile update successful!');
        // Reload profile data
        console.log('Reloading profile data...');
        const profileResponse = await fetchUserProfile(username);
        console.log('Profile Reload Response:', JSON.stringify(profileResponse, null, 2));
        
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
          console.log('Mapped Profile Data:', JSON.stringify(mappedProfile, null, 2));
          setProfileData(mappedProfile);
        }
        setShowEditModal(false);
        // If username changed, redirect to new username
        if (editFormData.username.trim() !== username) {
          console.log('Username changed, redirecting...');
          router.push(`/profile/${editFormData.username.trim()}`);
        }
        console.log('=== UPDATE PROFILE SUCCESS ===');
      } else {
        console.error('❌ Profile update failed:', response.error);
        console.error('Full error response:', JSON.stringify(response, null, 2));
        alert(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Exception updating profile:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
      console.log('=== UPDATE PROFILE END ===');
    }
  };

  // Show loading state
  if (isLoadingProfile && !user) {
    return (
      <main className="border-x border-border bg-background min-h-screen">
        <div className="px-4 lg:px-6 py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading profile...</p>
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
          onClick={() => setActiveTab('replies')}
          className={`flex-1 min-w-[70px] md:min-w-[80px] py-2.5 md:py-4 text-center text-sm md:text-base font-semibold transition-colors relative ${
            activeTab === 'replies'
              ? 'text-foreground border-b-2 border-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Replies
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 min-w-[70px] md:min-w-[80px] py-2.5 md:py-4 text-center text-sm md:text-base font-semibold transition-colors relative ${
            activeTab === 'media'
              ? 'text-foreground border-b-2 border-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Media
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          className={`flex-1 min-w-[70px] md:min-w-[80px] py-2.5 md:py-4 text-center text-sm md:text-base font-semibold transition-colors relative ${
            activeTab === 'likes'
              ? 'text-foreground border-b-2 border-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Likes
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          className={`flex-1 min-w-[90px] md:min-w-[100px] py-2.5 md:py-4 text-center text-sm md:text-base font-semibold transition-colors relative ${
            activeTab === 'highlights'
              ? 'text-foreground border-b-2 border-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center justify-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Highlights</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="transition-opacity duration-200">
        {activeTab === 'posts' && (
          <div>
            {isLoadingPosts ? (
              <div className="px-3 md:px-4 lg:px-6 py-8 md:py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading posts...</p>
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
                  regularPosts.map((tweet) => (
                    <TweetCard key={tweet.id} tweet={tweet} />
                  ))
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

        {activeTab === 'replies' && (
          <div>
            <div className="px-4 lg:px-6 py-12">
              <div className="max-w-md mx-auto text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No replies yet</h3>
                <p className="text-muted-foreground mb-4">Your replies to other posts will appear here.</p>
                <div className="bg-muted/50 rounded-lg p-4 text-left">
                  <p className="text-sm text-muted-foreground mb-2">💡 Tip: Engage with the community by replying to posts you find interesting!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div>
            {mediaTweets.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1">
                {mediaTweets.map((tweet) => (
                  <Link
                    key={tweet.id}
                    href={`/post/${tweet.id}`}
                    className="relative aspect-square group overflow-hidden rounded-lg"
                  >
                    {tweet.images && tweet.images[0] && (
                      <img
                        src={tweet.images[0]}
                        alt="Media"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-4 text-white">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{tweet.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-sm">{tweet.replies}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 lg:px-6 py-12">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No media yet</h3>
                  <p className="text-muted-foreground mb-4">Photos and videos you share will appear here.</p>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground opacity-30" />
                      </div>
                    ))}
                  </div>
                  <button className="bg-black dark:bg-white text-white dark:text-black font-bold py-2 px-6 rounded-full hover:opacity-90 transition-opacity">
                    Share your first photo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'likes' && (
          <div>
            <div className="px-4 lg:px-6 py-12">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No likes yet</h3>
                  <p className="text-muted-foreground mb-4">Posts you like will be saved here for easy access.</p>
                  <div className="bg-muted/50 rounded-lg p-4 text-left mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-full mb-2"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>0</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>0</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">💡 Start liking posts to build your collection!</p>
                </div>
              </div>
          </div>
        )}

        {activeTab === 'highlights' && (
          <div>
            {highlights.length > 0 ? (
              <>
                <div className="px-4 lg:px-6 py-4 border-b border-border bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-foreground">Top Performing Posts</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Posts with the highest engagement</p>
                </div>
                {highlights.map((tweet) => (
                  <div key={tweet.id} className="border-b border-border relative">
                    <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{(tweet.likes + tweet.retweets).toLocaleString()}</span>
                    </div>
                    <TweetCard tweet={tweet} />
                  </div>
                ))}
              </>
            ) : (
              <div className="px-4 lg:px-6 py-12">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No highlights yet</h3>
                  <p className="text-muted-foreground mb-6">Your top-performing posts will automatically appear here.</p>
                  <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-foreground">How to get highlights</span>
                    </div>
                    <ul className="text-sm text-muted-foreground text-left space-y-2">
                      <li className="flex items-start space-x-2">
                        <span>✨</span>
                        <span>Create engaging content</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span>💬</span>
                        <span>Interact with your audience</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span>📈</span>
                        <span>Posts with 200+ total engagement appear here</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-muted-foreground">Keep creating great content to see your highlights!</p>
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

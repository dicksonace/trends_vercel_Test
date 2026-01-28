'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUp, Heart, MessageCircle, Share2, Bookmark, Play, Pause, Volume2, VolumeX, RefreshCw, AlertCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchBitsForYou, type FeedPost, getAuthToken, fetchPostComments, addComment, likeComment, deleteComment, type Comment } from '@/lib/api';

export default function PlayPage() {
  const [bits, setBits] = useState<FeedPost[]>([]);
  const [currentBitIndex, setCurrentBitIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const router = useRouter();

  // Comment states
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Load bits on component mount
  useEffect(() => {
    loadBits();
  }, []);

  const loadBits = async (page: number = 1, refresh: boolean = false) => {
    const token = getAuthToken();
    if (!token) {
      setError('Please login to view Bits');
      setIsLoading(false);
      return;
    }

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (page === 1) {
        setIsLoading(true);
      }
      setError(null);

      // Use random page for initial load and refresh (like discover feed)
      const randomPage = refresh || page === 1 ? Math.floor(Math.random() * 94) + 1 : page;

      const response = await fetchBitsForYou(randomPage, 20);
      
      if (response.status === 200 && response.data) {
        // The API returns nested structure: { data: { data: Array(20), ... } }
        const responseData = response.data as any;
        const newBits = responseData.data || responseData.posts || [];
        
        // Transform API response to match our component expectations
        const transformedBits = newBits.map((bit: any) => ({
          id: bit.id,
          content: bit.caption || '',
          video_file: bit.video_url,
          images: bit.image_urls || [],
          likes: bit.likes_count || 0,
          replies: bit.comments_count || 0,
          retweets: bit.shares_count || 0,
          liked: false, // API doesn't return this, we'll track locally
          bookmarked: false, // API doesn't return this, we'll track locally
          timestamp: bit.created_at,
          user: {
            id: bit.user.id,
            username: bit.user.username,
            name: bit.user.name,
            avatar: bit.user.picture,
            verified: false
          }
        }));
        
        if (page === 1 || refresh) {
          setBits(transformedBits);
        } else {
          setBits(prev => [...prev, ...transformedBits]);
        }
        
        setHasMore(transformedBits.length === 20);
        setCurrentPage(randomPage);
      } else {
        // Show more detailed error information
        let errorMessage = response.error || 'Failed to load Bits';
        if (response.status === 404) {
          errorMessage = 'Bits endpoint not found (404). The API might not be implemented yet.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication required. Please login again.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. You may not have permission to view Bits.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshBits = () => {
    setCurrentPage(1);
    setHasMore(true);
    loadBits(1, true);
  };

  // Comment functions
  const loadComments = async (bitId: string) => {
    console.log('🔍 DEBUG: Loading comments for bit:', bitId);
    setIsLoadingComments(true);
    try {
      const response = await fetchPostComments(bitId);
      console.log('🔍 DEBUG: Comments response:', response);
      console.log('🔍 DEBUG: Comments status:', response.status);
      console.log('🔍 DEBUG: Comments data:', response.data);
      
      if (response.status === 200 && response.data) {
        // Handle different response structures
        const commentsArray = response.data?.data || response.data?.comments || response.data || [];
        console.log('🔍 DEBUG: Extracted comments array:', commentsArray);
        console.log('🔍 DEBUG: Comments length:', commentsArray.length);
        
        if (Array.isArray(commentsArray)) {
          // Transform API response to match our Comment interface
          const transformedComments = commentsArray.map((comment: any) => ({
            id: String(comment.id),
            content: comment.content || comment.text || '',
            user: {
              id: String(comment.user?.id || ''),
              username: comment.user?.username || '',
              name: comment.user?.name || '',
              avatar: comment.user?.avatar || comment.user?.picture || '',
              verified: comment.user?.verified || false
            },
            likes: comment.likes_count || comment.likes || 0,
            replies: comment.replies_count || comment.replies || 0,
            liked: comment.liked || false,
            timestamp: comment.created_at || comment.timestamp || '',
            replies_data: comment.replies_data || []
          }));
          setComments(transformedComments);
          console.log('🔍 DEBUG: Transformed comments:', transformedComments);
        } else {
          setComments([]);
        }
      } else {
        console.log('🔍 DEBUG: Comments API failed with status:', response.status);
        setComments([]);
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error loading comments:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentBit) return;
    
    console.log('🔍 DEBUG: Adding comment:', newComment);
    setIsSubmittingComment(true);
    try {
      const response = await addComment(currentBit.id, newComment.trim());
      console.log('🔍 DEBUG: Add comment response:', response);
      
      if (response.status === 200 || response.status === 201) {
        setNewComment('');
        // Reload comments to get the new one
        await loadComments(currentBit.id);
        // Update the bit's reply count
        setBits(prev => prev.map((bit, index) => 
          index === currentBitIndex 
            ? { ...bit, replies: bit.replies + 1 }
            : bit
        ));
      } else {
        console.error('🔍 DEBUG: Failed to add comment:', response.error);
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    console.log('🔍 DEBUG: Liking comment:', commentId);
    try {
      const response = await likeComment(commentId);
      console.log('🔍 DEBUG: Like comment response:', response);
      
      if (response.status === 200) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                liked: !comment.liked, 
                likes: comment.liked ? comment.likes - 1 : comment.likes + 1 
              }
            : comment
        ));
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error liking comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    console.log('🔍 DEBUG: Deleting comment:', commentId);
    try {
      const response = await deleteComment(commentId);
      console.log('🔍 DEBUG: Delete comment response:', response);
      
      if (response.status === 200) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        // Update the bit's reply count
        setBits(prev => prev.map((bit, index) => 
          index === currentBitIndex 
            ? { ...bit, replies: Math.max(0, bit.replies - 1) }
            : bit
        ));
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error deleting comment:', error);
    }
  };

  // Load comments when comments modal is opened
  useEffect(() => {
    if (showComments && currentBit) {
      loadComments(currentBit.id);
    }
  }, [showComments, currentBitIndex]);

  // Video control functions
  const playVideo = (index: number) => {
    const video = videoRefs.current[bits[index]?.id];
    if (video) {
      video.play().catch(() => {});
    }
  };

  const pauseVideo = (index: number) => {
    const video = videoRefs.current[bits[index]?.id];
    if (video) {
      video.pause();
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseVideo(currentBitIndex);
    } else {
      playVideo(currentBitIndex);
    }
    setIsPlaying(!isPlaying);
  };

  // Handle video playback when current bit changes
  useEffect(() => {
    // Pause all videos
    Object.values(videoRefs.current).forEach(video => {
      if (video) video.pause();
    });

    // Play current video if playing state is true
    if (isPlaying && bits[currentBitIndex]) {
      playVideo(currentBitIndex);
    }
  }, [currentBitIndex, bits, isPlaying]);

  // Handle mute state changes
  useEffect(() => {
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  const currentBit = bits[currentBitIndex];

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      
      if (e.deltaY > 0 && currentBitIndex < bits.length - 1) {
        setCurrentBitIndex(prev => prev + 1);
        
        // Load more bits when approaching the end (infinite scroll)
        if (currentBitIndex >= bits.length - 3 && hasMore && !isLoading) {
          const nextPage = currentPage + 1;
          loadBits(nextPage, false);
        }
      } else if (e.deltaY < 0 && currentBitIndex > 0) {
        setCurrentBitIndex(prev => prev - 1);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleScroll, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleScroll);
      }
    };
  }, [currentBitIndex, bits.length, hasMore, isLoading, currentPage]);

  const handleLike = () => {
    setBits(prev => prev.map((bit: FeedPost, index: number) => 
      index === currentBitIndex 
        ? { 
            ...bit, 
            liked: !bit.liked, 
            likes: bit.liked ? bit.likes - 1 : bit.likes + 1 
          }
        : bit
    ));
  };

  const handleBookmark = () => {
    setBits(prev => prev.map((bit: FeedPost, index: number) => 
      index === currentBitIndex 
        ? { ...bit, bookmarked: !bit.bookmarked }
        : bit
    ));
  };

  const handleShare = () => {
    if (navigator.share && currentBit) {
      navigator.share({
        title: currentBit.content?.substring(0, 50) || 'Bit from TrendsHub',
        text: `Check out this bit by ${currentBit.user?.username || 'user'}`,
        url: window.location.href,
      });
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    switch(e.key) {
      case 'ArrowDown':
        if (currentBitIndex < bits.length - 1) {
          setCurrentBitIndex(prev => prev + 1);
        }
        break;
      case 'ArrowUp':
        if (currentBitIndex > 0) {
          setCurrentBitIndex(prev => prev - 1);
        }
        break;
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'm':
        setIsMuted(prev => !prev);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentBitIndex, bits.length]);

  return (
    <div className="h-screen w-full overflow-hidden bg-black relative">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-white text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading Bits...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-white text-center max-w-md mx-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="mb-4">{error}</p>
            <button
              onClick={refreshBits}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && bits.length === 0 && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-white text-center">
            <p>No Bits available</p>
            <button
              onClick={refreshBits}
              className="mt-4 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div 
        ref={containerRef}
        className="h-full w-full relative snap-y snap-mandatory overflow-y-hidden"
      >
        {bits.map((bit: FeedPost, index: number) => (
          <div
            key={bit.id}
            className={`h-full w-full relative snap-center flex-shrink-0 transition-transform duration-300 ${
              index === currentBitIndex ? 'block' : 'hidden'
            }`}
          >
            {/* Video/Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50">
              {bit.video_file ? (
                <video 
                  ref={(el) => {
                    if (el) {
                      videoRefs.current[bit.id] = el;
                      el.muted = isMuted;
                    }
                  }}
                  src={bit.video_file}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  onClick={togglePlayPause}
                />
              ) : bit.images && bit.images.length > 0 ? (
                <img 
                  src={bit.images[0]} 
                  alt={bit.content}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <div className="text-white text-center p-8">
                    <p className="text-lg font-medium mb-2">{bit.user?.name || '@' + bit.user?.username}</p>
                    <p className="text-sm opacity-80">{bit.content?.substring(0, 100) || 'No content'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls Overlay */}
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlayPause}
            >
              {!isPlaying && (
                <div className="bg-white/20 backdrop-blur-md rounded-full p-6 animate-pulse shadow-2xl border border-white/30">
                  <Play className="w-16 h-16 text-white drop-shadow-lg" fill="white" />
                </div>
              )}
            </div>

            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-5">
              {/* Author Avatar */}
              <div className="relative group">
                <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden ring-2 ring-white/20 transition-all duration-300 group-hover:ring-white/40">
                  {bit.user?.avatar ? (
                    <img 
                      src={bit.user.avatar} 
                      alt={bit.user.name || bit.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {(bit.user?.name || bit.user?.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs">+</span>
                </div>
              </div>

              {/* Like */}
              <button
                onClick={handleLike}
                className="flex flex-col items-center space-y-1 group"
              >
                <div className={`w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-300 group-hover:scale-110 ${
                  bit.liked ? 'bg-red-500/30 ring-2 ring-red-500/50' : ''
                }`}>
                  <Heart className={`w-6 h-6 transition-all duration-300 ${bit.liked ? 'text-red-500 fill-red-500 scale-110' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-medium">{bit.likes > 999 ? `${(bit.likes/1000).toFixed(1)}K` : bit.likes}</span>
              </button>

              {/* Comment */}
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex flex-col items-center space-y-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{bit.replies > 999 ? `${(bit.replies/1000).toFixed(1)}K` : bit.replies}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex flex-col items-center space-y-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{bit.retweets > 999 ? `${(bit.retweets/1000).toFixed(1)}K` : bit.retweets}</span>
              </button>

              {/* Bookmark */}
              <button
                onClick={handleBookmark}
                className="flex flex-col items-center space-y-1 group"
              >
                <div className={`w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-300 group-hover:scale-110 ${
                  bit.bookmarked ? 'bg-yellow-500/30 ring-2 ring-yellow-500/50' : ''
                }`}>
                  <Bookmark className={`w-6 h-6 transition-all duration-300 ${bit.bookmarked ? 'text-yellow-500 fill-yellow-500 scale-110' : 'text-white'}`} />
                </div>
              </button>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-20 p-4 pb-8">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Link 
                    href={`/profile/${bit.user?.username}`}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-white font-bold text-lg">@{bit.user?.username}</h3>
                    {bit.user?.verified && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </Link>
                </div>
                <p className="text-white text-sm leading-relaxed break-words">{bit.content}</p>
                <div className="flex items-center space-x-2 text-white/80 text-xs">
                  <span className="flex items-center space-x-1">
                    <span>♬</span>
                    <span>Original Sound</span>
                  </span>
                  <span>•</span>
                  <span>{new Date(bit.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Comments Overlay */}
            {showComments && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-white/20">
                  <h3 className="text-white font-semibold text-lg">Comments ({currentBit?.replies || 0})</h3>
                  <button
                    onClick={() => setShowComments(false)}
                    className="text-white/80 hover:text-white p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
                          {comment.user.avatar ? (
                            <img 
                              src={comment.user.avatar} 
                              alt={comment.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {comment.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white font-semibold text-sm">{comment.user.name}</span>
                            <span className="text-white/60 text-sm">@{comment.user.username}</span>
                            {comment.user.verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <p className="text-white text-sm mb-2">{comment.content}</p>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              className="flex items-center space-x-1 text-white/60 hover:text-white transition-colors"
                            >
                              <Heart className={`w-4 h-4 ${comment.liked ? 'fill-red-500 text-red-500' : ''}`} />
                              <span className="text-xs">{comment.likes}</span>
                            </button>
                            <button className="flex items-center space-x-1 text-white/60 hover:text-white transition-colors">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-xs">{comment.replies}</span>
                            </button>
                            <span className="text-white/40 text-xs">
                              {new Date(comment.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-white/20">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      disabled={isSubmittingComment}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-full px-4 py-2 transition-colors disabled:opacity-50"
                    >
                      {isSubmittingComment ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        'Post'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      {!isLoading && !error && (
        <button
          onClick={refreshBits}
          disabled={isRefreshing}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/30 transition-colors disabled:opacity-50 z-10"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}

      {/* Loading More Indicator */}
      {isLoading && bits.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
          Loading more bits...
        </div>
      )}
    </div>
  );
}

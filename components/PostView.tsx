'use client';

import { MessageCircle, Repeat2, Heart, Share2, ArrowLeft, Bookmark } from 'lucide-react';
import { Tweet } from '@/types';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchComments, postComment, likeComment, reactToPost, getLikeStatus, toggleBookmark, getBookmarkStatus, getAuthToken } from '@/lib/api';
import type { Comment } from '@/lib/api';

interface PostViewProps {
  tweet: Tweet;
}

export default function PostView({ tweet }: PostViewProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(tweet.liked || false);
  const [isRetweeted, setIsRetweeted] = useState(tweet.retweeted || false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(tweet.likes);
  const [retweets, setRetweets] = useState(tweet.retweets);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Fetch comments on mount
  useEffect(() => {
    const loadComments = async () => {
      setIsLoadingComments(true);
      try {
        const response = await fetchComments(tweet.id);
        if (response.data) {
          setComments(response.data.comments || []);
        }
      } catch (error) {
        // console.error('Error fetching comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    loadComments();
  }, [tweet.id]);

  // Fetch like and bookmark status on mount (only if not already provided in tweet prop)
  // Use initial state from tweet prop to avoid unnecessary API calls and rate limiting
  useEffect(() => {
    const fetchStatus = async () => {
      const token = getAuthToken();
      if (!token) return;

      // Use initial state from tweet prop if available
      if (tweet.liked !== undefined) {
        setIsLiked(tweet.liked);
      }
      if (tweet.bookmarked !== undefined) {
        setIsBookmarked(tweet.bookmarked);
      }

      // Only fetch status if we don't have it from the tweet prop
      // Add a small delay to avoid rate limiting
      const shouldFetch = tweet.liked === undefined || tweet.bookmarked === undefined;
      
      if (shouldFetch) {
        try {
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const [likeStatus, bookmarkStatus] = await Promise.all([
            getLikeStatus(tweet.id),
            getBookmarkStatus(tweet.id),
          ]);

          // Only update if we got valid responses (not 429 errors)
          if (likeStatus.status === 200 && likeStatus.data) {
            setIsLiked(likeStatus.data.liked);
          } else if (likeStatus.status === 429) {
            // console.warn('Rate limited for like status, using initial state from tweet prop');
          }
          
          if (bookmarkStatus.status === 200 && bookmarkStatus.data) {
            setIsBookmarked(bookmarkStatus.data.bookmarked);
          } else if (bookmarkStatus.status === 429) {
            // console.warn('Rate limited for bookmark status, using initial state from tweet prop');
          }
        } catch (error) {
          // console.error('Error fetching status:', error);
          // On error, keep using the initial state from tweet prop
        }
      }
    };

    fetchStatus();
  }, [tweet.id, tweet.liked, tweet.bookmarked]);

  const handleLike = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Optimistic update
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikes(newLiked ? likes + 1 : likes - 1);

    try {
      const response = await reactToPost(tweet.id);
      if (response.error) {
        // Revert on error
        setIsLiked(!newLiked);
        setLikes(newLiked ? likes : likes + 1);
        // console.error('Error liking post:', response.error);
      } else if (response.data) {
        setIsLiked(response.data.liked);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!newLiked);
      setLikes(newLiked ? likes : likes + 1);
      // console.error('Error liking post:', error);
    }
  };

  const handleRetweet = () => {
    setIsRetweeted(!isRetweeted);
    setRetweets(isRetweeted ? retweets - 1 : retweets + 1);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || isPostingComment) return;

    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setIsPostingComment(true);
    try {
      const response = await postComment(tweet.id, { content: newComment.trim() });
      if (response.error) {
        // console.error('Error posting comment:', response.error);
        alert(response.error);
      } else if (response.data?.comment) {
        setComments([response.data.comment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      // console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleBack = () => {
    // Navigate back - scroll position will be restored automatically by the home page
    router.push('/');
  };

  return (
    <div className="bg-background min-h-screen transition-colors">
      {/* Header with Back Button */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4 z-10 flex items-center space-x-4 shadow-sm">
        <button
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Post</h2>
      </div>

      {/* Post Content */}
      <article className="border-b border-border px-4 lg:px-6 py-6">
        <div className="flex space-x-4">
          {/* Profile Picture - Clickable */}
          <Link
            href={`/profile/${tweet.user.username}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              router.push(`/profile/${tweet.user.username}`);
            }}
            className="flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
              {tweet.user.name.charAt(0).toUpperCase()}
            </div>
          </Link>

          {/* Tweet Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-2">
              <Link
                href={`/profile/${tweet.user.username}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.push(`/profile/${tweet.user.username}`);
                }}
                className="font-bold text-gray-900 dark:text-white text-lg hover:underline cursor-pointer"
              >
                {tweet.user.name}
              </Link>
              {tweet.user.verified && (
                <svg viewBox="0 0 22 22" className="w-5 h-5 text-blue-500 fill-current">
                  <g>
                    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.42-3.41 1.42-1.42 2 2 5.5-5.5 1.42 1.42-6.92 6.91z"/>
                  </g>
                </svg>
              )}
              <Link
                href={`/profile/${tweet.user.username}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.push(`/profile/${tweet.user.username}`);
                }}
                className="text-muted-foreground hover:underline cursor-pointer"
              >
                @{tweet.user.username}
              </Link>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground hover:underline">{tweet.timestamp}</span>
            </div>

            {/* Tweet Text */}
            <p className="text-foreground mb-4 leading-relaxed text-lg break-words whitespace-pre-wrap">
              {tweet.content}
            </p>

            {/* Images/Media */}
            {tweet.images && tweet.images.length > 0 && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-border shadow-sm">
                <img
                  src={tweet.images[0]}
                  alt="Trend media"
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Timestamp */}
            <div className="mb-4 pb-4 border-b border-border">
              <span className="text-muted-foreground text-sm">{tweet.timestamp}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 mb-4 pb-4 border-b border-border text-sm">
              <span className="text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
                <span className="font-bold text-gray-900 dark:text-white">{retweets}</span> Retweets
              </span>
              <span className="text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
                <span className="font-bold text-gray-900 dark:text-white">{tweet.replies}</span> Replies
              </span>
              <span className="text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
                <span className="font-bold text-gray-900 dark:text-white">{likes}</span> Likes
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between max-w-md">
              <button className="group flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors touch-manipulation min-w-[44px] min-h-[44px] justify-center rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <div className="p-2">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-sm">{tweet.replies}</span>
              </button>

              <button
                onClick={handleRetweet}
                className={`group flex items-center space-x-2 transition-colors touch-manipulation min-w-[44px] min-h-[44px] justify-center rounded-full ${
                  isRetweeted 
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
              >
                <div className="p-2">
                  <Repeat2 className="w-4 h-4" />
                </div>
                <span className={`text-sm ${isRetweeted ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {retweets}
                </span>
              </button>

              <button
                onClick={handleLike}
                className={`group flex items-center space-x-2 transition-colors touch-manipulation min-w-[44px] min-h-[44px] justify-center rounded-full ${
                  isLiked 
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                <div className="p-2">
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className={`text-sm ${isLiked ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {likes}
                </span>
              </button>

              <button
                onClick={async () => {
                  const token = getAuthToken();
                  if (!token) {
                    router.push('/login');
                    return;
                  }

                  // Optimistic update
                  const newBookmarked = !isBookmarked;
                  setIsBookmarked(newBookmarked);

                  try {
                    const response = await toggleBookmark(tweet.id);
                    if (response.error) {
                      // Revert on error
                      setIsBookmarked(!newBookmarked);
                      // console.error('Error bookmarking post:', response.error);
                    } else if (response.data) {
                      setIsBookmarked(response.data.bookmarked);
                    }
                  } catch (error) {
                    // Revert on error
                    setIsBookmarked(!newBookmarked);
                    // console.error('Error bookmarking post:', error);
                  }
                }}
                className={`group flex items-center space-x-2 transition-colors touch-manipulation min-w-[44px] min-h-[44px] justify-center rounded-full ${
                  isBookmarked
                    ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <div className="p-2">
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </div>
              </button>

              <button className="group flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors touch-manipulation min-w-[44px] min-h-[44px] justify-center rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <div className="p-2">
                  <Share2 className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Comment Input */}
      <div className="border-b border-border px-4 lg:px-6 py-4 bg-background">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              Y
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Trend your reply"
              className="w-full resize-none border-none outline-none text-lg placeholder-muted-foreground min-h-[100px] focus:outline-none bg-background dark:bg-[#0a0a0a] text-foreground transition-colors"
            />
            <div className="flex items-center justify-end mt-4">
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim() || isPostingComment}
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {isPostingComment ? 'Posting...' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List - Automatically shown */}
      <div>
        {isLoadingComments ? (
          <div className="px-4 lg:px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <p>Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="border-b border-border px-4 lg:px-6 py-4 hover:bg-accent transition-colors"
            >
              <div className="flex space-x-4">
                {/* Profile Picture - Clickable */}
                <Link
                  href={`/profile/${comment.user.username}`}
                  className="flex-shrink-0"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg hover:opacity-90 transition-opacity cursor-pointer">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                </Link>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center space-x-2 mb-1">
                    <Link
                      href={`/profile/${comment.user.username}`}
                      className="font-bold text-gray-900 dark:text-white hover:underline cursor-pointer"
                    >
                      {comment.user.name}
                    </Link>
                    {comment.user.verified && (
                      <svg viewBox="0 0 22 22" className="w-5 h-5 text-blue-500 fill-current">
                        <g>
                          <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.42-3.41 1.42-1.42 2 2 5.5-5.5 1.42 1.42-6.92 6.91z"/>
                        </g>
                      </svg>
                    )}
                    <Link
                      href={`/profile/${comment.user.username}`}
                      className="text-gray-500 dark:text-gray-400 text-sm hover:underline cursor-pointer"
                    >
                      @{comment.user.username}
                    </Link>
                    <span className="text-gray-500 dark:text-gray-400">·</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{comment.timestamp}</span>
                  </div>

                  {/* Comment Text */}
                  <p className="text-gray-900 dark:text-white mb-3 leading-relaxed break-words">{comment.content}</p>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between max-w-md mt-2">
                    <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center">
                      <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-sm hidden sm:inline">{comment.replies}</span>
                    </button>

                    <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center">
                      <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20">
                        <Repeat2 className="w-4 h-4" />
                      </div>
                    </button>

                    <button
                      onClick={async () => {
                        const token = getAuthToken();
                        if (!token) {
                          router.push('/login');
                          return;
                        }

                        try {
                          await likeComment(comment.id);
                          // Refresh comments to get updated like count
                          const response = await fetchComments(tweet.id);
                          if (response.data) {
                            setComments(response.data.comments || []);
                          }
                        } catch (error) {
                          // console.error('Error liking comment:', error);
                        }
                      }}
                      className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center"
                    >
                      <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20">
                        <Heart className={`w-4 h-4 ${comment.liked ? 'fill-current text-red-500' : ''}`} />
                      </div>
                      <span className="text-sm hidden sm:inline">{comment.likes}</span>
                    </button>

                    <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center">
                      <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                        <Bookmark className="w-4 h-4" />
                      </div>
                    </button>

                    <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group touch-manipulation min-w-[44px] min-h-[44px] justify-center">
                      <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                        <Share2 className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="px-4 lg:px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <p>No comments yet. Be the first to reply!</p>
          </div>
        )}
      </div>
    </div>
  );
}

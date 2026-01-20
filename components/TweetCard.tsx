'use client';

import { MessageCircle, Repeat2, Heart, Share2, BarChart3 } from 'lucide-react';
import { Tweet } from '@/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TweetCardProps {
  tweet: Tweet;
  isHighlighted?: boolean;
}

export default function TweetCard({ tweet, isHighlighted = false }: TweetCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(tweet.liked || false);
  const [isRetweeted, setIsRetweeted] = useState(tweet.retweeted || false);
  const [likes, setLikes] = useState(tweet.likes);
  const [retweets, setRetweets] = useState(tweet.retweets);
  const [pollVotes, setPollVotes] = useState(tweet.poll?.votes || []);
  const [userVote, setUserVote] = useState(tweet.poll?.userVote);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleRetweet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRetweeted(!isRetweeted);
    setRetweets(isRetweeted ? retweets - 1 : retweets + 1);
  };

  const handlePollVote = (e: React.MouseEvent, optionIndex: number) => {
    e.stopPropagation();
    if (!tweet.poll || userVote !== undefined) return; // Already voted or no poll
    
    const newVotes = [...pollVotes];
    newVotes[optionIndex] += 1;
    setPollVotes(newVotes);
    setUserVote(optionIndex);
  };

  const getPollPercentage = (votes: number[], totalVotes: number, index: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes[index] / totalVotes) * 100);
  };

  const getTotalPollVotes = (votes: number[]) => {
    return votes.reduce((sum, vote) => sum + vote, 0);
  };

  const isPollEnded = (endTime?: string) => {
    if (!endTime) return false;
    return new Date(endTime) < new Date();
  };

  const handleCardClick = () => {
    // Store current scroll position before navigating
    // Use requestAnimationFrame to get accurate scroll position
    requestAnimationFrame(() => {
      const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      sessionStorage.setItem('feedScrollPosition', scrollPosition.toString());
      sessionStorage.setItem('lastViewedPostId', tweet.id);
      
      // Small delay to ensure storage is set before navigation
      setTimeout(() => {
        router.push(`/post/${tweet.id}`);
      }, 0);
    });
  };

  return (
    <article
      onClick={handleCardClick}
      className={`border-b border-border px-4 lg:px-6 py-4 hover:bg-accent transition-colors cursor-pointer bg-background ${
        isHighlighted ? 'bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800' : ''
      }`}
    >
      <div className="flex space-x-4">
        {/* Profile Picture - Clickable */}
        <Link
          href={`/profile/${tweet.user.username}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
            {tweet.user.name.charAt(0).toUpperCase()}
          </div>
        </Link>

        {/* Tweet Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1 flex-wrap">
            <Link
              href={`/profile/${tweet.user.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-foreground hover:underline cursor-pointer"
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
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground text-sm hover:underline cursor-pointer"
            >
              @{tweet.user.username}
            </Link>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-muted-foreground text-sm hover:underline">{tweet.timestamp}</span>
          </div>

          {/* Tweet Text */}
          <p className="text-foreground mb-3 leading-relaxed text-[15px] break-words whitespace-pre-wrap">
            {tweet.content}
          </p>

          {/* Images/Media */}
          {tweet.images && tweet.images.length > 0 && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-border shadow-sm">
              <img
                src={tweet.images[0]}
                alt="Trend media"
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Poll Display */}
          {tweet.poll && (
            <div className="mb-3 space-y-2">
              <div className="border border-border rounded-xl p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">
                    {isPollEnded(tweet.poll.endTime) 
                      ? 'Final results' 
                      : `${tweet.poll.duration} day${tweet.poll.duration !== '1' ? 's' : ''} left`}
                  </span>
                </div>
                {tweet.poll.options.map((option, index) => {
                  const totalVotes = getTotalPollVotes(pollVotes);
                  const percentage = getPollPercentage(pollVotes, totalVotes, index);
                  const isVoted = userVote === index;
                  const hasVoted = userVote !== undefined;
                  const pollEnded = isPollEnded(tweet.poll?.endTime);
                  
                  return (
                    <button
                      key={index}
                      onClick={(e) => handlePollVote(e, index)}
                      disabled={hasVoted || pollEnded}
                      className={`w-full mb-2 last:mb-0 relative overflow-hidden rounded-lg border-2 transition-all ${
                        isVoted
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : hasVoted || pollEnded
                          ? 'border-border bg-background cursor-default'
                          : 'border-border bg-background hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer'
                      }`}
                    >
                      <div className="relative z-10 flex items-center justify-between p-3">
                        <span className={`text-sm font-medium ${
                          isVoted ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'
                        }`}>
                          {option}
                        </span>
                        {(hasVoted || pollEnded) && (
                          <span className={`text-sm font-semibold ${
                            isVoted ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                          }`}>
                            {percentage}%
                          </span>
                        )}
                      </div>
                      {(hasVoted || pollEnded) && (
                        <div
                          className={`absolute inset-y-0 left-0 bg-blue-200 dark:bg-blue-800/30 transition-all duration-500 ${
                            isVoted ? 'bg-blue-300 dark:bg-blue-700/40' : ''
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      )}
                    </button>
                  );
                })}
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {getTotalPollVotes(pollVotes)} vote{getTotalPollVotes(pollVotes) !== 1 ? 's' : ''}
                    {userVote !== undefined && ' · You voted'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between max-w-md mt-3">
            {/* Reply Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Store scroll position for reply button too
                requestAnimationFrame(() => {
                  const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                  sessionStorage.setItem('feedScrollPosition', scrollPosition.toString());
                  sessionStorage.setItem('lastViewedPostId', tweet.id);
                  setTimeout(() => {
                    router.push(`/post/${tweet.id}`);
                  }, 0);
                });
              }}
              className="group flex items-center space-x-2 text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 touch-manipulation min-w-[44px] min-h-[44px] justify-center rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <div className="p-2">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">{tweet.replies}</span>
            </button>

            {/* Retweet Button */}
            <button
              onClick={handleRetweet}
              className={`group flex items-center space-x-2 touch-manipulation min-w-[44px] min-h-[44px] justify-center rounded-full ${
                isRetweeted 
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                  : 'text-muted-foreground hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              <div className="p-2">
                <Repeat2 className="w-5 h-5" />
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${isRetweeted ? 'text-green-600 dark:text-green-400' : ''}`}>
                {retweets}
              </span>
            </button>

            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`group flex items-center space-x-2 touch-manipulation min-w-[44px] min-h-[44px] justify-center rounded-full ${
                isLiked 
                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' 
                  : 'text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <div className="p-2">
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${isLiked ? 'text-red-600 dark:text-red-400' : ''}`}>
                {likes}
              </span>
            </button>

            {/* Share Button */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="group flex items-center space-x-2 text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 touch-manipulation min-w-[44px] min-h-[44px] justify-center rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <div className="p-2">
                <Share2 className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

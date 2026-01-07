'use client';

import { Search, X, MoreHorizontal } from 'lucide-react';
import { TrendingTopic, SuggestedUser } from '@/types';
import { useState } from 'react';

interface SidebarProps {
  trendingTopics: TrendingTopic[];
  suggestedUsers: SuggestedUser[];
}

export default function Sidebar({ trendingTopics, suggestedUsers }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Show first 3 users in "You might like"
  const youMightLikeUsers = suggestedUsers.slice(0, 3);

  return (
    <>
      {/* Mobile Search Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
              className="lg:hidden fixed top-4 right-4 z-50 p-3 rounded-full bg-background shadow-lg border border-border touch-manipulation"
        aria-label="Open sidebar"
      >
        <Search className="w-6 h-6 text-foreground" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile Slide-in */}
      <aside
        className={`
          h-screen w-[400px] px-6 py-6 bg-background z-40
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0 fixed right-0 top-0' : 'translate-x-full fixed right-0 top-0'}
          flex flex-col overflow-hidden
        `}
        style={{ transitionProperty: 'transform' }}
      >
        {/* Close Button (Mobile Only) */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 left-4 p-2 rounded-full hover:bg-accent touch-manipulation"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Search Bar */}
        <div className="mb-6 mt-12 lg:mt-0 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-muted dark:bg-[#1a1d2b] rounded-full py-3 pl-12 pr-4 border border-border outline-none focus:bg-background dark:focus:bg-[#252830] focus:ring-2 focus:ring-primary transition-all text-base touch-manipulation text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Content - No scroll, just visible content */}
        <div className="flex-1 overflow-hidden">
          {/* Trending Now / What's happening */}
          <div className="bg-muted rounded-2xl p-4 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Trending now</h3>
            <div className="space-y-4">
              {trendingTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="hover:bg-accent rounded-lg p-3 cursor-pointer transition-colors touch-manipulation"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{topic.category}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">Trending</span>
                  </div>
                  <p className="font-bold text-foreground">{topic.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{topic.tweetCount} posts</p>
                </div>
              ))}
              <button className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium pt-2">
                Show more
              </button>
            </div>
          </div>

          {/* You might like */}
          <div className="bg-muted rounded-2xl p-4 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">You might like</h3>
            <div className="space-y-4">
              {youMightLikeUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-3 cursor-pointer transition-colors touch-manipulation"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-foreground">{user.name}</span>
                        {user.verified && (
                          <svg viewBox="0 0 22 22" className="w-4 h-4 text-blue-500 fill-current">
                            <g>
                              <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.42-3.41 1.42-1.42 2 2 5.5-5.5 1.42 1.42-6.92 6.91z"/>
                            </g>
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                        <button className="bg-foreground hover:bg-muted-foreground text-background font-bold py-2 px-4 rounded-full text-sm transition-colors touch-manipulation min-w-[80px]">
                    Follow
                  </button>
                </div>
              ))}
              <button className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium pt-2">
                Show more
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pb-6 flex-shrink-0">
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <a href="#" className="hover:underline">Terms of Service</a>
            <span>|</span>
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:underline">Cookie Policy</a>
            <span>|</span>
            <a href="#" className="hover:underline">Accessibility</a>
            <span>|</span>
            <a href="#" className="hover:underline">Ads info</a>
            <span>|</span>
            <button className="hover:underline flex items-center gap-1">
              More
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            © 2026 TrendsHub Corp.
          </div>
        </div>
      </aside>
    </>
  );
}

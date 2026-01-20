'use client';

import { Bell, Heart, MessageCircle, Repeat2, UserPlus, CheckCircle, AtSign } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type TabType = 'all' | 'mentions';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const notifications = [
    {
      id: 1,
      type: 'like',
      user: 'John Doe',
      username: 'johndoe',
      action: 'liked your post',
      time: '2m',
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      avatar: 'JD',
    },
    {
      id: 2,
      type: 'reply',
      user: 'Jane Smith',
      username: 'janesmith',
      action: 'replied to your post',
      time: '15m',
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      avatar: 'JS',
      isMention: true,
    },
    {
      id: 6,
      type: 'mention',
      user: 'Alex Johnson',
      username: 'alexj',
      action: 'mentioned you in a post',
      time: '5m',
      icon: AtSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      avatar: 'AJ',
      isMention: true,
    },
    {
      id: 3,
      type: 'retweet',
      user: 'Tech News',
      username: 'technews',
      action: 'retweeted your post',
      time: '1h',
      icon: Repeat2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      avatar: 'TN',
    },
    {
      id: 4,
      type: 'follow',
      user: 'Sarah Wilson',
      username: 'sarahw',
      action: 'started following you',
      time: '3h',
      icon: UserPlus,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      avatar: 'SW',
    },
    {
      id: 5,
      type: 'verified',
      user: 'TrendsHub',
      username: 'trendshub',
      action: 'verified your account',
      time: '1d',
      icon: CheckCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      avatar: 'TH',
      verified: true,
    },
  ];

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
              activeTab === 'all'
                ? 'text-foreground border-b-2 border-blue-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('mentions')}
            className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
              activeTab === 'mentions'
                ? 'text-foreground border-b-2 border-blue-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mentions
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-border">
        {notifications
          .filter((notification) => 
            activeTab === 'all' ? true : notification.isMention === true
          )
          .map((notification) => {
          const Icon = notification.icon;
          return (
            <Link
              key={notification.id}
              href={`/profile/${notification.username}`}
              className="block px-4 lg:px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {notification.avatar}
                  </div>
                </div>
                
                {/* Icon Badge */}
                <div className={`p-2 rounded-full ${notification.bgColor} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${notification.color}`} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">
                    <span className="font-semibold">
                      {notification.user}
                    </span>
                    {' '}
                    <span className="text-muted-foreground">@{notification.username}</span>
                    {' '}
                    {notification.action}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{notification.time} ago</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State (if no notifications) */}
      {notifications.filter((notification) => 
        activeTab === 'all' ? true : notification.isMention === true
      ).length === 0 && (
        <div className="px-4 lg:px-6 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            {activeTab === 'mentions' ? (
              <AtSign className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Bell className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {activeTab === 'mentions' ? 'No mentions yet' : 'No notifications yet'}
          </h3>
          <p className="text-muted-foreground">
            {activeTab === 'mentions' 
              ? "When someone mentions you, it'll show up here."
              : "When you get notifications, they'll show up here."
            }
          </p>
        </div>
      )}
    </main>
  );
}

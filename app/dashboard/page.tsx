'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    // Get user name from localStorage or use default
    const storedName = localStorage.getItem('userName') || 'User';
    setUserName(storedName);
  }, []);

  const currentTime = new Date();
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <main className="border-x border-border bg-background min-h-screen">
      <div className="px-4 lg:px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {greeting}, {userName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Welcome to your dashboard. Here's what's happening today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-muted rounded-lg p-6 border border-border">
            <div className="text-sm text-muted-foreground mb-1">Total Posts</div>
            <div className="text-2xl font-bold text-foreground">0</div>
          </div>
          <div className="bg-muted rounded-lg p-6 border border-border">
            <div className="text-sm text-muted-foreground mb-1">Followers</div>
            <div className="text-2xl font-bold text-foreground">0</div>
          </div>
          <div className="bg-muted rounded-lg p-6 border border-border">
            <div className="text-sm text-muted-foreground mb-1">Following</div>
            <div className="text-2xl font-bold text-foreground">0</div>
          </div>
          <div className="bg-muted rounded-lg p-6 border border-border">
            <div className="text-sm text-muted-foreground mb-1">Likes</div>
            <div className="text-2xl font-bold text-foreground">0</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-muted rounded-lg p-6 border border-border mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-left">
              Create New Post
            </button>
            <button className="bg-background hover:bg-accent border border-border text-foreground font-semibold py-3 px-6 rounded-lg transition-colors text-left">
              View Profile
            </button>
            <button className="bg-background hover:bg-accent border border-border text-foreground font-semibold py-3 px-6 rounded-lg transition-colors text-left">
              Settings
            </button>
            <button className="bg-background hover:bg-accent border border-border text-foreground font-semibold py-3 px-6 rounded-lg transition-colors text-left">
              Analytics
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-muted rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity to display.</p>
            <p className="text-sm mt-2">Start posting to see your activity here!</p>
          </div>
        </div>
      </div>
    </main>
  );
}




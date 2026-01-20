'use client';

import { useEffect, useState } from 'react';
import { FileText, Users, UserPlus, Heart, Plus, User, Settings, BarChart3, Activity } from 'lucide-react';
import Link from 'next/link';

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

  const stats = [
    { label: 'Total Posts', value: '24', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'Followers', value: '1.2K', icon: Users, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { label: 'Following', value: '856', icon: UserPlus, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { label: 'Total Likes', value: '5.8K', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  ];

  const quickActions = [
    { label: 'Create New Post', icon: Plus, href: '/', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { label: 'View Profile', icon: User, href: '/profile/johndoe', color: 'bg-background hover:bg-accent border border-border text-foreground' },
    { label: 'Settings', icon: Settings, href: '/more', color: 'bg-background hover:bg-accent border border-border text-foreground' },
    { label: 'Analytics', icon: BarChart3, href: '/more', color: 'bg-background hover:bg-accent border border-border text-foreground' },
  ];

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
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-muted/50 rounded-xl p-6 border border-border hover:bg-accent transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-muted/50 rounded-xl p-6 border border-border mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  href={action.href}
                  className={`flex items-center gap-3 font-semibold py-3 px-6 rounded-lg transition-colors ${action.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-muted/50 rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-2">No recent activity to display.</p>
            <p className="text-sm text-muted-foreground">Start posting to see your activity here!</p>
          </div>
        </div>
      </div>
    </main>
  );
}




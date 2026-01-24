'use client';

import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');

  const settingsTabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language & Region', icon: Globe },
  ];

  return (
    <main className="border-x border-border bg-background min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <SettingsIcon className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border p-4">
          <nav className="space-y-1">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-4 lg:p-8">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                  <input
                    type="text"
                    className="w-full max-w-md px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="Your username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full max-w-md px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="your@email.com"
                  />
                </div>
                <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground mb-3">Theme</p>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Privacy & Security</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Private Account</p>
                    <p className="text-sm text-muted-foreground">Only approved followers can see your posts</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors">
                    Enable
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Language & Region</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Language</label>
                  <select className="w-full max-w-md px-4 py-2 border border-border rounded-lg bg-background text-foreground">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Time Zone</label>
                  <select className="w-full max-w-md px-4 py-2 border border-border rounded-lg bg-background text-foreground">
                    <option>UTC</option>
                    <option>EST</option>
                    <option>PST</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

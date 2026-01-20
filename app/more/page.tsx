'use client';

import { Settings, HelpCircle, Shield, Bell, Palette, LogOut, User, CreditCard, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/api';

export default function MorePage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out?')) {
      return;
    }

    setIsLoggingOut(true);
    try {
      const response = await logout();
      if (response.error) {
        console.error('Logout error:', response.error);
      }
      // Redirect to login page regardless of response
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };
  const menuSections: Array<{
    title: string;
    items: Array<{
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      description: string;
      danger?: boolean;
    }>;
  }> = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', description: 'Edit your profile information' },
        { icon: Shield, label: 'Privacy & Safety', description: 'Manage your privacy settings' },
        { icon: Bell, label: 'Notifications', description: 'Configure notification preferences' },
        { icon: CreditCard, label: 'Subscription', description: 'Manage your subscription' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Palette, label: 'Display', description: 'Theme and appearance settings' },
        { icon: BarChart3, label: 'Analytics', description: 'View your account analytics' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', description: 'Get help and support' },
        { icon: Settings, label: 'Settings', description: 'General app settings' },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        { icon: LogOut, label: 'Sign Out', description: 'Sign out of your account', danger: true },
      ],
    },
  ];

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4 z-10">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-foreground" />
          <h2 className="text-2xl font-bold text-foreground">More</h2>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-4 lg:px-6 py-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isLogout = item.label === 'Sign Out';
                
                return (
                  <button
                    key={itemIndex}
                    onClick={isLogout ? handleLogout : undefined}
                    disabled={isLogout && isLoggingOut}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left ${
                      item.danger ? 'hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : ''
                    } ${isLogout && isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      item.danger 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                        : 'bg-muted text-foreground'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                        {isLogout && isLoggingOut ? 'Signing out...' : item.label}
                      </h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 lg:px-6 py-6 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p>TrendsHub v2.0</p>
          <p className="mt-2">© 2026 TrendsHub. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}

'use client';

import { Home, Search, Bell, Mail, Bookmark, List, User, MoreHorizontal, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

const navigationItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Explore', href: '/explore' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Mail, label: 'Messages', href: '/messages' },
  { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
  { icon: List, label: 'Lists', href: '/lists' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: MoreHorizontal, label: 'More', href: '/more' },
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-full bg-background shadow-lg border border-border touch-manipulation"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-foreground" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation - Desktop & Mobile Slide-in */}
      <nav
        className={`
          h-screen w-[250px] flex flex-col items-start px-4 py-6 border-r border-border bg-background z-40 overflow-hidden
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0 fixed left-0 top-0' : '-translate-x-full fixed left-0 top-0'}
        `}
        style={{ transitionProperty: 'transform' }}
      >
        {/* Close Button (Mobile Only) */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-full hover:bg-accent touch-manipulation"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center space-x-2 flex-shrink-0">
          <Image
            src="/logo.jpeg"
            alt="TrendsHub Logo"
            width={40}
            height={40}
            className="rounded-lg object-cover"
          />
          <h1 className="text-2xl font-bold text-foreground">TrendsHub</h1>
        </Link>
        
        <div className="flex flex-col space-y-1 w-full flex-1 overflow-hidden">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-4 px-4 py-3 rounded-full hover:bg-accent transition-colors group touch-manipulation flex-shrink-0"
              >
                <Icon className="w-6 h-6 text-foreground group-hover:text-blue-500" />
                <span className="text-lg font-medium text-foreground group-hover:text-blue-500">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Theme Toggle */}
        <div className="mb-4 w-full flex justify-center">
          <ThemeToggle />
        </div>

        <button className="mt-2 w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-lg touch-manipulation flex-shrink-0">
          Tweet
        </button>
      </nav>
    </>
  );
}

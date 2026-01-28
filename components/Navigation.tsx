'use client';

import { Home, Search, Bell, Bookmark, User, Settings, Wallet, TrendingUp, ArrowUp, Coins, LogOut, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import ThemeToggle from './ThemeToggle';
import { logout, getAuthToken } from '@/lib/api';

// Navigation items for logged-in users
const navigationItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: TrendingUp, label: 'Trending', href: '/trending' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Search, label: 'Search', href: '/explore' },
  { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
  { icon: Coins, label: 'Bits', href: '/play' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: Wallet, label: 'Wallet', href: '/wallet' },
];

// Navigation items for logged-out users (empty - hide Home, Trending, Search when not authenticated)
const guestNavigationItems: typeof navigationItems = [];

// Mobile bottom navigation items - specific order for mobile
const mobileNavigationItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/explore' },
  { icon: Coins, label: 'Bits', href: '/play' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: User, label: 'Profile', href: '/profile' },
];


export default function Navigation() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show/hide scroll to top button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showLogoutModal]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await logout();
      if (response.error) {
        // console.error('Logout error:', response.error);
      }
    } catch (error) {
      // console.error('Logout error:', error);
    } finally {
      // Always clear user data and update state, even if logout API fails
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userName');
      localStorage.removeItem('trendshub_token');
      // Clear cookie
      document.cookie = 'trendshub_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setIsLoggedIn(false);
      setShowLogoutModal(false);
      setIsLoggingOut(false);
      // Redirect to login
      router.push('/login');
    }
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return;
      const token = getAuthToken();
      const hasToken = token !== null && token !== '';
      setIsLoggedIn(hasToken);
    };
    
    // Check immediately
    checkAuth();
    
    // Check auth on focus (when user comes back to tab)
    const handleFocus = () => checkAuth();
    window.addEventListener('focus', handleFocus);
    
    // Check on storage change (in case token is cleared in another tab)
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname]); // Re-check when pathname changes

  return (
    <>
      {/* Navigation - Desktop Sidebar (Hidden on Mobile) */}
      <nav
        className={`
          hidden md:flex h-screen w-[250px] flex-col items-start px-4 py-6 border-r border-border bg-background z-40 overflow-hidden
        `}
      >

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
          {(isLoggedIn ? navigationItems : guestNavigationItems).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center space-x-4 px-4 py-3 rounded-full hover:bg-accent transition-colors group touch-manipulation flex-shrink-0"
              >
                <Icon className="w-6 h-6 text-foreground group-hover:text-blue-500" />
                <span className="text-lg font-medium text-foreground group-hover:text-blue-500">
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Login/Signup Links for Guests */}
          {!isLoggedIn && (
            <>
              <Link
                href="/login"
                className="flex items-center space-x-4 px-4 py-3 rounded-full hover:bg-accent transition-colors group touch-manipulation flex-shrink-0"
              >
                <span className="text-lg font-medium text-foreground group-hover:text-blue-500">
                  Log in
                </span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center space-x-4 px-4 py-3 rounded-full hover:bg-accent transition-colors group touch-manipulation flex-shrink-0"
              >
                <span className="text-lg font-medium text-foreground group-hover:text-blue-500">
                  Sign up
                </span>
              </Link>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="mb-4 w-full flex justify-center">
          <ThemeToggle />
        </div>

        <button 
          onClick={() => router.push('/compose')}
          className="mt-2 w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-6 rounded-full hover:opacity-90 transition-opacity shadow-lg touch-manipulation flex-shrink-0"
        >
          Trend
        </button>

        {/* Logout Button - Desktop */}
        {isLoggedIn && (
          <button
            onClick={() => setShowLogoutModal(true)}
            className="mt-2 w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold py-3 px-6 rounded-full border border-red-500/20 hover:border-red-500 transition-colors touch-manipulation flex-shrink-0"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        )}

        {/* Scroll to Top Button - Fixed at Bottom (Desktop Only) */}
        <button
          onClick={scrollToTop}
          className={`
            hidden md:flex fixed bottom-6 left-[calc(250px+1rem)] 
            w-12 h-12 rounded-full 
            bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700
            text-white shadow-lg
            items-center justify-center
            transition-all duration-300 ease-in-out
            touch-manipulation z-50
            ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
          `}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Bottom Navigation Bar - Fixed at Bottom, Icon Only */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/95 backdrop-blur-md border-t border-border z-[100] shadow-2xl">
        <div className="flex justify-around items-center w-full h-full px-2 pb-2">
          {!isLoggedIn ? (
            // When not logged in: Show Logo, Login, Signup
            <>
              {/* Logo */}
              <Link
                href="/"
                className="flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-200 touch-manipulation"
                aria-label="Home"
                title="Home"
              >
                <div className="w-8 h-8 mb-1 rounded-lg overflow-hidden">
                  <Image
                    src="/logo.jpeg"
                    alt="TrendsHub Logo"
                    width={32}
                    height={32}
                    className="rounded-lg object-cover"
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">Home</span>
              </Link>

              {/* Login */}
              <Link
                href="/login"
                className="flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-200 touch-manipulation text-blue-500"
                aria-label="Log in"
                title="Log in"
              >
                <span className="text-[10px] font-medium">Login</span>
              </Link>

              {/* Signup */}
              <Link
                href="/signup"
                className="flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-200 touch-manipulation text-blue-500"
                aria-label="Sign up"
                title="Sign up"
              >
                <span className="text-[10px] font-medium">Signup</span>
              </Link>
            </>
          ) : (
            // When logged in: Show regular navigation items
            <>
              {/* Mobile Navigation Items - Custom Order */}
              {mobileNavigationItems
                .filter((item) => {
                  // Hide Home and Search when not authenticated (shouldn't happen here, but keeping for safety)
                  if (!isLoggedIn && (item.label === 'Home' || item.label === 'Search')) {
                    return false;
                  }
                  return true;
                })
                .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`
                      flex flex-col items-center justify-center flex-1
                      h-full min-w-0
                      transition-all duration-200
                      touch-manipulation
                      ${isActive 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-foreground'
                      }
                    `}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon 
                      className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''} transition-transform duration-200`}
                    />
                    <span className={`text-[10px] font-medium truncate w-full text-center ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              
              {/* Logout Button - Mobile (only when logged in) */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-200 touch-manipulation text-red-500"
                aria-label="Sign Out"
                title="Sign Out"
              >
                <LogOut className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Logout</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {mounted && showLogoutModal && typeof document !== 'undefined' && createPortal(
        <>
          {/* Full Screen Overlay - Covers Everything */}
          <div 
            className="fixed top-0 left-0 right-0 bottom-0 bg-black/75 backdrop-blur-md z-[100000]"
            onClick={() => !isLoggingOut && setShowLogoutModal(false)}
            style={{ position: 'fixed', zIndex: 100000 }}
          />
          
          {/* Modal Dialog */}
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100001] w-full max-w-md mx-4"
            style={{ position: 'fixed', zIndex: 100001 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-foreground">Sign Out</h3>
              <p className="text-muted-foreground">Are you sure you want to sign out of your account?</p>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-full hover:bg-accent transition-colors font-semibold"
                  disabled={isLoggingOut}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

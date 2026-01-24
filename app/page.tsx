'use client';

import Feed from '@/components/Feed';
import { mockTweets } from '@/lib/mockData';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function Home() {
  const hasRestoredScroll = useRef(false);
  const searchParams = useSearchParams();
  
  // Check authentication status synchronously
  const checkAuth = () => {
    if (typeof window === 'undefined') return false;
    const token = getAuthToken();
    return token !== null && token !== '';
  };
  
  const isLoggedIn = checkAuth();
  
  // Get initial tab from URL or default based on authentication
  // If logged in: default to 'for-you', if not logged in: default to 'discover'
  const tabParam = searchParams.get('tab');
  const validTabs = ['discover', 'for-you', 'following'];
  const initialTab = validTabs.includes(tabParam || '') 
    ? (tabParam as 'discover' | 'for-you' | 'following')
    : (isLoggedIn ? 'for-you' : 'discover');

  useEffect(() => {
    // Restore scroll position when coming back from a post
    const savedScrollPosition = sessionStorage.getItem('feedScrollPosition');
    const lastViewedPostId = sessionStorage.getItem('lastViewedPostId');
    
    if (savedScrollPosition && lastViewedPostId && !hasRestoredScroll.current) {
      hasRestoredScroll.current = true;
      const scrollPos = parseInt(savedScrollPosition, 10);
      
      // Wait for feed to render before restoring scroll
      const restoreScroll = () => {
        // Try multiple times to ensure content is loaded
        const attempts = [0, 100, 300, 500, 1000];
        attempts.forEach((delay) => {
          setTimeout(() => {
            window.scrollTo({ top: scrollPos, behavior: 'auto' });
          }, delay);
        });
        
        // Also listen for feed rendered event
        const handleFeedRendered = () => {
          setTimeout(() => {
            window.scrollTo({ top: scrollPos, behavior: 'auto' });
            // Clear the saved position after restoring
            setTimeout(() => {
              sessionStorage.removeItem('feedScrollPosition');
              sessionStorage.removeItem('lastViewedPostId');
            }, 100);
          }, 50);
        };
        
        window.addEventListener('feedRendered', handleFeedRendered, { once: true });
        
        // Fallback: clear after 2 seconds
        setTimeout(() => {
          sessionStorage.removeItem('feedScrollPosition');
          sessionStorage.removeItem('lastViewedPostId');
        }, 2000);
      };
      
      // Start restoration process
      restoreScroll();
    }
  }, []);

  return (
    <main className="border-x border-border bg-background">
      <Feed tweets={[]} initialTab={initialTab} />
      </main>
  );
}

'use client';

import Feed from '@/components/Feed';
import { mockTweets } from '@/lib/mockData';
import { useEffect, useRef } from 'react';

export default function Home() {
  const hasRestoredScroll = useRef(false);

  useEffect(() => {
    // Restore scroll position when coming back from a post
    const savedScrollPosition = sessionStorage.getItem('feedScrollPosition');
    const lastViewedPostId = sessionStorage.getItem('lastViewedPostId');
    
    if (savedScrollPosition && lastViewedPostId && !hasRestoredScroll.current) {
      hasRestoredScroll.current = true;
      
      // Set scroll position immediately before any rendering
      const scrollPos = parseInt(savedScrollPosition, 10);
      window.scrollTo(0, scrollPos);
      
      // Then ensure it's set after a frame to handle any layout shifts
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPos);
        
        // Double-check after a tiny delay to ensure smooth restoration
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPos);
          
          // Clear the saved position after restoring
          setTimeout(() => {
            sessionStorage.removeItem('feedScrollPosition');
            sessionStorage.removeItem('lastViewedPostId');
          }, 50);
        });
      });
    }
  }, []);

  return (
    <main className="border-x border-border bg-background">
      <Feed tweets={mockTweets} />
      </main>
  );
}

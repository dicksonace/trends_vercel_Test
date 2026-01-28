'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function CurrentUserProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = getAuthToken();
    
    if (!token) {
      // No token, redirect to login
      router.push('/login');
      return;
    }

    // Redirect to /profile/you (the profile page will handle fetching the actual user data)
    router.replace('/profile/you');
  }, [router]);

  // Show loading while redirecting
  return (
    <main className="border-x border-border bg-background min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    </main>
  );
}

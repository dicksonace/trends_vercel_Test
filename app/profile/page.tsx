'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getAuthToken } from '@/lib/api';
import type { User } from '@/types/auth';

export default function CurrentUserProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToUserProfile = async () => {
      // First, try to get username from localStorage (stored during login/register)
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user: User = JSON.parse(storedUser);
          if (user.username) {
            router.replace(`/profile/${user.username}`);
            return;
          }
        } catch (e) {
          // Invalid JSON, continue to fetch from API
        }
      }

      // If no stored user or no username, check for token and fetch from API
      const token = getAuthToken();
      
      if (!token) {
        // No token, redirect to login
        router.push('/login');
        return;
      }

      try {
        const response = await getCurrentUser();
        
        if (response.error) {
          // If unauthorized, redirect to login
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          // Other errors, redirect to home
          router.push('/');
          return;
        }
        
        if (response.data?.username) {
          // Store user data and redirect to profile
          localStorage.setItem('currentUser', JSON.stringify(response.data));
          router.replace(`/profile/${response.data.username}`);
        } else {
          // No username, redirect to home
          router.push('/');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    redirectToUserProfile();
  }, [router]);

  if (loading) {
    return (
      <main className="border-x border-border bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </main>
    );
  }

  return null;
}

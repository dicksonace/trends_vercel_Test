'use client';

import PostView from '@/components/PostView';
import { mockTweets } from '@/lib/mockData';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const tweet = mockTweets.find(t => t.id === id);

  useEffect(() => {
    if (!tweet) {
      router.push('/');
    }
  }, [tweet, router]);

  if (!tweet) {
    return null;
  }

  return (
    <main className="border-x border-border bg-background">
      <PostView tweet={tweet} />
    </main>
  );
}

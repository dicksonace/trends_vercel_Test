'use client';

import { Suspense } from 'react';
import { AuthPage } from '@/components/ui/auth-page';

function AuthPageWrapper() {
  return <AuthPage />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageWrapper />
    </Suspense>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CollectInfoPage() {
  const router = useRouter();

  useEffect(() => {
    // Collect-info is deprecated in favor of signup which also creates a user account
    router.replace('/signup');
  }, [router]);

  return (
    <div className="loading-screen">
      <div className="spinner" />
      <div className="loading-text">Redirecting...</div>
    </div>
  );
}


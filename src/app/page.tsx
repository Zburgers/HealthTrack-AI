'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
      // setLoading(false); // setLoading to false is handled by router.replace triggering a re-render or unmount
    });
    // Ensure setLoading(false) if component unmounts before auth state change (e.g. fast navigation)
    return () => {
      unsubscribe();
      setLoading(false); // Set loading to false on unmount if not already redirected
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return null; // Or a minimal loading state, redirection will handle the view
}

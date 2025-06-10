
// This page is deprecated and will be deleted.
// Navigation will go to /app/analysis/page.tsx instead.

'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileQuestion, Loader2 } from 'lucide-react';

export default function DeprecatedResultsPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the new analysis page
    // Using replace to avoid adding this deprecated page to history
    router.replace('/analysis'); 
  }, [router]);

  // Render a fallback loading/redirecting state
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center text-center py-10">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <h1 className="font-headline text-2xl font-semibold">Redirecting to Analysis Page...</h1>
        <p className="text-muted-foreground mt-2">
          This page is no longer in use. You are being redirected.
        </p>
        <p className="text-muted-foreground mt-1">
          If you are not redirected automatically, please <Link href="/analysis" className="text-primary underline">click here</Link>.
        </p>
      </div>
    </MainLayout>
  );
}

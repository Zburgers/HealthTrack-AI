// This page is deprecated and now redirects to /analysis.
// It can be deleted once all links are updated to /analysis and it's confirmed no one is using the old /results URL.
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

export default function DeprecatedResultsPage() {
  const router = useRouter();

  useEffect(() => {
    // Use replace so the /results page isn't in the browser history after redirect
    router.replace('/analysis');
  }, [router]);

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center text-center py-10 min-h-[calc(100vh-200px)]"> {/* Adjust min-height as needed */}
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <h1 className="font-headline text-2xl font-semibold">Redirecting to Analysis Page...</h1>
        <p className="text-muted-foreground">
          The results page has moved. You are being redirected to /analysis.
        </p>
      </div>
    </MainLayout>
  );
}

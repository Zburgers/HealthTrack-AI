
// This page is deprecated and will be deleted.
// Navigation will go to /app/analysis/page.tsx instead.
// Keeping the file for now to avoid breaking existing references during the refactor,
// but it should be removed once /analysis is confirmed to be working.

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
    // Redirect to the new analysis page
    router.replace('/analysis');
  }, [router]);

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center text-center py-10">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <h1 className="font-headline text-2xl font-semibold">Redirecting to Analysis Page...</h1>
        <p className="text-muted-foreground mt-2">
          If you are not redirected automatically, please <Link href="/analysis" className="text-primary underline">click here</Link>.
        </p>
      </div>
    </MainLayout>
  );
}

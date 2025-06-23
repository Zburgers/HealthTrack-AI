'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    // Removed <html> and <body> tags
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
      <h1 className="font-headline text-4xl font-bold text-destructive mb-4">Oops! Something went wrong.</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        We encountered an unexpected issue. Please try again, or if the problem persists, contact support.
      </p>
      {error?.message && (
          <p className="text-sm text-muted-foreground mb-2">Error details: {error.message}</p>
      )}
      <div className="space-x-4">
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          variant="destructive"
          size="lg"
        >
          <RotateCcw className="mr-2 h-5 w-5"/> Try again
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

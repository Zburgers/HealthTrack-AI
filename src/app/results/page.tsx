
'use client';

import MainLayout from '@/components/layout/MainLayout';
import ResultsDisplay from '@/components/results/ResultsDisplay';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation'; // useRouter might be needed by ResultsDisplay or its children
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileQuestion, Loader2 } from 'lucide-react';

export default function ResultsPage() {
  const { analysisResult, analysisReturnPath } = useAppState(); // Also get analysisReturnPath for logging or direct use if needed
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  // This effect helps ensure we have the latest from context after initial load from sessionStorage
  useEffect(() => {
    // The AppStateContext's own useEffect handles loading from sessionStorage.
    // We just need to give it a moment to complete.
    // A direct check on analysisResult is fine, but this ensures we wait for context provider's init.
    if (typeof analysisResult !== 'undefined') { // Check if context has initialized analysisResult
        setIsLoadingContext(false);
    }
    // If analysisResult remains null after context load, the condition below will handle it.
  }, [analysisResult]);


  if (isLoadingContext && analysisResult === null) { // Show loader only if context is still loading AND result is null
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center text-center py-10">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
          <h1 className="font-headline text-2xl font-semibold">Loading Analysis Results...</h1>
        </div>
      </MainLayout>
    );
  }

  if (!analysisResult) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center text-center py-10">
          <FileQuestion className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="font-headline text-2xl font-semibold mb-2">No Analysis Result Found</h1>
          <p className="text-muted-foreground mb-6">
            Please submit a new case to view analysis results here, or check your previous patient file.
          </p>
          <Button asChild>
            <Link href="/new-case">Create New Case</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // ResultsDisplay no longer takes 'result' or 'onReset' as props
  return (
    <MainLayout>
      <ResultsDisplay />
    </MainLayout>
  );
}

'use client';

import MainLayout from '@/components/layout/MainLayout';
import ResultsDisplay from '@/components/results/ResultsDisplay';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function ResultsPage() {
  const { analysisResult, setAnalysisResult } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!analysisResult) {
      // If there's no result in state, maybe redirect to new case page or dashboard
      // For now, let's keep it on this page but show a message.
      // router.replace('/new-case'); 
    }
  }, [analysisResult, router]);

  if (!analysisResult) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center text-center py-10">
          <FileQuestion className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="font-headline text-2xl font-semibold mb-2">No Analysis Result Found</h1>
          <p className="text-muted-foreground mb-6">
            Please submit a new case to view analysis results here.
          </p>
          <Button asChild>
            <Link href="/new-case">Create New Case</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ResultsDisplay result={analysisResult} onReset={() => {
        setAnalysisResult(null);
        router.push('/new-case'); // Navigate to new case form after resetting
      }} />
    </MainLayout>
  );
}

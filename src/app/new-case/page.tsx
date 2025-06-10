'use client';

import MainLayout from '@/components/layout/MainLayout';
import NewCaseForm from '@/components/new-case/NewCaseForm';
import { useAppState } from '@/context/AppStateContext';
import ResultsDisplay from '@/components/results/ResultsDisplay';

export default function NewCasePage() {
  const { analysisResult, setAnalysisResult } = useAppState();

  if (analysisResult) {
    // If there's an analysis result, show the results display
    // This allows navigating back to this page to see the last result
    // or could be cleared when a new form is started.
    return (
       <MainLayout>
        <ResultsDisplay result={analysisResult} onReset={() => setAnalysisResult(null)} />
      </MainLayout>
    );
  }
  
  // Otherwise, show the form
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-headline text-3xl font-bold text-primary mb-8 text-center">Create New Patient Case</h1>
        <NewCaseForm />
      </div>
    </MainLayout>
  );
}

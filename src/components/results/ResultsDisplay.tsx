
// This component is DEPRECATED as its functionality has been moved to /app/analysis/page.tsx
// It can be deleted once /app/analysis/page.tsx is confirmed to be working correctly.

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RiskGauge from './RiskGauge';
import SoapNotesEditor from './SoapNotesEditor';
import SimilarCasesPanel from './SimilarCasesPanel';
import ExportModal from './ExportModal';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { ArrowLeft, Download, ListChecks, FileQuestion } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import MainLayout from '../layout/MainLayout'; // Fallback if rendered directly

export default function ResultsDisplay_DEPRECATED() {
  const { analysisResult, analysisReturnPath, setAnalysisResult: setAppState } = useAppState();
  const router = useRouter();

  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

   useEffect(() => {
    // If this deprecated component is somehow rendered, redirect to the new analysis page.
    // This also helps if analysisResult is already in context.
    if (analysisResult) {
      router.replace('/analysis');
    }
  }, [analysisResult, router]);


  const handleBackOrReset = () => {
    if (analysisReturnPath) {
      router.push(analysisReturnPath);
      // Do not clear context here for this deprecated component's logic, 
      // as the new page /analysis handles it.
    } else {
      setAppState(null, null); 
      router.push('/new-case');
    }
  };

  // Fallback rendering if somehow accessed directly before redirect or if no result
  if (!analysisResult) {
    return (
       <MainLayout>
        <div className="flex flex-col items-center justify-center text-center py-10">
          <FileQuestion className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="font-headline text-2xl font-semibold mb-2">No Analysis Result Found (Deprecated)</h1>
          <p className="text-muted-foreground mb-6">
            Please submit a new case or view an existing patient's analysis. You will be redirected.
          </p>
          <Button onClick={() => router.push('/new-case')}>Create New Case</Button>
        </div>
      </MainLayout>
    );
  }
  
  // This part should ideally not be reached if redirection to /analysis works.
  return (
    <div className="space-y-8 p-4 border border-destructive bg-destructive/10 rounded-md">
      <p className="text-destructive-foreground font-bold text-center text-lg">
        This results display is DEPRECATED. You should be viewing this on the `/analysis` page.
      </p>
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBackOrReset}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {analysisReturnPath ? 'Back (Old)' : 'New Case (Old)'}
        </Button>
        <h1 className="font-headline text-3xl font-bold text-primary">Analysis (DEPRECATED)</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setIsSimilarCasesOpen(true)}>
            <ListChecks className="mr-2 h-4 w-4" /> Similar Cases
          </Button>
          <Button onClick={() => setIsExportModalOpen(true)}>
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>
       {/* Content would be here, but it's primarily to show deprecation message */}
      <SimilarCasesPanel isOpen={isSimilarCasesOpen} onOpenChange={setIsSimilarCasesOpen} />
      <ExportModal isOpen={isExportModalOpen} onOpenChange={setIsExportModalOpen} />
    </div>
  );
}

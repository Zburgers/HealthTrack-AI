
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RiskGauge from './RiskGauge';
import SoapNotesEditor from './SoapNotesEditor';
import SimilarCasesPanel from './SimilarCasesPanel';
import ExportModal from './ExportModal';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ArrowLeft, Download, ListChecks } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';

// No longer needs 'result' as a prop, will get it from context
export default function ResultsDisplay() {
  const { analysisResult, analysisReturnPath, setAnalysisResult: setAppState } = useAppState();
  const router = useRouter();

  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleBackOrReset = () => {
    if (analysisReturnPath) {
      // Navigate to the stored return path (e.g., patient detail page)
      // Do NOT clear analysisResult or analysisReturnPath from context here,
      // so user can use browser back to return to these results.
      router.push(analysisReturnPath);
    } else {
      // This is for results from a new case submission
      setAppState(null, null); // Clear both result and return path
      router.push('/new-case');
    }
  };

  // If analysisResult is not available in context, this component shouldn't render its main content.
  // ResultsPage should handle showing a "No results" message.
  // This is a safeguard.
  if (!analysisResult) {
    console.warn("ResultsDisplay: analysisResult from context is null. This component might not display correctly or should be conditionally rendered by parent.");
    // Optionally, return a loader or a minimal message, but ResultsPage is the primary guard.
    return null; 
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBackOrReset}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {analysisReturnPath ? 'Back to Patient File' : 'Start New Case'}
        </Button>
        <h1 className="font-headline text-3xl font-bold text-primary">Analysis Results</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setIsSimilarCasesOpen(true)}>
            <ListChecks className="mr-2 h-4 w-4" /> Similar Cases
          </Button>
          <Button onClick={() => setIsExportModalOpen(true)}>
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Risk Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <RiskGauge score={analysisResult.riskScore} />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                This score represents the estimated patient risk based on the provided data.
                {analysisResult.riskScore >= 0.7 && " High risk indicates need for urgent attention."}
                {analysisResult.riskScore < 0.7 && analysisResult.riskScore >=0.4 && " Medium risk suggests careful monitoring."}
                {analysisResult.riskScore < 0.4 && " Low risk, continue routine monitoring."}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Identified ICD-10 Codes</CardTitle>
              <CardDescription>Relevant codes based on symptoms and observations.</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult.icd10Tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysisResult.icd10Tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-secondary text-secondary-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specific ICD-10 codes identified.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Draft SOAP Notes</CardTitle>
              <CardDescription>Review and edit the AI-generated clinical notes.</CardDescription>
            </CardHeader>
            <CardContent>
              <SoapNotesEditor initialNotes={analysisResult.soapNotes} />
            </CardContent>
          </Card>
        </div>
      </div>

      <SimilarCasesPanel isOpen={isSimilarCasesOpen} onOpenChange={setIsSimilarCasesOpen} />
      <ExportModal isOpen={isExportModalOpen} onOpenChange={setIsExportModalOpen} />
    </div>
  );
}

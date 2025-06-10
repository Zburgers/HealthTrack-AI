
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RiskGauge from '@/components/results/RiskGauge';
import SoapNotesEditor from '@/components/results/SoapNotesEditor';
import SimilarCasesPanel from '@/components/results/SimilarCasesPanel';
import ExportModal from '@/components/results/ExportModal';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, ListChecks, FileQuestion, Loader2 } from 'lucide-react';

export default function AnalysisPage() {
  const { analysisResult, analysisReturnPath, setAnalysisResult } = useAppState();
  const router = useRouter();
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    if (typeof analysisResult !== 'undefined') {
      setIsLoadingContext(false);
    }
  }, [analysisResult]);

  const handleBackNavigation = () => {
    if (analysisReturnPath) {
      router.push(analysisReturnPath);
      // Do not clear analysisResult here, so user can use browser back to return to this analysis page
    } else {
      // Came from new case form
      setAnalysisResult(null, null); // Clear result and return path
      router.push('/new-case');
    }
  };

  if (isLoadingContext && analysisResult === null) {
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
            Please submit a new case or view an existing patient's analysis.
          </p>
          <Button onClick={() => router.push('/new-case')}>Create New Case</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleBackNavigation}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
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
                  {analysisResult.riskScore >= 70 && " High risk indicates need for urgent attention."}
                  {analysisResult.riskScore < 70 && analysisResult.riskScore >= 40 && " Medium risk suggests careful monitoring."}
                  {analysisResult.riskScore < 40 && " Low risk, continue routine monitoring."}
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
    </MainLayout>
  );
}

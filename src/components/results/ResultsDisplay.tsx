'use client';

import type { AnalyzePatientSymptomsOutput } from '@/ai/flows/analyze-patient-symptoms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RiskGauge from './RiskGauge';
import SoapNotesEditor from './SoapNotesEditor';
import SimilarCasesPanel from './SimilarCasesPanel';
import ExportModal from './ExportModal';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ArrowLeft, Download, Share2, ListChecks } from 'lucide-react';

interface ResultsDisplayProps {
  result: AnalyzePatientSymptomsOutput;
  onReset: () => void; // Callback to reset/clear the result and go back to form
}

export default function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onReset}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to New Case Form
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
        {/* Left Column: Risk Score and ICD-10 Tags */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Risk Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <RiskGauge score={result.riskScore} />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                This score represents the estimated patient risk based on the provided data.
                {result.riskScore >= 0.7 && " High risk indicates need for urgent attention."}
                {result.riskScore < 0.7 && result.riskScore >=0.4 && " Medium risk suggests careful monitoring."}
                {result.riskScore < 0.4 && " Low risk, continue routine monitoring."}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Identified ICD-10 Codes</CardTitle>
              <CardDescription>Relevant codes based on symptoms and observations.</CardDescription>
            </CardHeader>
            <CardContent>
              {result.icd10Tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.icd10Tags.map((tag, index) => (
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

        {/* Right Column: SOAP Notes */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Draft SOAP Notes</CardTitle>
              <CardDescription>Review and edit the AI-generated clinical notes.</CardDescription>
            </CardHeader>
            <CardContent>
              <SoapNotesEditor initialNotes={result.soapNotes} />
            </CardContent>
          </Card>
        </div>
      </div>

      <SimilarCasesPanel isOpen={isSimilarCasesOpen} onOpenChange={setIsSimilarCasesOpen} />
      <ExportModal isOpen={isExportModalOpen} onOpenChange={setIsExportModalOpen} />
    </div>
  );
}

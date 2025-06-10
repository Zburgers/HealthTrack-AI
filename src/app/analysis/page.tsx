
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RiskGauge from '@/components/results/RiskGauge';
import SoapNotesEditor from '@/components/results/SoapNotesEditor';
import SimilarCasesPanel from '@/components/results/SimilarCasesPanel';
import ExportModal from '@/components/results/ExportModal';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Download, ListChecks, FileQuestion, Loader2, InfoIcon, User, CalendarDays, Tag, Fingerprint } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Patient, NewCaseFormValues } from '@/types';


const SoapSection: React.FC<{ title: string; content?: string }> = ({ title, content }) => {
  if (!content || content.trim() === '') return null;
  return (
    <div className="mb-3">
      <h3 className="font-semibold text-md text-primary mb-1">{title}</h3>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{content.trim()}</p>
    </div>
  );
};

const ParsedSoapNotesDisplay: React.FC<{ notes: string }> = ({ notes }) => {
  const sections = useMemo(() => {
    const s = notes?.match(/S:([\s\S]*?)(O:|A:|P:|$)/i)?.[1] || '';
    const o = notes?.match(/O:([\s\S]*?)(A:|P:|$)/i)?.[1] || '';
    const a = notes?.match(/A:([\s\S]*?)(P:|$)/i)?.[1] || '';
    const p = notes?.match(/P:([\s\S]*?)$/i)?.[1] || '';
    return { s, o, a, p };
  }, [notes]);

  if (!notes || notes.trim() === '') {
    return <p className="text-sm text-muted-foreground">No SOAP notes available for display.</p>;
  }

  return (
    <div className="space-y-2">
      <SoapSection title="S: Subjective" content={sections.s} />
      <SoapSection title="O: Objective" content={sections.o} />
      <SoapSection title="A: Assessment" content={sections.a} />
      <SoapSection title="P: Plan" content={sections.p} />
    </div>
  );
};


export default function AnalysisPage() {
  const { analysisResult, analysisReturnPath, currentCaseDisplayData, setAnalysisResult: setAppState } = useAppState();
  const router = useRouter();
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const riskScoreExplanation = useMemo(() => {
    if (!currentCaseDisplayData) return "Risk score based on provided data.";
    let factors = [];
    if ('id' in currentCaseDisplayData && 'conditions' in currentCaseDisplayData) { // Patient
        const patient = currentCaseDisplayData as Patient;
        if (patient.conditions.length > 0) factors.push(`conditions like ${patient.conditions.slice(0,2).join(', ')}`);
        if (patient.primaryComplaint) factors.push(`primary complaint: "${patient.primaryComplaint}"`);
    } else if (currentCaseDisplayData) { // NewCaseFormValues (check if it's not null/undefined)
        const form = currentCaseDisplayData as NewCaseFormValues;
        if (form.primaryComplaint) factors.push(`primary complaint: "${form.primaryComplaint}"`);
        if (form.previousConditions) factors.push(`previous conditions: "${form.previousConditions}"`);
    }
    return factors.length > 0 ? `Influenced by ${factors.join(' and ')}.` : "Based on overall clinical picture.";
  }, [currentCaseDisplayData]);

  useEffect(() => {
    if (typeof analysisResult !== 'undefined' && typeof currentCaseDisplayData !== 'undefined') {
      setIsLoadingContext(false);
    }
  }, [analysisResult, currentCaseDisplayData]);

  const handleBackNavigation = () => {
    if (analysisReturnPath) {
      router.push(analysisReturnPath);
      // For existing cases, do not clear context immediately to allow browser back to analysis
    } else {
      // Came from new case form
      setAppState(null, null, null); // Clear result, return path, and case data
      router.push('/new-case');
    }
  };

  const getPatientHeaderInfo = () => {
    if (!currentCaseDisplayData) return null;

    let name: string | undefined;
    let age: number | string | undefined;
    let gender: string | undefined;
    let conditionsOrComplaint: string | undefined;
    let visitDate: Date | string | undefined;
    let caseId: string | undefined;

    if ('id' in currentCaseDisplayData && 'conditions' in currentCaseDisplayData) { // It's a Patient object
      const patient = currentCaseDisplayData as Patient;
      name = patient.name;
      age = patient.age;
      gender = patient.gender;
      conditionsOrComplaint = patient.conditions.slice(0,2).join(', ') + (patient.conditions.length > 2 ? '...' : '');
      visitDate = patient.lastVisit ? parseISO(patient.lastVisit) : undefined;
      caseId = patient.id;
    } else { // It's NewCaseFormValues
      const formValues = currentCaseDisplayData as NewCaseFormValues;
      name = formValues.patientName;
      age = formValues.age;
      gender = formValues.gender;
      conditionsOrComplaint = formValues.primaryComplaint;
      visitDate = formValues.visitDate;
      caseId = "New Case Analysis";
    }

    return (
      <div className="mb-6 p-4 border border-border rounded-lg bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {name && <div className="flex items-center"><User className="w-4 h-4 mr-1.5 text-primary" /> <strong className="text-foreground mr-1">{name}</strong> ({age}{gender?.charAt(0).toUpperCase()})</div>}
          {visitDate && <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-1.5 text-primary" /> Visited: {format(new Date(visitDate), "MMM dd, yyyy")}</div>}
        </div>
        {conditionsOrComplaint && <div className="mt-1.5 flex items-center text-sm text-muted-foreground"><Tag className="w-4 h-4 mr-1.5 text-primary" /> {conditionsOrComplaint}</div>}
        {caseId && !caseId.startsWith("New") && <div className="mt-1.5 flex items-center text-xs text-muted-foreground"><Fingerprint className="w-3 h-3 mr-1.5 text-primary" /> Case ID: {caseId}</div>}
        <p className="text-xs text-muted-foreground mt-1">Analysis Generated: {format(new Date(), "MMM dd, yyyy, p")}</p>
      </div>
    );
  };
  
  const getVitalsSummary = () => {
    if (!currentCaseDisplayData) return null;
    let vitals: Partial<Patient['vitals'] | NewCaseFormValues> = {};

    if ('id' in currentCaseDisplayData && 'vitals' in currentCaseDisplayData) { // Patient
        vitals = (currentCaseDisplayData as Patient).vitals;
    } else { // NewCaseFormValues
        const formVitals = currentCaseDisplayData as NewCaseFormValues;
        vitals = { bp: formVitals.bp, hr: formVitals.hr, rr: formVitals.rr, temp: formVitals.temp, spo2: formVitals.spo2 };
    }
    
    const vitalEntries = Object.entries(vitals).filter(([_, value]) => value && String(value).trim() !== '');
    if (vitalEntries.length === 0) return null;

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Vitals Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-1 text-sm">
                    {vitals.bp && <li><strong>BP:</strong> {vitals.bp} mmHg</li>}
                    {vitals.hr && <li><strong>HR:</strong> {vitals.hr} bpm</li>}
                    {vitals.rr && <li><strong>RR:</strong> {vitals.rr} /min</li>}
                    {vitals.temp && <li><strong>Temp:</strong> {vitals.temp} °C</li>}
                    {vitals.spo2 && <li><strong>SpO₂:</strong> {vitals.spo2} %</li>}
                </ul>
            </CardContent>
        </Card>
    );
  };


  if (isLoadingContext) {
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
      <TooltipProvider>
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

          {getPatientHeaderInfo()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="font-headline text-xl">Risk Score</CardTitle>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <InfoIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm">
                      <p className="font-semibold text-primary mb-1">Risk Score Explanation</p>
                      <p>{riskScoreExplanation}</p>
                    </TooltipContent>
                  </Tooltip>
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

              {getVitalsSummary()}

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
                  <CardDescription>Review the AI-generated clinical notes below, or edit in the text area.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border rounded-md bg-secondary/30 max-h-80 overflow-y-auto mb-4">
                    <ParsedSoapNotesDisplay notes={analysisResult.soapNotes} />
                  </div>
                  <SoapNotesEditor initialNotes={analysisResult.soapNotes} />
                </CardContent>
              </Card>
            </div>
          </div>

          <SimilarCasesPanel isOpen={isSimilarCasesOpen} onOpenChange={setIsSimilarCasesOpen} />
          <ExportModal isOpen={isExportModalOpen} onOpenChange={setIsExportModalOpen} />
        </div>
      </TooltipProvider>
    </MainLayout>
  );
}

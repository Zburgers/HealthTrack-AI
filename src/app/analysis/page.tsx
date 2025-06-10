
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
import { motion } from 'framer-motion';
import { ArrowLeft, Download, ListChecks, FileQuestion, Loader2, InfoIcon, User, CalendarDays, Tag, Fingerprint, HeartPulse, ClipboardList } from 'lucide-react';
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
    const s = notes?.match(/S:([\s\S]*?)(O:|A:|P:|$)/i)?.[1]?.trim() || '';
    const o = notes?.match(/O:([\s\S]*?)(A:|P:|$)/i)?.[1]?.trim() || '';
    const a = notes?.match(/A:([\s\S]*?)(P:|$)/i)?.[1]?.trim() || '';
    const p = notes?.match(/P:([\s\S]*?)$/i)?.[1]?.trim() || '';
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

const icdColorClasses = [
  "bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200",
  "bg-lime-100 text-lime-700 border-lime-300 hover:bg-lime-200",
  "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 hover:bg-fuchsia-200",
  "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200",
  "bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200",
  "bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200",
];

const getIcdColorClass = (index: number) => {
  return icdColorClasses[index % icdColorClasses.length];
};

const cardAnimationProps = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay }
});


export default function AnalysisPage() {
  const { analysisResult, analysisReturnPath, currentCaseDisplayData, setAnalysisResult: setAppStateContext } = useAppState();
  const router = useRouter();
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [editableSoapNotes, setEditableSoapNotes] = useState('');

  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Moved useMemo to be called unconditionally
  const riskScoreExplanation = useMemo(() => {
    if (!currentCaseDisplayData) return "Risk score based on provided data.";
    let factors = [];
    if ('id' in currentCaseDisplayData && 'conditions' in currentCaseDisplayData) { 
        const patient = currentCaseDisplayData as Patient;
        if (patient.conditions.length > 0) factors.push(`conditions like ${patient.conditions.slice(0,2).join(', ')}`);
        if (patient.primaryComplaint) factors.push(`primary complaint: "${patient.primaryComplaint}"`);
    } else if (currentCaseDisplayData) { 
        const form = currentCaseDisplayData as NewCaseFormValues;
        if (form.primaryComplaint) factors.push(`primary complaint: "${form.primaryComplaint}"`);
        if (form.previousConditions) factors.push(`previous conditions: "${form.previousConditions}"`);
    }
    return factors.length > 0 ? `Influenced by ${factors.join(' and ')}.` : "Based on overall clinical picture.";
  }, [currentCaseDisplayData]);

  useEffect(() => {
    if (typeof analysisResult !== 'undefined' && typeof currentCaseDisplayData !== 'undefined') {
      setIsLoadingContext(false);
      if (analysisResult?.soapNotes) {
        setEditableSoapNotes(analysisResult.soapNotes);
      }
    }
  }, [analysisResult, currentCaseDisplayData]);


  const handleBackNavigation = () => {
    if (analysisReturnPath) {
      router.push(analysisReturnPath);
    } else {
      setAppStateContext(null, null, null); 
      router.push('/new-case');
    }
  };

  const handleSoapNotesChange = (newNotes: string) => {
    setEditableSoapNotes(newNotes);
  };

  const handleResetSoapNotes = () => {
    if (analysisResult?.soapNotes) {
      setEditableSoapNotes(analysisResult.soapNotes);
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

    if ('id' in currentCaseDisplayData && 'conditions' in currentCaseDisplayData) { 
      const patient = currentCaseDisplayData as Patient;
      name = patient.name;
      age = patient.age;
      gender = patient.gender;
      conditionsOrComplaint = patient.conditions.slice(0,2).join(', ') + (patient.conditions.length > 2 ? '...' : '');
      visitDate = patient.lastVisit ? parseISO(patient.lastVisit) : undefined;
      caseId = patient.id;
    } else { 
      const formValues = currentCaseDisplayData as NewCaseFormValues;
      name = formValues.patientName;
      age = formValues.age;
      gender = formValues.gender;
      conditionsOrComplaint = formValues.primaryComplaint;
      visitDate = formValues.visitDate;
      caseId = "New Case Analysis";
    }

    return (
      <motion.div {...cardAnimationProps(0)} className="mb-6 p-4 border border-border rounded-lg bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {name && <div className="flex items-center"><User className="w-4 h-4 mr-1.5 text-primary" /> <strong className="text-foreground mr-1">{name}</strong> ({age}{gender?.charAt(0).toUpperCase()})</div>}
          {visitDate && <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-1.5 text-primary" /> Visited: {format(new Date(visitDate), "MMM dd, yyyy")}</div>}
        </div>
        {conditionsOrComplaint && <div className="mt-1.5 flex items-center text-sm text-muted-foreground"><Tag className="w-4 h-4 mr-1.5 text-primary" /> {conditionsOrComplaint}</div>}
        {caseId && !caseId.startsWith("New") && <div className="mt-1.5 flex items-center text-xs text-muted-foreground"><Fingerprint className="w-3 h-3 mr-1.5 text-primary" /> Case ID: {caseId}</div>}
        <p className="text-xs text-muted-foreground mt-1">Analysis Generated: {format(new Date(), "MMM dd, yyyy, p")}</p>
      </motion.div>
    );
  };
  
  const getVitalsSummary = () => {
    if (!currentCaseDisplayData) return null;
    
    let vitalsData: Array<{label: string; value?: string; unit: string}> = [];

    if ('id' in currentCaseDisplayData && 'vitals' in currentCaseDisplayData) { // Patient
        const patientVitals = (currentCaseDisplayData as Patient).vitals;
        vitalsData = [
            { label: 'BP', value: patientVitals.bp, unit: 'mmHg' },
            { label: 'HR', value: patientVitals.hr, unit: 'bpm' },
            { label: 'RR', value: patientVitals.rr, unit: '/min' },
            { label: 'Temp', value: patientVitals.temp, unit: '°C' },
            { label: 'SpO₂', value: patientVitals.spo2, unit: '%' },
        ];
    } else { // NewCaseFormValues
        const formVitals = currentCaseDisplayData as NewCaseFormValues;
         vitalsData = [
            { label: 'BP', value: formVitals.bp, unit: 'mmHg' },
            { label: 'HR', value: formVitals.hr, unit: 'bpm' },
            { label: 'RR', value: formVitals.rr, unit: '/min' },
            { label: 'Temp', value: formVitals.temp, unit: '°C' },
            { label: 'SpO₂', value: formVitals.spo2, unit: '%' },
        ];
    }
    
    const filteredVitals = vitalsData
      .map(vital => {
          let displayValue = String(vital.value || '').trim();
          // Remove unit from value if already present
          if (vital.unit && displayValue.toLowerCase().endsWith(vital.unit.toLowerCase())) {
              displayValue = displayValue.substring(0, displayValue.length - vital.unit.length).trim();
          }
           // Specific common case for BP like "120/80 mmHg"
          if (vital.unit === 'mmHg' && displayValue.toLowerCase().endsWith('mmhg')) {
            displayValue = displayValue.substring(0, displayValue.length - 4).trim();
          }
          return { ...vital, value: displayValue };
      })
      .filter(vital => vital.value && vital.value !== '');

    if (filteredVitals.length === 0) return null;

    return (
        <motion.div {...cardAnimationProps(0.2)}>
          <Card className="shadow-lg">
              <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-xl flex items-center"><HeartPulse className="mr-2 h-5 w-5 text-primary" />Vitals Summary</CardTitle>
              </CardHeader>
              <CardContent>
                  <ul className="space-y-1.5 text-sm">
                      {filteredVitals.map(vital => (
                           <li key={vital.label}><strong>{vital.label}:</strong> {vital.value} {vital.unit}</li>
                      ))}
                  </ul>
              </CardContent>
          </Card>
        </motion.div>
    );
  };


  if (isLoadingContext) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center text-center py-10 min-h-[calc(100vh-200px)]">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
          <h1 className="font-headline text-2xl font-semibold">Loading Analysis Results...</h1>
        </div>
      </MainLayout>
    );
  }

  if (!analysisResult) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center text-center py-10 min-h-[calc(100vh-200px)]">
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
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-between items-center"
          >
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
          </motion.div>

          {getPatientHeaderInfo()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <motion.div {...cardAnimationProps(0.1)}>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row justify-between items-start pb-3">
                    <div>
                      <CardTitle className="font-headline text-xl">Risk Score</CardTitle>
                       <CardDescription className="text-xs">Estimated patient risk.</CardDescription>
                    </div>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm p-3 bg-popover text-popover-foreground shadow-lg rounded-md border">
                        <p className="font-semibold text-primary mb-1">Risk Score Explanation</p>
                        <p>{riskScoreExplanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pt-0">
                    <RiskGauge score={analysisResult.riskScore} />
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {analysisResult.riskScore >= 70 && "High risk indicates need for urgent attention."}
                      {analysisResult.riskScore < 70 && analysisResult.riskScore >= 40 && "Medium risk suggests careful monitoring."}
                      {analysisResult.riskScore < 40 && "Low risk, continue routine monitoring."}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              {getVitalsSummary()}

              <motion.div {...cardAnimationProps(0.3)}>
                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-xl flex items-center"><Tag className="mr-2 h-5 w-5 text-primary"/>Identified ICD-10 Codes</CardTitle>
                    <CardDescription>Relevant codes based on symptoms and observations.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.icd10Tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.icd10Tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className={`text-sm px-3 py-1.5 border-2 rounded-full cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md hover:scale-105 ${getIcdColorClass(index)}`}
                            onClick={() => { /* Logic for modal from patient detail page if needed */}}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific ICD-10 codes identified.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div className="lg:col-span-2" {...cardAnimationProps(0.4)}>
              <Card className="shadow-lg h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-xl flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary"/>Draft SOAP Notes</CardTitle>
                  <CardDescription>Review the AI-generated clinical notes. Edit in the text area below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-md bg-secondary/30 max-h-80 overflow-y-auto mb-4 shadow-inner">
                    <ParsedSoapNotesDisplay notes={editableSoapNotes} />
                  </div>
                  <SoapNotesEditor 
                    currentNotes={editableSoapNotes} 
                    onNotesChange={handleSoapNotesChange} // ensure this updates parent state
                    onResetNotes={handleResetSoapNotes}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <SimilarCasesPanel isOpen={isSimilarCasesOpen} onOpenChange={setIsSimilarCasesOpen} />
          <ExportModal isOpen={isExportModalOpen} onOpenChange={setIsExportModalOpen} />
        </div>
      </TooltipProvider>
    </MainLayout>
  );
}

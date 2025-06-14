'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react'; // Added useCallback
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import RiskGauge from '@/components/results/RiskGauge';
import SoapNotesEditor from '@/components/results/SoapNotesEditor';
import { AnalyzePatientSymptomsInput } from '@/ai/flows/analyze-patient-symptoms';
import SimilarCasesPanel from '@/components/results/SimilarCasesPanel';
import ExportModal from '@/components/results/ExportModal';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, ListChecks, FileQuestion, Loader2, InfoIcon, User, CalendarDays, Tag, Fingerprint, HeartPulse, ClipboardList, AlertTriangle as AlertTriangleIcon, SearchCheck } from 'lucide-react'; // Added SearchCheck
import { format, parseISO } from 'date-fns';
import type { Patient, NewCaseFormValues, AIAnalysisOutput, ICD10Code, DifferentialDiagnosisItem } from '@/types'; // Added AIAnalysisOutput, ICD10Code, DifferentialDiagnosisItem
import { cn } from '@/lib/utils';
import { SimilarCasesApiInput, SimilarCaseOutput } from '@/types/similar-cases';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { summarizePatientCondition, SummarizePatientConditionInput } from '@/ai/flows/summarize-patient-condition'; // Added import
import { PatientConditionSummaryOutput } from '@/types/ai-outputs'; // Added import


const SoapSection: React.FC<{ title: string; content?: string }> = ({ title, content }) => {
  if (!content || content.trim() === '') return null;
  return (
    <div className="mb-3">
      <h4 className="font-semibold text-sm text-gray-700 mb-1">{title}</h4>
      <p className="text-sm text-gray-600 whitespace-pre-wrap pl-2 border-l-2 border-primary-500">{content}</p>
    </div>
  );
};

const ParsedSoapNotesDisplay: React.FC<{ notes?: string }> = ({ notes }) => {
  const sections = useMemo(() => {
    if (!notes) return { s: '', o: '', a: '', p: '' }; // Default for undefined notes
    const s = notes?.match(/S:([\s\S]*?)(O:|A:|P:|$)/i)?.[1]?.trim() || '';
    const o = notes?.match(/O:([\s\S]*?)(A:|P:|$)/i)?.[1]?.trim() || '';
    const a = notes?.match(/A:([\s\S]*?)(P:|$)/i)?.[1]?.trim() || '';
    const p = notes?.match(/P:([\s\S]*?)$/i)?.[1]?.trim() || '';
    return { s, o, a, p };
  }, [notes]);

  if (!notes || notes.trim() === '') {
    return <p className="text-gray-500 italic p-4">No SOAP notes available to parse.</p>;
  }

  // Check if all sections are empty after attempting to parse
  if (!sections.s && !sections.o && !sections.a && !sections.p) {
    return (
      <div className="text-gray-500 italic p-4 border rounded-md bg-gray-50">
        <p className="font-semibold">Could not parse SOAP notes into sections.</p>
        <p className="text-sm mt-1">Please ensure the notes in the editor are formatted with S:, O:, A:, and P: prefixes (e.g., "S: Patient states...").</p>
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">View original notes</summary>
          <pre className="whitespace-pre-wrap bg-white p-2 border rounded mt-1 text-gray-700">{notes}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      <SoapSection title="S (Subjective)" content={sections.s} />
      <SoapSection title="O (Objective)" content={sections.o} />
      <SoapSection title="A (Assessment)" content={sections.a} />
      <SoapSection title="P (Plan)" content={sections.p} />
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

const getRiskScoreBorderColor = (score: number): string => {
  const normalizedScore = (score >= 0 && score <= 1) ? Math.round(score * 100) : Math.round(score);
  if (normalizedScore >= 70) return 'border-red-500';
  if (normalizedScore >= 40) return 'border-yellow-500';
  return 'border-green-500';
};


export default function AnalysisPage() {
  const { analysisResult, analysisReturnPath, currentCaseDisplayData, setAnalysisResult: setAppStateContext } = useAppState();
  const router = useRouter();
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [editableSoapNotes, setEditableSoapNotes] = useState('');

  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [similarCases, setSimilarCases] = useState<SimilarCaseOutput[] | null>(null);
  const [isLoadingSimilarCases, setIsLoadingSimilarCases] = useState(false);
  const [similarCasesError, setSimilarCasesError] = useState<string | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // State for the new Clinical Insights Summary
  const [clinicalSummary, setClinicalSummary] = useState<PatientConditionSummaryOutput | null>(null);
  const [isLoadingClinicalSummary, setIsLoadingClinicalSummary] = useState(false);
  const [clinicalSummaryError, setClinicalSummaryError] = useState<string | null>(null);
  
  // useEffect to initialize editableSoapNotes based on analysisResult and currentCaseDisplayData
  useEffect(() => {
    if (typeof analysisResult !== 'undefined' && typeof currentCaseDisplayData !== 'undefined') {
      setIsLoadingContext(false);
      let initialNotes = '';
      if (analysisResult?.soapNotes) {
        initialNotes = analysisResult.soapNotes;
      } else if (currentCaseDisplayData) {
        if ('id' in currentCaseDisplayData && 'notes' in currentCaseDisplayData) { // Patient
          initialNotes = (currentCaseDisplayData as Patient).notes || '';
        } else if ('clinicalNotes' in currentCaseDisplayData) { // NewCaseFormValues
          initialNotes = (currentCaseDisplayData as NewCaseFormValues).clinicalNotes || '';
        }
      }
      setEditableSoapNotes(initialNotes);
    } else if (analysisResult === null && currentCaseDisplayData === null) {
      // This case handles when both are explicitly null (e.g., after error or navigating away)
      // and we are not already in a loading state from another effect.
      setIsLoadingContext(false); // Ensure loading is false if data is confirmed absent
      setEditableSoapNotes('');
    }
    // If only one is undefined, isLoadingContext might remain true or be handled by other logic,
    // this effect primarily focuses on setting notes once data is available or confirmed absent.
  }, [analysisResult, currentCaseDisplayData]);

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

  // Prepare patient data for AI enhancement
  const patientDataForAI = useMemo((): AnalyzePatientSymptomsInput | undefined => {
    if (!currentCaseDisplayData) return undefined;

    if ('id' in currentCaseDisplayData && 'conditions' in currentCaseDisplayData) {
      // This is a Patient object
      const patient = currentCaseDisplayData as Patient;
      const allergiesStr = patient.allergies?.length ? patient.allergies.join(', ') : 'None';
      const medicationsStr = patient.medications?.length ? patient.medications.join(', ') : 'None';
      return {
        patientInformation: `Name: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}, Conditions: ${patient.conditions.join(', ')}, Allergies: ${allergiesStr}, Medications: ${medicationsStr}, Primary Complaint: ${patient.primaryComplaint || 'N/A'}`,
        vitals: `BP: ${patient.vitals.bp}, HR: ${patient.vitals.hr}, Temp: ${patient.vitals.temp}, RR: ${patient.vitals.rr}, SpO2: ${patient.vitals.spo2}`,
        observations: patient.notes || 'No specific observations recorded for this patient beyond their chart data.',
      };
    } else {
      // This is NewCaseFormValues
      const form = currentCaseDisplayData as NewCaseFormValues;
      const allergiesStr = form.allergies?.trim() ? form.allergies : 'None';
      const medicationsStr = form.medications?.trim() ? form.medications : 'None';
      return {
        patientInformation: `Name: ${form.patientName}, Age: ${form.age}, Gender: ${form.gender}, Previous Conditions: ${form.previousConditions || 'None'}, Allergies: ${allergiesStr}, Medications: ${medicationsStr}, Primary Complaint: ${form.primaryComplaint}`,
        vitals: `BP: ${form.bp}, HR: ${form.hr}, Temp: ${form.temp}, RR: ${form.rr}, SpO2: ${form.spo2}`,
        observations: form.clinicalNotes || 'No specific observations provided in the form.',
      };
    }
  }, [currentCaseDisplayData]);

  // UseMemo for SummarizePatientConditionInput
  const patientDataForSummary = useMemo((): SummarizePatientConditionInput | undefined => {
    if (!currentCaseDisplayData) return undefined;
    // This can reuse much of the logic from patientDataForAI, 
    // but ensure it maps to SummarizePatientConditionInput fields correctly.
    if ('id' in currentCaseDisplayData && 'conditions' in currentCaseDisplayData) {
      const patient = currentCaseDisplayData as Patient;
      const allergiesStr = patient.allergies?.length ? patient.allergies.join(', ') : 'None';
      const medicationsStr = patient.medications?.length ? patient.medications.join(', ') : 'None';
      return {
        patientInformation: `Age: ${patient.age}, Gender: ${patient.gender}, Conditions: ${patient.conditions.join(', ')}, Allergies: ${allergiesStr}, Medications: ${medicationsStr}, Primary Complaint: ${patient.primaryComplaint || 'N/A'}`,
        vitals: `BP: ${patient.vitals.bp}, HR: ${patient.vitals.hr}, Temp: ${patient.vitals.temp}, RR: ${patient.vitals.rr}, SpO2: ${patient.vitals.spo2}`,
        observations: patient.notes || 'No specific observations recorded for this patient beyond their chart data.',
      };
    } else {
      const form = currentCaseDisplayData as NewCaseFormValues;
      const allergiesStr = form.allergies?.trim() ? form.allergies : 'None';
      const medicationsStr = form.medications?.trim() ? form.medications : 'None';
      return {
        patientInformation: `Age: ${form.age}, Gender: ${form.gender}, Previous Conditions: ${form.previousConditions || 'None'}, Allergies: ${allergiesStr}, Medications: ${medicationsStr}, Primary Complaint: ${form.primaryComplaint}`,
        vitals: `BP: ${form.bp}, HR: ${form.hr}, Temp: ${form.temp}, RR: ${form.rr}, SpO2: ${form.spo2}`,
        observations: form.clinicalNotes || 'No specific observations provided in the form.',
      };
    }
  }, [currentCaseDisplayData]);

  const fetchSimilarCases = useCallback(async () => {
    if (!analysisResult?.summary && !editableSoapNotes) {
      setSimilarCasesError("No case summary available to find similar cases.");
      return;
    }
    
    const caseNoteToEmbed = analysisResult?.summary || editableSoapNotes;
    if (!caseNoteToEmbed || caseNoteToEmbed.trim().length < 20) { // Basic check for meaningful content
        setSimilarCasesError("Case summary is too short or unavailable to find similar cases.");
        return;
    }

    setIsLoadingSimilarCases(true);
    setSimilarCasesError(null);
    setSimilarCases(null);

    try {
      const input: SimilarCasesApiInput = { note: caseNoteToEmbed }; // Use 'note' field
      const response = await fetch('/api/similar-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch similar cases: ${response.statusText}`);
      }

      const data: SimilarCaseOutput[] = await response.json();
      setSimilarCases(data);
    } catch (error: any) {
      console.error("Error fetching similar cases:", error);
      setSimilarCasesError(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoadingSimilarCases(false);
    }
  }, [analysisResult?.summary, editableSoapNotes]);

  // Fetch Clinical Summary useEffect
  useEffect(() => {
    const fetchClinicalSummary = async () => {
      if (!patientDataForSummary) {
        // console.log("Patient data for summary not ready yet.");
        return;
      }

      // console.log("Attempting to fetch clinical summary with data:", patientDataForSummary);
      setIsLoadingClinicalSummary(true);
      setClinicalSummaryError(null);
      setClinicalSummary(null);

      try {
        const summary = await summarizePatientCondition(patientDataForSummary);
        // console.log("Received clinical summary:", summary);
        setClinicalSummary(summary);
      } catch (error: any) {
        console.error("Error fetching clinical summary:", error);
        setClinicalSummaryError(error.message || "An unexpected error occurred while generating the clinical summary.");
      }
      setIsLoadingClinicalSummary(false);
    };

    if (currentCaseDisplayData) { // Trigger when currentCaseDisplayData is available
        fetchClinicalSummary();
    }
  }, [patientDataForSummary, currentCaseDisplayData]); // Added currentCaseDisplayData as dependency

  useEffect(() => {
    if (typeof analysisResult !== 'undefined' && typeof currentCaseDisplayData !== 'undefined') {
      setIsLoadingContext(false);
      let initialNotes = '';
      if (analysisResult?.soapNotes) {
        initialNotes = analysisResult.soapNotes;
      } else if (currentCaseDisplayData) {
        if ('id' in currentCaseDisplayData && 'notes' in currentCaseDisplayData) { // Patient
          initialNotes = (currentCaseDisplayData as Patient).notes || '';
        } else if ('clinicalNotes' in currentCaseDisplayData) { // NewCaseFormValues
          initialNotes = (currentCaseDisplayData as NewCaseFormValues).clinicalNotes || '';
        }
      }
      setEditableSoapNotes(initialNotes);
    } else if (analysisResult === null && currentCaseDisplayData === null) {
      // This case handles when both are explicitly null (e.g., after error or navigating away)
      // and we are not already in a loading state from another effect.
      setIsLoadingContext(false); // Ensure loading is false if data is confirmed absent
      setEditableSoapNotes('');
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
    let notesToResetTo = '';
    if (analysisResult?.soapNotes) {
      notesToResetTo = analysisResult.soapNotes;
    } else if (currentCaseDisplayData) {
      if ('id' in currentCaseDisplayData && 'notes' in currentCaseDisplayData) { // Patient
        notesToResetTo = (currentCaseDisplayData as Patient).notes || '';
      } else if ('clinicalNotes' in currentCaseDisplayData) { // NewCaseFormValues
        notesToResetTo = (currentCaseDisplayData as NewCaseFormValues).clinicalNotes || '';
      }
    }
    setEditableSoapNotes(notesToResetTo);
  };

  const getPatientHeaderInfo = () => {
    if (!currentCaseDisplayData) return null;

    let name: string | undefined;
    let age: number | string | undefined;
    let gender: string | undefined;
    let keyInfoDisplay: string | undefined; // Renamed from conditionsOrComplaint
    let visitDate: Date | string | undefined;
    let caseId: string | undefined;

    if ('id' in currentCaseDisplayData && 'conditions' in currentCaseDisplayData) { 
      const patient = currentCaseDisplayData as Patient;
      name = patient.name;
      age = patient.age;
      gender = patient.gender;
      // Construct a more detailed keyInfoDisplay for existing patients
      const conditions = patient.conditions.length > 0 ? `Conditions: ${patient.conditions.join(', ')}` : '';
      const complaint = patient.primaryComplaint ? `Complaint: ${patient.primaryComplaint}` : '';
      keyInfoDisplay = [conditions, complaint].filter(Boolean).join('; ') || 'No specific key info.';
      visitDate = patient.lastVisit ? parseISO(patient.lastVisit) : undefined; 
      caseId = patient.id;
    } else { 
      const formValues = currentCaseDisplayData as NewCaseFormValues;
      name = formValues.patientName;
      age = formValues.age;
      gender = formValues.gender;
      // Construct keyInfoDisplay for new cases
      const complaint = formValues.primaryComplaint ? `Complaint: ${formValues.primaryComplaint}` : '';
      const prevConditions = formValues.previousConditions ? `Previous Conditions: ${formValues.previousConditions}` : '';
      keyInfoDisplay = [complaint, prevConditions].filter(Boolean).join('; ') || 'No specific key info.';
      visitDate = formValues.visitDate; 
      caseId = "New Case Analysis";
    }

    return (
      <motion.div 
        {...cardAnimationProps(0)} 
        className="mb-6 p-4 border border-primary/30 rounded-lg bg-secondary shadow-lg"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-3 sm:mb-0">
            <h1 className="text-2xl font-bold text-primary flex items-center">
              <User className="mr-2 h-7 w-7" /> {name || 'N/A'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Case ID: {caseId}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center"><Fingerprint className="mr-1.5 h-4 w-4 text-primary" /> Age: {age !== undefined ? age : 'N/A'}</div>
            <div className="flex items-center"><HeartPulse className="mr-1.5 h-4 w-4 text-primary" /> Gender: {gender || 'N/A'}</div>
            {visitDate && (
              <div className="flex items-center col-span-2 sm:col-span-1"><CalendarDays className="mr-1.5 h-4 w-4 text-primary" /> Visit: {format(visitDate, 'MMM d, yyyy')}</div>
            )}
          </div>
        </div>
        {keyInfoDisplay && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <p className="text-sm text-foreground whitespace-normal break-words"> {/* Added whitespace-normal and break-words */}
              <span className="font-medium text-primary">Key Info:</span> {keyInfoDisplay}
            </p>
          </div>
        )}
      </motion.div>
    );
  };
  
  const getVitalsSummary = () => {
    if (!currentCaseDisplayData) return null;
    
    let vitalsData: Array<{label: string; value?: string; unit: string}> = [];

    if ('id' in currentCaseDisplayData && 'vitals' in currentCaseDisplayData) { 
        const patientVitals = (currentCaseDisplayData as Patient).vitals;
        vitalsData = [
            { label: 'BP', value: patientVitals.bp, unit: 'mmHg' },
            { label: 'HR', value: patientVitals.hr, unit: 'bpm' },
            { label: 'RR', value: patientVitals.rr, unit: '/min' },
            { label: 'Temp', value: patientVitals.temp, unit: '°C' },
            { label: 'SpO₂', value: patientVitals.spo2, unit: '%' },
        ];
    } else { 
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
          if (vital.unit && displayValue.toLowerCase().endsWith(vital.unit.toLowerCase())) {
              displayValue = displayValue.substring(0, displayValue.length - vital.unit.length).trim();
          }
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
                           <li key={vital.label} className="text-foreground"><strong>{vital.label}:</strong> {vital.value} {vital.unit}</li>
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
  
  // Destructure properties from analysisResult for cleaner access in JSX
  // This is safe because we've checked for !analysisResult above.
  const {
    summary, // Now correctly typed as optional
    icd10Tags: icdCodes, // Renamed for consistency with existing variable, ensure AIAnalysisOutput uses icd10Tags
    differentialDiagnosis, // Now correctly typed as optional
    recommendedTests, // Now correctly typed as optional
    treatmentSuggestions, // Now correctly typed as optional
    riskScore,
    // soapNotes is handled by editableSoapNotes state, initialized from analysisResult.soapNotes in useEffect
  } = analysisResult as AIAnalysisOutput; // Added type assertion

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="container mx-auto px-2 sm:px-4 py-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-between items-center mb-6"
          >
            <Button variant="outline" onClick={handleBackNavigation} className="shadow-sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="flex space-x-3">
              <Button 
                variant="default" 
                onClick={() => {
                  fetchSimilarCases();
                  setIsSimilarCasesOpen(true);
                }}
                className="shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <SearchCheck className="mr-2 h-4 w-4" /> View Similar Cases
              </Button>
              <Button variant="secondary" onClick={() => setIsExportModalOpen(true)} className="shadow-sm">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </motion.div>

          {getPatientHeaderInfo()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column / Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Existing Clinical Assessment Summary Card - can be kept or merged */}
              {/* <motion.div {...cardAnimationProps(0.1)}>
                <Card className={cn("shadow-xl border-2", getRiskScoreBorderColor(riskScore))}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-semibold text-primary flex items-center">
                        <ListChecks className="mr-2 h-6 w-6" /> Clinical Assessment Summary (Original AI)
                        </CardTitle>
                        <CardDescription>
                        AI-powered insights based on the provided patient data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="mb-4 p-3 bg-secondary/50 rounded-md">
                        <h3 className="font-semibold text-md text-primary mb-1">Overall Summary:</h3>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{summary || 'No summary available.'}</p>
                        </div>

                        {icdCodes && icdCodes.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-md text-primary mb-2">Potential ICD-10 Codes:</h3>
                            <div className="flex flex-wrap gap-2">
                            {icdCodes.map((code: ICD10Code, index: number) => (
                                <Tooltip key={code.code}>
                                <TooltipTrigger asChild>
                                    <Badge
                                    variant="outline"
                                    className={cn("cursor-default border-2 text-xs font-medium px-2.5 py-1 rounded-full transition-all", getIcdColorClass(index))}
                                    >
                                    {code.code} - {code.description.length > 40 ? `${code.description.substring(0, 37)}...` : code.description}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs bg-background text-foreground border shadow-lg rounded-md p-2">
                                    <p className="font-semibold">{code.code}</p>
                                    <p>{code.description}</p>
                                </TooltipContent>
                                </Tooltip>
                            ))}
                            </div>
                        </div>
                        )}

                        {differentialDiagnosis && differentialDiagnosis.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-md text-primary mb-2">Differential Diagnosis:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground pl-1">
                            {differentialDiagnosis.map((diag: DifferentialDiagnosisItem, index: number) => (
                                <li key={index}>{diag.condition} (Likelihood: {diag.likelihood})</li>
                            ))}
                            </ul>
                        </div>
                        )}
                        {recommendedTests && recommendedTests.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-md text-primary mb-2">Recommended Tests:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground pl-1">
                            {recommendedTests.map((test: string, index: number) => <li key={index}>{test}</li>)}
                            </ul>
                        </div>
                        )}
                        {treatmentSuggestions && treatmentSuggestions.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-md text-primary mb-2">Treatment Suggestions:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground pl-1">
                            {treatmentSuggestions.map((suggestion: string, index: number) => <li key={index}>{suggestion}</li>)}
                            </ul>
                        </div>
                        )}
                    </CardContent>
                    </Card>
                </motion.div> */} 

              {/* New Clinical Insights Summary Card */}
              <motion.div {...cardAnimationProps(0.1)}>
                <Card className="shadow-xl border-2 border-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-semibold text-blue-700 flex items-center">
                      <InfoIcon className="mr-2 h-6 w-6" /> Clinical Insights & Considerations
                    </CardTitle>
                    <CardDescription>
                      AI-generated synthesis of patient data for clinical support. This is not a diagnosis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-4">
                    {isLoadingClinicalSummary && (
                      <div className="flex flex-col items-center justify-center py-6">
                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
                        <p className="text-blue-600">Generating Clinical Insights...</p>
                      </div>
                    )}
                    {clinicalSummaryError && (
                      <Alert variant="destructive">
                        <AlertTriangleIcon className="h-4 w-4" />
                        <AlertTitle>Error Generating Summary</AlertTitle>
                        <AlertDescription>{clinicalSummaryError}</AlertDescription>
                      </Alert>
                    )}
                    {clinicalSummary && !isLoadingClinicalSummary && !clinicalSummaryError && (
                      <>
                        <div className="p-3 bg-blue-50 rounded-md">
                          <h4 className="font-semibold text-md text-blue-700 mb-1">Overall Assessment:</h4>
                          <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{clinicalSummary.overallAssessment}</p>
                        </div>
                        
                        {clinicalSummary.keyFindings && clinicalSummary.keyFindings.length > 0 && clinicalSummary.keyFindings[0] !== 'No specific key findings identified or data insufficient.' && (
                            <div className="p-3 bg-green-50 rounded-md">
                            <h4 className="font-semibold text-md text-green-700 mb-1">Key Findings:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-green-900 pl-1">
                                {clinicalSummary.keyFindings.map((finding, index) => <li key={index}>{finding}</li>)}
                            </ul>
                            </div>
                        )}

                        {clinicalSummary.careSuggestions && clinicalSummary.careSuggestions.length > 0 && clinicalSummary.careSuggestions[0] !== 'No specific care suggestions identified or data insufficient.' && (
                            <div className="p-3 bg-yellow-50 rounded-md">
                            <h4 className="font-semibold text-md text-yellow-700 mb-1">Potential Considerations:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-900 pl-1">
                                {clinicalSummary.careSuggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                            </ul>
                            </div>
                        )}
                        
                        <div className="p-3 bg-gray-100 rounded-md">
                          <h4 className="font-semibold text-md text-gray-700 mb-1">Information Sufficiency:</h4>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{clinicalSummary.furtherDataNeeded}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div {...cardAnimationProps(0.2)}>
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-primary flex items-center">
                      <FileQuestion className="mr-2 h-6 w-6" /> SOAP Notes
                    </CardTitle>
                    <CardDescription>
                      Review and edit the AI-generated SOAP notes. You can also view the parsed sections.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="editor" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="parsed">Parsed View</TabsTrigger>
                      </TabsList>
                      <TabsContent value="editor">
                        <SoapNotesEditor
                          currentNotes={editableSoapNotes}
                          onNotesChange={handleSoapNotesChange}
                          onResetNotes={handleResetSoapNotes}
                        />
                      </TabsContent>
                      <TabsContent value="parsed">
                        {/* ADDING CONSOLE LOG HERE */}
                        <script dangerouslySetInnerHTML={{ __html: `console.log('[AnalysisPage] Parsed View - editableSoapNotes:', ${JSON.stringify(editableSoapNotes)})` }} />
                        <ParsedSoapNotesDisplay notes={editableSoapNotes} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column / Sidebar */}
            <div className="space-y-6">
              <motion.div {...cardAnimationProps(0.15)}>
                <Card className={cn("shadow-xl border-2 sticky top-24", getRiskScoreBorderColor(riskScore))}>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg font-semibold text-primary">Overall Risk Score</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center pt-0">
                    <RiskGauge score={riskScore} /> 
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center cursor-help">
                          <InfoIcon className="h-3 w-3 mr-1" /> {riskScoreExplanation}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-background text-foreground border shadow-lg rounded-md p-2">
                        <p>{riskScoreExplanation}</p>
                        <p className="mt-1 text-xs">This score is an estimate based on AI analysis and should be interpreted by a medical professional.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div {...cardAnimationProps(0.25)}>
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-primary flex items-center">
                      <ClipboardList className="mr-2 h-5 w-5" /> Patient Vitals & Observations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3"> {/* Increased space-y */} 
                    {patientDataForAI ? (
                      <>
                        <div>
                          <strong className="block text-primary mb-0.5">Vitals:</strong> 
                          <span className="text-foreground">{patientDataForAI.vitals}</span>
                        </div>
                        
                        {/* Improved Patient Information Display */}
                        <div className="space-y-1">
                          <strong className="block text-primary mb-0.5">Key Info from Form/Chart:</strong>
                          {(() => {
                            const info = patientDataForAI.patientInformation.replace(/Name: [^,]+, /, '');
                            const parts = info.split(/, (?=[A-Z][a-z]+:)/); // Split before capitalized words followed by a colon
                            return parts.map((part, index) => (
                              <div key={index} className="ml-2">
                                <span className="text-foreground">{part.trim()}</span>
                              </div>
                            ));
                          })()}
                        </div>

                        <div>
                          <strong className="block text-primary mb-0.5">Observations:</strong> 
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed">{patientDataForAI.observations}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Patient details not fully loaded.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </TooltipProvider>

      <SimilarCasesPanel 
        isOpen={isSimilarCasesOpen} 
        onOpenChange={setIsSimilarCasesOpen} 
        cases={similarCases}
        isLoading={isLoadingSimilarCases}
        error={similarCasesError}
      />

      <ExportModal 
        isOpen={isExportModalOpen} 
        onOpenChange={setIsExportModalOpen} 
        analysisData={analysisResult} 
        patientData={currentCaseDisplayData}
        soapNotes={editableSoapNotes}
      />
    </MainLayout>
  );
}

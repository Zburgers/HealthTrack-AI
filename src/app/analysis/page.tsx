'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react'; // Added useCallback
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast'; // Added useToast import
import RiskGauge from '@/components/results/RiskGauge';
import SoapNotesEditor from '@/components/results/SoapNotesEditor';
import SimilarCasesPanel from '@/components/results/SimilarCasesPanel';
import ExportModal from '@/components/results/ExportModal';
import AnalysisCharts from '@/components/results/AnalysisCharts';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, ListChecks, FileQuestion, Loader2, InfoIcon, User, CalendarDays, Tag, Fingerprint, HeartPulse, ClipboardList, AlertTriangle as AlertTriangleIcon, SearchCheck, MessageSquare, Brain, Activity,
  ClipboardCheck, // Added
  ListTree,     // Added
  Lightbulb,    // Added
  FileSearch2   // Added
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Patient, NewCaseFormValues, AIAnalysisOutput, ICD10Code, DifferentialDiagnosisItem } from '@/types'; // Added AIAnalysisOutput, ICD10Code, DifferentialDiagnosisItem
import { cn } from '@/lib/utils';
import { 
  parseSOAPNotes, 
  isValidSOAPFormat, 
  getSoapValidationSummary,
  formatToXMLFormat 
} from '@/lib/soap-parser';
import { SimilarCasesApiInput, SimilarCaseOutput } from '@/types/similar-cases';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientConditionSummaryOutput } from '@/types/ai-outputs'; // Added import
import { Skeleton, SkeletonCard, SkeletonText, SkeletonButton, SkeletonTable } from '@/components/ui/skeleton';

// Define types for API inputs without importing Vertex AI client-side
interface AnalyzePatientSymptomsInput {
  patientName: string;
  age: number;
  gender: string;
  visitDate: string;
  primaryComplaint: string;
  vitals: string;
  observations: string;
  patientInformation?: string;
  medicalHistory?: {
    allergies?: string[];
    currentMedications?: string[];
    previousConditions?: string[];
  };
}

interface SummarizePatientConditionInput {
  patientInformation: string;
  vitals: string;
  observations: string;
}


const SoapSection: React.FC<{ title: string; content?: string; icon?: React.ReactNode; color?: string }> = ({ 
  title, 
  content, 
  icon, 
  color = "blue" 
}) => {
  if (!content || content.trim() === '') return null;
  
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800", 
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800"
  };
  
  return (
    <motion.div 
      className={`mb-4 p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]} shadow-sm`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="font-semibold text-base">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </motion.div>
  );
};

// Parsed SOAP Notes Display Component
const ParsedSoapNotesDisplay: React.FC<{ notes?: string }> = ({ notes }) => {
  const soapResult = useMemo(() => {
    return parseSOAPNotes(notes || '');
  }, [notes]);

  if (!notes || notes.trim() === '') {
    return <p className="text-gray-500 italic p-4">No SOAP notes available to parse.</p>;
  }

  // Check if parsing failed completely
  if (!soapResult.subjective && !soapResult.objective && !soapResult.assessment && !soapResult.plan) {
    return (
      <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangleIcon className="h-6 w-6 text-amber-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-base mb-2">Could not parse SOAP notes into sections.</p>
            <p className="text-sm text-amber-700 mb-3">
              Please ensure the notes in the editor are formatted with <strong>S:</strong>, <strong>O:</strong>, <strong>A:</strong>, and <strong>P:</strong> prefixes (e.g., "S: Patient states...").
            </p>
            {soapResult.errors && soapResult.errors.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-amber-800">Issues found:</p>
                <ul className="list-disc list-inside text-sm text-amber-700">
                  {soapResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
              <div className="flex items-center gap-2">
                <SearchCheck className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">💡 Quick Fix</p>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Use the "AI Enhancement" button in the Editor tab to automatically format your notes into proper SOAP structure.
              </p>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-amber-700 hover:text-amber-900 font-medium">View original notes</summary>
              <div className="mt-2 p-3 bg-white border border-amber-200 rounded-md">
                <pre className="whitespace-pre-wrap text-gray-700 text-xs leading-relaxed">{notes}</pre>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }  return (
    <motion.div 
      className="space-y-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Success header with warnings for partial parsing */}
      <motion.div 
        className={`flex items-center gap-2 mb-4 p-3 border rounded-lg ${
          soapResult.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {soapResult.isValid ? (
          <SearchCheck className="h-5 w-5 text-green-600" />
        ) : (
          <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
        )}
        <div className="flex-1">
          <span className={`text-sm font-medium ${
            soapResult.isValid ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {soapResult.isValid 
              ? '✅ SOAP notes successfully parsed into structured sections'
              : '⚠️ SOAP notes partially parsed - some sections may be incomplete'
            }
          </span>
          {!soapResult.isValid && soapResult.errors && soapResult.errors.length > 0 && (
            <div className="mt-1">
              <ul className="list-disc list-inside text-xs text-yellow-700">
                {soapResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
      
      <SoapSection 
        title="S (Subjective)" 
        content={soapResult.subjective} 
        icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
        color="blue"
      />
      <SoapSection 
        title="O (Objective)" 
        content={soapResult.objective} 
        icon={<Activity className="h-5 w-5 text-green-600" />}
        color="green"
      />
      <SoapSection 
        title="A (Assessment)" 
        content={soapResult.assessment} 
        icon={<Brain className="h-5 w-5 text-purple-600" />}
        color="purple"
      />
      <SoapSection 
        title="P (Plan)" 
        content={soapResult.plan} 
        icon={<ClipboardList className="h-5 w-5 text-orange-600" />}
        color="orange"
      />
    </motion.div>
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

// Enhanced animation variants for the results page
const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    scale: 1.02,
    transition: { duration: 0.3 }
  }
};

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const getRiskScoreBorderColor = (score: number): string => {
  const normalizedScore = (score >= 0 && score <= 1) ? Math.round(score * 100) : Math.round(score);
  if (normalizedScore >= 70) return 'border-red-500';
  if (normalizedScore >= 40) return 'border-yellow-500';
  return 'border-green-500';
};

// Medical placeholder phrases for loading state
const medicalLoadingPhrases = [
  "Synthesizing patient data...",
  "Consulting clinical guidelines...",
  "Analyzing symptoms and vitals...",
  "Reviewing medical history...",
  "Generating AI-powered insights...",
  "Cross-referencing similar cases...",
  "Evaluating risk factors...",
  "Drafting clinical summary...",
  "Formulating differential diagnosis...",
  "Preparing treatment suggestions...",
  "Ensuring patient safety...",
  "Finalizing SOAP notes...",
];

function MedicalLoadingAnimation() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % medicalLoadingPhrases.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 min-h-[calc(100vh-200px)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <span className="inline-block p-4 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 shadow-lg">
          <svg className="w-16 h-16 text-blue-600 animate-spin-slow" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </span>
      </motion.div>
      <motion.h1
        className="font-headline text-2xl font-semibold text-blue-900 mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        AI Clinical Analysis in Progress
      </motion.h1>
      <motion.p
        className="text-lg text-blue-700 mb-4 min-h-[32px]"
        key={phraseIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
      >
        {medicalLoadingPhrases[phraseIndex]}
      </motion.p>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        Our AI is working to provide you with a comprehensive, research-backed clinical summary. This may take a few moments. Thank you for your patience!
      </p>
    </div>
  );
}

export default function AnalysisPage() {
  const { analysisResult, analysisReturnPath, currentCaseDisplayData, setAnalysisResult: setAppStateContext } = useAppState();
  const router = useRouter();
  const { toast } = useToast(); // Add toast hook
  // Force loading state to true initially when coming from patient view
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [restoringState, setRestoringState] = useState(false);
  const [editableSoapNotes, setEditableSoapNotes] = useState('');
  
  // State for managing saved vs unsaved AI-enhanced notes
  const [parsedViewNotes, setParsedViewNotes] = useState(''); // What shows in parsed view
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAISoapNotes, setLastSavedAISoapNotes] = useState(''); // Latest saved AI SOAP notes

  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [similarCases, setSimilarCases] = useState<SimilarCaseOutput[] | null>(null);
  const [isLoadingSimilarCases, setIsLoadingSimilarCases] = useState(false);
  const [similarCasesError, setSimilarCasesError] = useState<string | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // State for the new Clinical Insights Summary
  const [clinicalSummary, setClinicalSummary] = useState<PatientConditionSummaryOutput | null>(null);
  const [isLoadingClinicalSummary, setIsLoadingClinicalSummary] = useState(false);
  const [clinicalSummaryError, setClinicalSummaryError] = useState<string | null>(null);
  
  // State for SOAP notes enhancement notification
  const [showEnhancementNotification, setShowEnhancementNotification] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);    // useEffect to initialize editableSoapNotes and parsedViewNotes based on analysisResult and currentCaseDisplayData
  useEffect(() => {
    if (typeof analysisResult !== 'undefined' && typeof currentCaseDisplayData !== 'undefined') {
      setIsLoadingContext(false);
      let editorNotes = '';
      let parsedNotes = '';
      let savedAINotes = '';
        // Initialize editor notes with original observations/notes
      if (currentCaseDisplayData) {
        if ('id' in currentCaseDisplayData && 'doctorsObservations' in currentCaseDisplayData) { // Patient
          editorNotes = (currentCaseDisplayData as Patient).doctorsObservations || '';
        } else if ('clinicalNotes' in currentCaseDisplayData) { // NewCaseFormValues
          editorNotes = (currentCaseDisplayData as NewCaseFormValues).clinicalNotes || '';
        }
      }
      
      // Initialize parsed view notes with priority order:
      // 1. Previously saved AI SOAP notes (for existing patients)
      // 2. Fresh AI analysis SOAP notes 
      // 3. Original clinical notes as fallback
      
      if (currentCaseDisplayData && 'id' in currentCaseDisplayData && 'aiSoapNotes' in currentCaseDisplayData) {
        // Load previously saved AI SOAP notes for existing patients
        const patient = currentCaseDisplayData as Patient;
        if (patient.aiSoapNotes) {
          parsedNotes = patient.aiSoapNotes;
          savedAINotes = patient.aiSoapNotes;
        }
      }
      
      // If no saved AI SOAP notes, try loading from fresh analysis
      if (!parsedNotes && analysisResult?.soapNotes) {
        parsedNotes = analysisResult.soapNotes;
      }
      
      // Fallback to original clinical notes
      if (!parsedNotes) {
        parsedNotes = editorNotes;
      }
      
      setEditableSoapNotes(editorNotes);
      setParsedViewNotes(parsedNotes);
      setLastSavedAISoapNotes(savedAINotes);
      setHasUnsavedChanges(false);
    } else if (analysisResult === null && currentCaseDisplayData === null) {
      // This case handles when both are explicitly null (e.g., after error or navigating away)
      // and we are not already in a loading state from another effect.
      setIsLoadingContext(false); // Ensure loading is false if data is confirmed absent
      setEditableSoapNotes('');
      setParsedViewNotes('');
      setLastSavedAISoapNotes('');
      setHasUnsavedChanges(false);    }
    // If only one is undefined, isLoadingContext might remain true or be handled by other logic,
    // this effect primarily focuses on setting notes once data is available or confirmed absent.
  }, [analysisResult, currentCaseDisplayData]);

  // Effect to warn user about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved AI-enhanced SOAP notes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };  }, [hasUnsavedChanges]);

  // Helper function to validate SOAP format using the utility
  const isValidSoapFormat = (notes: string): boolean => {
    return isValidSOAPFormat(notes);
  };

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
      return {
        patientName: patient.name,
        age: patient.age,
        gender: patient.gender,
        visitDate: patient.lastVisit ? new Date(patient.lastVisit).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        primaryComplaint: patient.primaryComplaint || 'No primary complaint specified',
        vitals: `BP: ${patient.vitals.bp || 'N/A'}, HR: ${patient.vitals.hr || 'N/A'}, Temp: ${patient.vitals.temp || 'N/A'}, RR: ${patient.vitals.rr || 'N/A'}, SpO2: ${patient.vitals.spo2 || 'N/A'}`,
        observations: patient.doctorsObservations || 'No specific observations recorded for this patient beyond their chart data.',
        medicalHistory: {
          allergies: patient.allergies || [],
          currentMedications: patient.medications || [],
          previousConditions: patient.conditions || [],
        },
      };
    } else {
      // This is NewCaseFormValues
      const form = currentCaseDisplayData as NewCaseFormValues;
      return {
        patientName: form.patientName,
        age: form.age,
        gender: form.gender,
        visitDate: form.visitDate.toISOString().split('T')[0],
        primaryComplaint: form.primaryComplaint,
        vitals: `BP: ${form.bp || 'N/A'}, HR: ${form.hr || 'N/A'}, Temp: ${form.temp || 'N/A'}, RR: ${form.rr || 'N/A'}, SpO2: ${form.spo2 || 'N/A'}`,
        observations: form.clinicalNotes || form.observations || 'No specific observations provided in the form.',
        medicalHistory: {
          allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
          currentMedications: form.medications ? form.medications.split(',').map(m => m.trim()).filter(m => m) : [],
          previousConditions: form.previousConditions ? form.previousConditions.split(',').map(c => c.trim()).filter(c => c) : [],
        },
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
      const medicationsStr = patient.medications?.length ? patient.medications.join(', ') : 'None';      return {
        patientInformation: `Age: ${patient.age}, Gender: ${patient.gender}, Conditions: ${patient.conditions.join(', ')}, Allergies: ${allergiesStr}, Medications: ${medicationsStr}, Primary Complaint: ${patient.primaryComplaint || 'N/A'}`,
        vitals: `BP: ${patient.vitals.bp}, HR: ${patient.vitals.hr}, Temp: ${patient.vitals.temp}, RR: ${patient.vitals.rr}, SpO2: ${patient.vitals.spo2}`,
        observations: patient.doctorsObservations || 'No specific observations recorded for this patient beyond their chart data.',
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

  // --- Combined Analysis and Summary Fetch ---
  useEffect(() => {
    if (!currentCaseDisplayData) return;
    
    // Force loading state to true whenever we start an analysis
    setIsLoadingContext(true);
    
    // Build patientInformation string
    let patientInformation = '';
    let vitals = '';
    let observations = '';
    let medicalHistory = undefined;

    if ('id' in currentCaseDisplayData && 'conditions' in currentCaseDisplayData) {
      // Patient object
      const patient = currentCaseDisplayData;
      patientInformation = `Name: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}, Conditions: ${Array.isArray(patient.conditions) ? patient.conditions.join(', ') : ''}, Allergies: ${Array.isArray(patient.allergies) ? patient.allergies.join(', ') : ''}, Medications: ${Array.isArray(patient.medications) ? patient.medications.join(', ') : ''}, Primary Complaint: ${patient.primaryComplaint || 'N/A'}`;
      vitals = `BP: ${patient.vitals.bp || 'N/A'}, HR: ${patient.vitals.hr || 'N/A'}, Temp: ${patient.vitals.temp || 'N/A'}, RR: ${patient.vitals.rr || 'N/A'}, SpO2: ${patient.vitals.spo2 || 'N/A'}`;
      observations = patient.doctorsObservations || '';
      medicalHistory = {
        allergies: Array.isArray(patient.allergies) ? patient.allergies : [],
        currentMedications: Array.isArray(patient.medications) ? patient.medications : [],
        previousConditions: Array.isArray(patient.conditions) ? patient.conditions : [],
        primaryComplaint: patient.primaryComplaint || '',
      };
    } else {
      // NewCaseFormValues
      const form = currentCaseDisplayData;
      patientInformation = `Name: ${form.patientName}, Age: ${form.age}, Gender: ${form.gender}, Previous Conditions: ${form.previousConditions || 'None'}, Allergies: ${form.allergies || 'None'}, Medications: ${form.medications || 'None'}, Primary Complaint: ${form.primaryComplaint}`;
      vitals = `BP: ${form.bp || 'N/A'}, HR: ${form.hr || 'N/A'}, Temp: ${form.temp || 'N/A'}, RR: ${form.rr || 'N/A'}, SpO2: ${form.spo2 || 'N/A'}`;
      observations = form.clinicalNotes || form.observations || '';
      medicalHistory = {
        allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
        currentMedications: form.medications ? form.medications.split(',').map(m => m.trim()).filter(m => m) : [],
        previousConditions: form.previousConditions ? form.previousConditions.split(',').map(c => c.trim()).filter(c => c) : [],
        primaryComplaint: form.primaryComplaint || '',
      };
    }
    const combinedInput = { patientInformation, vitals, observations, medicalHistory };
    setIsLoadingContext(true);
    setClinicalSummaryError(null);
    setClinicalSummary(null);
    setAppStateContext(null, analysisReturnPath, currentCaseDisplayData);
    fetch('/api/v2/analyze-and-summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(combinedInput),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to analyze and summarize');
        }
        return response.json();
      })
      .then((result) => {
        // Defensive: check for expected structure
        if (!result || typeof result !== 'object' || !result.analysis) {
          throw new Error('Invalid response from analysis endpoint.');
        }
        setAppStateContext(result.analysis || null, analysisReturnPath, currentCaseDisplayData);
        setClinicalSummary(result.summary || null);
        setIsLoadingContext(false);
      })
      .catch((error) => {
        setClinicalSummaryError(error.message || 'An unexpected error occurred while analyzing and summarizing.');
        setIsLoadingContext(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCaseDisplayData]);

  // Robust fallback: try to restore state from sessionStorage if missing
  useEffect(() => {
    if (!currentCaseDisplayData) {
      setRestoringState(true);
      // Try to restore from sessionStorage
      try {
        const storedCaseDataItem = sessionStorage.getItem('healthTrackAICaseDisplayData');
        if (storedCaseDataItem) {
          setAppStateContext(null, analysisReturnPath, JSON.parse(storedCaseDataItem));
          setRestoringState(false);
          return;
        }
      } catch (e) {
        // ignore
      }
      // If still missing, redirect after a short delay
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);
    }
  }, [currentCaseDisplayData, analysisReturnPath, setAppStateContext, router]);

  const handleBackNavigation = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved AI-enhanced SOAP notes. Are you sure you want to leave? Your changes will be lost.'
      );
      if (!confirmLeave) {
        return;
      }
    }
    
    if (analysisReturnPath) {
      router.push(analysisReturnPath);
    } else {
      setAppStateContext(null, null, null); 
      router.push('/new-case'); 
    }
  };const handleSoapNotesChange = (newNotes: string) => {
    setEditableSoapNotes(newNotes);
    
    // Check if the notes are properly formatted SOAP notes (enhanced by AI)
    if (isValidSoapFormat(newNotes)) {
      // This means AI has enhanced the notes - update parsed view temporarily
      setParsedViewNotes(newNotes);
      setHasUnsavedChanges(newNotes !== lastSavedAISoapNotes);
      
      setShowEnhancementNotification(true);
      setIsNotificationVisible(true);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setIsNotificationVisible(false);
        setTimeout(() => setShowEnhancementNotification(false), 300); // Allow for fade out animation
      }, 5000);
    } else {
      // Regular editing - don't update parsed view, just check for unsaved changes
      setHasUnsavedChanges(newNotes !== lastSavedAISoapNotes && isValidSoapFormat(newNotes));
    }
  };  const handleResetSoapNotes = () => {
    let notesToResetTo = '';
      // Reset to original clinical notes (not AI-enhanced ones)
    if (currentCaseDisplayData) {
      if ('id' in currentCaseDisplayData && 'doctorsObservations' in currentCaseDisplayData) { // Patient
        notesToResetTo = (currentCaseDisplayData as Patient).doctorsObservations || '';
      } else if ('clinicalNotes' in currentCaseDisplayData) { // NewCaseFormValues
        notesToResetTo = (currentCaseDisplayData as NewCaseFormValues).clinicalNotes || '';
      }
    }
    
    setEditableSoapNotes(notesToResetTo);
    
    // Reset parsed view to last saved AI notes or original notes
    if (lastSavedAISoapNotes) {
      setParsedViewNotes(lastSavedAISoapNotes);
    } else if (analysisResult?.soapNotes) {
      setParsedViewNotes(analysisResult.soapNotes);
    } else {
      setParsedViewNotes(notesToResetTo);
    }
    
    setHasUnsavedChanges(false);
  };
  const handleSaveSoapNotes = async (notes: string) => {
    // Validate that the notes are properly formatted SOAP notes
    if (!notes || notes.trim() === '') {
      toast({
        title: 'Cannot Save Empty Notes',
        description: 'Please ensure the SOAP notes contain content before saving.',
        variant: 'destructive',
      });
      return;
    }    // Check if notes are properly formatted with SOAP sections
    if (!isValidSoapFormat(notes)) {
      toast({
        title: 'Invalid SOAP Format',
        description: 'Notes must be properly formatted with S:, O:, A:, and P: sections. Use AI Enhancement to format them correctly.',
        variant: 'destructive',
      });
      return;
    }

    // Check if we have a patient ID to save to
    if (!currentCaseDisplayData || !('id' in currentCaseDisplayData)) {
      toast({
        title: 'Cannot Save Notes',
        description: 'No patient record found to save notes to. This feature is only available for existing patients.',
        variant: 'destructive',
      });
      return;
    }

    const patientId = (currentCaseDisplayData as Patient).id;

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiSoapNotes: notes,
        }),
      });      if (!response.ok) {
        let errorMessage = 'Failed to save SOAP notes';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        // If response body is empty or invalid JSON, it's still a success if status is ok
        result = { message: 'SOAP notes saved successfully' };
      }
      
      // Update the local state with the saved notes
      setParsedViewNotes(notes); // Update parsed view to show saved notes
      setLastSavedAISoapNotes(notes); // Track the latest saved AI notes
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      
      // Update the current case display data to include the saved AI SOAP notes
      if ('id' in currentCaseDisplayData) {
        const updatedPatient = {
          ...currentCaseDisplayData,
          aiSoapNotes: notes
        } as Patient;        // You might want to update the global state here if needed
        setAppStateContext(analysisResult || null, analysisReturnPath, updatedPatient);
      }

      toast({
        title: 'SOAP Notes Saved Successfully',
        description: 'AI-generated SOAP notes have been saved to the patient record.',
      });
    } catch (error) {
      console.error('Error saving SOAP notes:', error);
      toast({
        title: 'Failed to Save Notes',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while saving.',
        variant: 'destructive',
      });
    }
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


  if (restoringState || isLoadingContext || !currentCaseDisplayData || !analysisResult) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <MedicalLoadingAnimation />
          <p className="mt-6 text-lg text-blue-700 font-semibold animate-pulse">Preparing your analysis...</p>
          {!currentCaseDisplayData && (
            <p className="mt-2 text-gray-500 text-sm">Loading patient data... If you are not redirected, please return to the dashboard.</p>
          )}
        </div>
      </MainLayout>
    );
  }

  // Destructure properties from analysisResult for cleaner access in JSX
  // This is safe because we've checked for !analysisResult above.
  const safeAnalysisResult = analysisResult ?? null;
  const {
    summary,
    riskScore = 0,
    icd10Tags,
    differentialDiagnosis,
    soapNotes,
    ...restAnalysis
  } = safeAnalysisResult ? safeAnalysisResult : {};

  // --- SKELETON LOADING UI ---
  const showSkeletons = isLoadingContext || isLoadingClinicalSummary;

  return (
    <MainLayout>
      {/* ExportModal is now rendered at the top level, before any layout containers */}
      <ExportModal 
        isOpen={isExportModalOpen} 
        onOpenChange={setIsExportModalOpen}
        analysisData={safeAnalysisResult} 
        patientData={currentCaseDisplayData}
        soapNotes={editableSoapNotes}
      />
      <TooltipProvider>
        <AnimatePresence mode="wait">
          <motion.div 
            key="analysis-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl"
          >
          {/* Modern Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h1>
                <p className="text-gray-600 text-lg">AI-powered clinical insights and recommendations</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={handleBackNavigation} className="shadow-sm hover:shadow-md transition-all">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => {
                    fetchSimilarCases();
                    setIsSimilarCasesOpen(true);
                  }}
                  className="shadow-sm hover:shadow-md bg-blue-600 hover:bg-blue-700 text-white transition-all"
                >
                  <SearchCheck className="mr-2 h-4 w-4" /> Similar Cases
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsExportModalOpen(true)}
                  className="shadow-sm hover:shadow-md transition-all"
                >
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </motion.div>

          {getPatientHeaderInfo()}
          {/* Modern Grid Layout */}
          <motion.div 
            className="grid grid-cols-1 xl:grid-cols-4 gap-8"
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Main Content Area - Takes up 3 columns */}
            <div className="xl:col-span-3 space-y-8">
              {/* --- SKELETONS FOR MAIN CARDS --- */}
              {showSkeletons ? (
                <>
                  {/* Clinical Insights Skeleton */}
                  <motion.div {...cardAnimationProps(0.1)}>
                    <Card className="shadow-xl border-2 border-blue-500">
                      <CardHeader className="pb-3">
                        <Skeleton className="h-6 w-2/3 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-1" />
                      </CardHeader>
                      <CardContent className="pt-2 space-y-4">
                        <SkeletonText lines={3} />
                        <SkeletonText lines={2} />
                        <SkeletonText lines={2} />
                        <SkeletonText lines={2} />
                      </CardContent>
                    </Card>
                  </motion.div>
                  {/* SOAP Notes Skeleton */}
                  <motion.div {...cardAnimationProps(0.2)}>
                    <Card className="shadow-xl">
                      <CardHeader>
                        <Skeleton className="h-6 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-1/3 mb-1" />
                      </CardHeader>
                      <CardContent>
                        <SkeletonText lines={6} />
                        <div className="mt-4 flex gap-2">
                          <SkeletonButton />
                          <SkeletonButton />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  {/* Charts Skeleton */}
                  <motion.div {...cardAnimationProps(0.3)}>
                    <Card className="shadow-xl">
                      <CardHeader>
                        <Skeleton className="h-6 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-1/3 mb-1" />
                      </CardHeader>
                      <CardContent>
                        <SkeletonTable rows={3} columns={4} />
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              ) : (
                <>
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
                              <h4 className="font-semibold text-md text-blue-700 mb-1 flex items-center">
                                <ClipboardCheck className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                                Overall Assessment:
                              </h4>
                              <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed pl-7">{clinicalSummary.overallAssessment}</p>
                            </div>
                            {clinicalSummary.keyFindings && clinicalSummary.keyFindings.length > 0 && clinicalSummary.keyFindings[0] !== 'No specific key findings identified or data insufficient.' && (
                              <div className="p-3 bg-green-50 rounded-md">
                                <h4 className="font-semibold text-md text-green-700 mb-1 flex items-center">
                                  <ListTree className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                                  Key Findings:
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-green-900 pl-8">
                                  {clinicalSummary.keyFindings.map((finding: string, index: number) => <li key={index}>{finding}</li>)}
                                </ul>
                              </div>
                            )}
                            {clinicalSummary.careSuggestions && clinicalSummary.careSuggestions.length > 0 && clinicalSummary.careSuggestions[0] !== 'No specific care suggestions identified or data insufficient.' && (
                              <div className="p-3 bg-yellow-50 rounded-md">
                                <h4 className="font-semibold text-md text-yellow-700 mb-1 flex items-center">
                                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-600 flex-shrink-0" />
                                  Potential Considerations:
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-900 pl-8">
                                  {clinicalSummary.careSuggestions.map((suggestion: string, index: number) => <li key={index}>{suggestion}</li>)}
                                </ul>
                              </div>
                            )}
                            <div className="p-3 bg-gray-100 rounded-md">
                              <h4 className="font-semibold text-md text-gray-700 mb-1 flex items-center">
                                <FileSearch2 className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
                                Information Sufficiency:
                              </h4>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed pl-7">{clinicalSummary.furtherDataNeeded}</p>
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
                          <br />
                          <span className="text-xs text-amber-600 mt-1 block">
                            ⚠️ Note: The original doctor's observations are preserved above as ground truth. These SOAP notes are AI-generated interpretations.
                          </span>
                        </CardDescription>
                        {hasUnsavedChanges && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-800">
                                Unsaved Changes
                              </span>
                            </div>
                            <p className="text-xs text-amber-700 mt-1">
                              You have AI-enhanced SOAP notes that haven't been saved yet. Use the "Save Final Note" button in the Editor tab to save them permanently.
                            </p>
                          </motion.div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="editor" className="w-full" onValueChange={(value) => {
                          if (value === 'parsed' && showEnhancementNotification) {
                            setIsNotificationVisible(false);
                            setTimeout(() => setShowEnhancementNotification(false), 300);
                          }
                        }}>
                          <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="editor" className="relative">
                              Editor
                              {hasUnsavedChanges && (
                                <motion.div
                                  animate={{ 
                                    scale: [1, 1.1, 1],
                                    opacity: [0.7, 1, 0.7]
                                  }}
                                  transition={{ 
                                    duration: 2, 
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                  className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
                                  title="Unsaved changes"
                                />
                              )}
                            </TabsTrigger>
                            <TabsTrigger value="parsed" className="relative">
                              Parsed View
                              {showEnhancementNotification && (
                                <motion.div
                                  animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5]
                                  }}
                                  transition={{ 
                                    duration: 1.5, 
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                                />
                              )}
                            </TabsTrigger>
                            <TabsTrigger value="charts" className="relative">
                              📊 Charts
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="editor">
                            <SoapNotesEditor
                              currentNotes={editableSoapNotes}
                              onNotesChange={handleSoapNotesChange}
                              onResetNotes={handleResetSoapNotes}
                              patientDataForAI={patientDataForAI ? {
                                patientInformation: `Patient: ${patientDataForAI.patientName}, Age: ${patientDataForAI.age}, Gender: ${patientDataForAI.gender}, Primary Complaint: ${patientDataForAI.primaryComplaint}, Medical History: ${patientDataForAI.medicalHistory ? `Allergies: ${patientDataForAI.medicalHistory.allergies?.join(', ') || 'None'}, Medications: ${patientDataForAI.medicalHistory.currentMedications?.join(', ') || 'None'}, Previous Conditions: ${patientDataForAI.medicalHistory.previousConditions?.join(', ') || 'None'}` : 'No medical history available'}`,
                                vitals: patientDataForAI.vitals,
                                observations: patientDataForAI.observations
                              } : undefined}
                              onSaveNotes={handleSaveSoapNotes}
                              isExistingPatient={currentCaseDisplayData ? 'id' in currentCaseDisplayData : false}
                            />
                          </TabsContent>
                          <TabsContent value="parsed">
                            <ParsedSoapNotesDisplay notes={parsedViewNotes} />
                          </TabsContent>
                          <TabsContent value="charts">
                            <AnalysisCharts 
                              analysisData={safeAnalysisResult || { icd10Tags: [], riskScore: 0, soapNotes: '' }}
                              patientData={currentCaseDisplayData}
                            />
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>            {/* Modern Sidebar - Takes up 1 column */}
            <div className="xl:col-span-1 space-y-6">
              {showSkeletons ? (
                <>
                  {/* Risk Score Card Skeleton */}
                  <motion.div {...cardAnimationProps(0.15)}>
                    <Card className="shadow-lg border-2 sticky top-24 bg-gradient-to-br from-white to-gray-50">
                      <CardHeader className="text-center pb-4">
                        <Skeleton className="h-6 w-1/2 mx-auto mb-2" />
                        <Skeleton className="h-4 w-1/3 mx-auto mb-1" />
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center pt-0">
                        <Skeleton className="h-16 w-16 rounded-full mb-4" />
                        <SkeletonText lines={2} className="w-full" />
                      </CardContent>
                    </Card>
                  </motion.div>
                  {/* Patient Overview Skeleton */}
                  <motion.div {...cardAnimationProps(0.25)}>
                    <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                      <CardHeader>
                        <Skeleton className="h-5 w-1/3 mb-2" />
                      </CardHeader>
                      <CardContent className="text-sm space-y-4">
                        <SkeletonText lines={2} />
                        <SkeletonText lines={3} />
                        <SkeletonText lines={2} />
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Risk Score Card - Enhanced Design */}
                  <motion.div {...cardAnimationProps(0.15)}>
                    <Card className={cn("shadow-lg border-2 sticky top-24 bg-gradient-to-br from-white to-gray-50", getRiskScoreBorderColor(riskScore || 0))}>
                      <CardHeader className="text-center pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-center">
                          <HeartPulse className="mr-2 h-5 w-5 text-red-500" />
                          Risk Assessment
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          AI-calculated risk score
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center pt-0">
                        <RiskGauge score={riskScore || 0} /> 
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-help transition-all hover:bg-blue-100">
                              <p className="text-xs text-blue-800 text-center flex items-center justify-center">
                                <InfoIcon className="h-3 w-3 mr-1" /> {riskScoreExplanation}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="fixed left-1/2 top-1/2 z-50 grid max-w-lg w-[90vw] translate-x-[-50%] translate-y-[-50%] gap-6 border bg-background p-8 shadow-2xl rounded-xl">
                            <p className="font-medium">{riskScoreExplanation}</p>
                            <p className="mt-2 text-xs text-gray-600">This score is an estimate based on AI analysis and should be interpreted by a medical professional.</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardContent>
                    </Card>
                  </motion.div>
                  {/* Patient Quick Info Card - Enhanced */}
                  <motion.div {...cardAnimationProps(0.25)}>
                    <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-green-800 flex items-center">
                          <User className="mr-2 h-5 w-5" /> Patient Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-4">
                        {patientDataForAI ? (
                          <>
                            <div>
                              <strong className="block text-primary mb-0.5">Vitals:</strong> 
                              <span className="text-foreground">{patientDataForAI.vitals}</span>
                            </div>
                            <div className="space-y-1">
                              <strong className="block text-primary mb-0.5">Key Info from Form/Chart:</strong>
                              <ul className="list-none ml-0 space-y-0.5">
                                {patientDataForAI && patientDataForAI.patientInformation &&
                                  patientDataForAI.patientInformation
                                    .replace(/Name: [^,]+, /, '')
                                    .split(/, (?=(?:Age|Gender|Conditions|Allergies|Medications|Primary Complaint|Previous Conditions):)/)
                                    .map((part: string, index: number) => {
                                      const [key, ...valueParts] = part.split(':');
                                      const value = valueParts.join(':').trim();
                                      if (!value || value.toLowerCase() === 'none' || value.toLowerCase() === 'n/a') return null;
                                      return (
                                        <li key={index} className="text-foreground text-xs flex">
                                          <span className="font-semibold w-28 flex-shrink-0">{key.trim()}:</span>
                                          <span>{value}</span>
                                        </li>
                                      );
                                    })
                                    .filter(Boolean)
                                }
                              </ul>
                            </div>
                            <div>
                              <strong className="block text-primary mb-0.5">Doctor's Original Observations (Ground Truth):</strong> 
                              <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">{patientDataForAI.observations}</p>
                                <p className="text-xs text-blue-600 mt-2 italic">
                                  ℹ️ These are the original clinical observations recorded by the doctor and serve as the ground truth for this case.
                                </p>
                              </div>
                            </div>
                            {currentCaseDisplayData && 'aiSoapNotes' in currentCaseDisplayData && (currentCaseDisplayData as Patient).aiSoapNotes && (
                              <div>
                                <strong className="block text-primary mb-0.5">Saved AI SOAP Notes:</strong> 
                                <div className="mt-2 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-md">
                                  <p className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">
                                    {(currentCaseDisplayData as Patient).aiSoapNotes}
                                  </p>
                                  <p className="text-xs text-green-600 mt-2 italic">
                                    ✅ These are AI-generated SOAP notes that have been saved to the patient record.
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">Patient details not fully loaded.</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
        </AnimatePresence>
      </TooltipProvider>

      <SimilarCasesPanel 
        isOpen={isSimilarCasesOpen} 
        onOpenChange={setIsSimilarCasesOpen} 
        cases={similarCases}
        isLoading={isLoadingSimilarCases}
        error={similarCasesError} />
    </MainLayout>
  );
}

'use client';

import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SimilarCaseOutput } from '@healthtrack/shared';
import { Patient } from '@/types';

export default function AnalysisPage() {
  const { analysisResult, analysisReturnPath, currentCaseDisplayData, setAnalysisResult: setAppStateContext } = useAppState();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [restoringState, setRestoringState] = useState(false);
  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [similarCases, setSimilarCases] = useState<SimilarCaseOutput[]>([]);
  const [isLoadingSimilarCases, setIsLoadingSimilarCases] = useState(false);
  const [similarCasesError, setSimilarCasesError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const caseDataForAI = useMemo(() => {
    if (!currentCaseDisplayData) return null;
    const data = currentCaseDisplayData as Patient;
    return {
      age: data.age || 0,
      gender: data.gender || 'Other',
      primaryComplaint: data.primaryComplaint || '',
      patientName: data.name || 'Unknown',
      visitDate: new Date(data.lastVisit),
    };
  }, [currentCaseDisplayData]);

  useEffect(() => {
    if (isSimilarCasesOpen && !similarCases.length && !isLoadingSimilarCases) {
      const fetchSimilarCases = async () => {
        setIsLoadingSimilarCases(true);
        setSimilarCasesError(null);
        try {
          if (!currentCaseDisplayData) {
            throw new Error("Patient data is not available to find similar cases.");
          }
          console.log("🔍 [ANALYSIS] Fetching similar cases from backend API:", currentCaseDisplayData);

          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
          const caseData = currentCaseDisplayData as any;
          const response = await fetch(`${backendUrl}/cases/similar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clinicalNote: caseData?.observations || '',
              patientInformation: caseData?.patientInformation || '',
              vitals: caseData?.vitals,
              diagnoses: caseData?.icd_tags,
              limit: 5,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch similar cases from backend');
          }

          const data: SimilarCaseOutput[] = await response.json();
          setSimilarCases(data);
          console.log(`✅ [ANALYSIS] Found ${data.length} similar cases`);
        } catch (error: unknown) {
          console.error("❌ [ANALYSIS] Failed to fetch similar cases:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          setSimilarCasesError(errorMessage);
          toast({
              title: "Error",
              description: "Could not fetch similar cases. " + errorMessage,
              variant: "destructive",
          });
        } finally {
          setIsLoadingSimilarCases(false);
        }
      };
      fetchSimilarCases();
    }
  }, [isSimilarCasesOpen, similarCases.length, isLoadingSimilarCases, currentCaseDisplayData, toast]);

  // ... rest of the component ...
}
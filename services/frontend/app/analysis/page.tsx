'use client';

import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SimilarCaseOutput } from '@healthtrack/shared';
import { getDb } from '@/lib/db';
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
          console.log("Fetching similar cases with data via IPC:", currentCaseDisplayData);
          
          const db = getDb();
          const data: SimilarCaseOutput[] = await db.findSimilarCases({ 
              patientData: currentCaseDisplayData as unknown as Patient, 
              filters: {} // No filters for now
          });

          setSimilarCases(data);
        } catch (error: unknown) {
          console.error("Failed to fetch similar cases via IPC:", error);
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
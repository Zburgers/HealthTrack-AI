import { useState, useEffect, useCallback } from 'react';
import { apiCache } from '@/lib/api-cache';
import type { Patient } from '@/types';

interface PatientsData {
  activePatients: Patient[];
  archivedPatients: Patient[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

let globalPatientsData: PatientsData | null = null;
let globalSubscribers: Set<(data: PatientsData) => void> = new Set();

export function usePatients(): PatientsData {
  const [localData, setLocalData] = useState<PatientsData>(
    globalPatientsData || {
      activePatients: [],
      archivedPatients: [],
      isLoading: true,
      error: null,
      refetch: async () => {},
    }
  );

  const updateGlobalData = useCallback((newData: Partial<PatientsData>) => {
    globalPatientsData = { ...globalPatientsData!, ...newData };
    globalSubscribers.forEach(subscriber => subscriber(globalPatientsData!));
  }, []);

  const fetchPatients = useCallback(async () => {
    updateGlobalData({ isLoading: true, error: null });
    
    try {
      // Use cached requests to prevent duplicates
      const [activeData, archivedData] = await Promise.all([
        apiCache.fetchWithCache<Patient[]>('/api/patients'),
        apiCache.fetchWithCache<Patient[]>('/api/patients?archivedOnly=true')
      ]);

      updateGlobalData({
        activePatients: activeData,
        archivedPatients: archivedData,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
      updateGlobalData({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  }, [updateGlobalData]);

  // Subscribe to global updates
  useEffect(() => {
    const subscriber = (data: PatientsData) => setLocalData(data);
    globalSubscribers.add(subscriber);
    
    // Initial fetch if no data exists
    if (!globalPatientsData) {
      fetchPatients();
    }
    
    return () => {
      globalSubscribers.delete(subscriber);
    };
  }, [fetchPatients]);

  // Update refetch function
  useEffect(() => {
    if (globalPatientsData) {
      globalPatientsData.refetch = fetchPatients;
    }
  }, [fetchPatients]);

  return localData;
}

// Hook for individual patient with optimized polling
export function usePatient(patientId: string | undefined) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchPatient = useCallback(async () => {
    if (!patientId) return null;

    try {
      setError(null);
      const data = await apiCache.fetchWithCache<Patient>(
        `/api/patients/${patientId}`,
        undefined,
        2000 // Shorter cache for individual patients
      );
      
      setPatient(data);
      setIsAnalyzing(data.status === 'analyzing');
      return data;
    } catch (error) {
      setError((error as Error).message);
      setIsAnalyzing(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  // Optimized polling - only when analyzing
  useEffect(() => {
    if (!isAnalyzing || !patientId) return;

    const pollInterval = setInterval(async () => {
      try {
        // Clear cache for this specific patient to get fresh data
        const data = await fetch(`/api/patients/${patientId}`).then(res => res.json());
        setPatient(data);
        
        if (data.status !== 'analyzing') {
          setIsAnalyzing(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        setIsAnalyzing(false);
      }
    }, 8000); // Increased to 8 seconds to reduce load

    return () => clearInterval(pollInterval);
  }, [isAnalyzing, patientId]);

  return {
    patient,
    isLoading,
    error,
    isAnalyzing,
    refetch: fetchPatient,
  };
}

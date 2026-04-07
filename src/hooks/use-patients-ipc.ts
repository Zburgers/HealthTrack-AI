import { useState, useEffect, useCallback } from 'react';
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

/**
 * Hook to manage patients data through Electron IPC
 * This hook is designed for the Electron app and uses IPC calls
 * instead of direct API calls to fetch patient data
 */
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
    // Only proceed if we're in an Electron environment
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
    if (!isElectron) {
      updateGlobalData({
        error: 'Not running in Electron environment',
        isLoading: false,
      });
      return;
    }

    updateGlobalData({ isLoading: true, error: null });
    
    try {
      // Get active patients via IPC
      const activeData = await (window as any).electronAPI.database.getPatients();
      
      // Get archived patients via IPC
      const archivedData = await (window as any).electronAPI.database.getPatients({ isDeleted: true });

      updateGlobalData({
        activePatients: activeData,
        archivedPatients: archivedData,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching patients via IPC:', error);
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

    // Only proceed if we're in an Electron environment
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
    if (!isElectron) {
      setError('Not running in Electron environment');
      setIsLoading(false);
      return null;
    }

    try {
      setError(null);
      // Use IPC to get patient data
      const data = await (window as any).electronAPI.database.getPatient(patientId);
      
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
        // Use IPC for polling
        const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
        if (isElectron) {
          const data = await (window as any).electronAPI.database.getPatient(patientId);
          setPatient(data);
          
          if (data.status !== 'analyzing') {
            setIsAnalyzing(false);
          }
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
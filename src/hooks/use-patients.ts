'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiConfig } from '@/config';
import type { Patient } from '@/types';

const BACKEND_URL = apiConfig.backendUrl;

async function fetchWithAuth(url: string, getToken: () => Promise<string | null>) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json();
}

// Hook for patient list
export function usePatientList() {
  const { getToken, isSignedIn } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    if (!isSignedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth(
        `${BACKEND_URL}/patients`,
        getToken,
      );
      setPatients(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return { patients, isLoading, error, refetch: fetchPatients };
}

// Hook for individual patient
export function usePatient(patientId: string | undefined) {
  const { getToken, isSignedIn } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchPatient = useCallback(async () => {
    if (!patientId || !isSignedIn) return;

    try {
      setError(null);
      const data = await fetchWithAuth(
        `${BACKEND_URL}/patients/${patientId}`,
        getToken,
      );
      setPatient(data);
      setIsAnalyzing(data.status === 'analyzing');
    } catch (err) {
      setError((err as Error).message);
      setIsAnalyzing(false);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, isSignedIn, getToken]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  // Polling when analyzing
  useEffect(() => {
    if (!isAnalyzing || !patientId) return;

    const pollInterval = setInterval(fetchPatient, 8000);
    return () => clearInterval(pollInterval);
  }, [isAnalyzing, patientId, fetchPatient]);

  return { patient, isLoading, error, isAnalyzing, refetch: fetchPatient };
}

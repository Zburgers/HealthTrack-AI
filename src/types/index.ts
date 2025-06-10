import type { AnalyzePatientSymptomsOutput } from "@/ai/flows/analyze-patient-symptoms";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  // Add other relevant patient fields
}

export interface Case {
  id: string;
  patientId: string;
  patientInfo: string; // Summary or link to full Patient object
  vitals: string;
  observations: string;
  analysisResult?: AnalyzePatientSymptomsOutput;
  createdAt: Date;
}

// You can expand this file with more types as your application grows.
// For example, types for user profiles, settings, etc.

// For the global state context
export interface AppState {
  analysisResult: AnalyzePatientSymptomsOutput | null;
  setAnalysisResult: (result: AnalyzePatientSymptomsOutput | null) => void;
  // Potentially add other global states like loading indicators for AI calls, etc.
  // isLoadingAnalysis: boolean;
  // setIsLoadingAnalysis: (loading: boolean) => void;
}

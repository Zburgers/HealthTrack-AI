
import type { AnalyzePatientSymptomsOutput } from "@/ai/flows/analyze-patient-symptoms";
import type { LucideIcon } from "lucide-react";

export interface Patient {
  id: string;
  name: string;
  avatarUrl: string;
  dataAiHint: string; 
  riskScore: number; // 0-1 (e.g. 0.75 for 75%) or 0-100 (e.g. 75 for 75%)
  conditions: string[]; 
  lastVisit: string;

  age: number;
  gender: 'Male' | 'Female' | 'Other' | string;
  primaryComplaint: string;
  vitals: {
    bp?: string;
    hr?: string;
    rr?: string;
    temp?: string;
    spo2?: string;
    [key: string]: string | undefined; 
  };
  doctorsObservations: string;
  aiAnalysis: AnalyzePatientSymptomsOutput;
}

export interface AppState {
  analysisResult: AnalyzePatientSymptomsOutput | null;
  analysisReturnPath: string | null; // Path to return to after viewing analysis (e.g. patient detail page)
  setAnalysisResult: (
    result: AnalyzePatientSymptomsOutput | null,
    returnPath?: string | null // Explicitly pass null if it's a new case with no prior page
  ) => void;
}

export interface VitalDisplayInfo {
  key: keyof Patient['vitals'];
  label: string;
  icon: LucideIcon;
}

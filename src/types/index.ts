
import type { AnalyzePatientSymptomsOutput } from "@/ai/flows/analyze-patient-symptoms";
import type { LucideIcon } from "lucide-react";

export interface Patient {
  id: string;
  name: string;
  avatarUrl: string;
  dataAiHint: string; // For dashboard card image
  riskScore: number; // 0-1, used on dashboard and detail
  conditions: string[]; // Key conditions for dashboard and detail
  lastVisit: string;

  // Detailed information
  age: number;
  gender: 'Male' | 'Female' | 'Other' | string;
  primaryComplaint: string;
  vitals: {
    bp?: string;
    hr?: string;
    rr?: string;
    temp?: string;
    spo2?: string;
    [key: string]: string | undefined; // Allow other vitals
  };
  doctorsObservations: string;
  aiAnalysis: AnalyzePatientSymptomsOutput;
}

export interface AppState {
  analysisResult: AnalyzePatientSymptomsOutput | null;
  setAnalysisResult: (result: AnalyzePatientSymptomsOutput | null) => void;
}

// Used for displaying vitals with icons
export interface VitalDisplayInfo {
  key: keyof Patient['vitals'];
  label: string;
  icon: LucideIcon;
}

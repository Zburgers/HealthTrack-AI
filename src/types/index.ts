
import type { AnalyzePatientSymptomsOutput } from "@/ai/flows/analyze-patient-symptoms";
import type { LucideProps } from "lucide-react"; // Changed from LucideIcon for better flexibility
import React from "react"; // Import React for React.ElementType

// Define a map for alert icons to ensure type safety and allow string keys from data
// This map will be defined where it's used, e.g., in the dashboard component,
// or you can pre-define it here if all icons are known upfront.
// For now, we'll just use a string for iconName and map it in the component.
export interface PatientAlert {
  iconName: string; // e.g., 'ShieldAlert', 'CalendarClock', 'Bed'
  label: string;
  colorClass: string; // e.g., 'text-red-500', 'text-blue-500'
  tooltip: string;
}

export interface Patient {
  id: string;
  name: string;
  avatarUrl: string;
  dataAiHint: string;
  riskScore: number; // 0-1 (e.g. 0.75 for 75%) or 0-100 (e.g. 75 for 75%)
  conditions: string[];
  lastVisit: string; // Should be in YYYY-MM-DD format for easier sorting

  age: number; // Ensure this is a number
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
  alert?: PatientAlert; // Optional alert field
}

export interface AppState {
  analysisResult: AnalyzePatientSymptomsOutput | null;
  analysisReturnPath: string | null;
  setAnalysisResult: (
    result: AnalyzePatientSymptomsOutput | null,
    returnPath?: string | null
  ) => void;
}

export interface VitalDisplayInfo {
  key: keyof Patient['vitals'];
  label: string;
  icon: React.ElementType<LucideProps>; // Use React.ElementType for Lucide icons
}


import type { LucideProps } from "lucide-react";
import React from "react";
import type { NewCaseFormValues } from "@/components/new-case/NewCaseForm";

// This is the new structure for ICD-10 tags, including a description.
export interface ICD10Code {
  code: string;
  description: string;
}

// Updated AI Analysis Output structure
export interface AIAnalysisOutput {
  icd10Tags: ICD10Code[];
  riskScore: number;
  soapNotes: string;
}

export interface PatientAlert {
  iconName: string;
  label: string;
  colorClass: string;
  tooltip: string;
}

export interface Patient {
  id: string;
  name: string;
  avatarUrl: string;
  dataAiHint: string;
  riskScore: number;
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
  aiAnalysis: AIAnalysisOutput; // Use the updated analysis output type
  alert?: PatientAlert;
}

export interface AppState {
  analysisResult: AIAnalysisOutput | null | undefined;
  analysisReturnPath: string | null | undefined;
  currentCaseDisplayData: Patient | NewCaseFormValues | null | undefined;
  setAnalysisResult: (
    resultData: AIAnalysisOutput | null,
    returnPath?: string | null,
    caseDisplayData?: Patient | NewCaseFormValues | null
  ) => void;
}

export interface VitalDisplayInfo {
  key: keyof Patient['vitals'];
  label: string;
  icon: React.ElementType<LucideProps>;
}

// Export NewCaseFormValues to be used in other parts of the application
export type { NewCaseFormValues };

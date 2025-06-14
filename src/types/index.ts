import type { LucideProps } from "lucide-react";
import React from "react";
import type { NewCaseFormValues } from "@/components/new-case/NewCaseForm";
import { ObjectId } from "mongodb";

// Represents the data structure in the MongoDB 'patients' collection
export interface PatientDocument {
  _id: ObjectId;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other' | string;
  createdAt: Date;
  last_updated: Date;
  vitals: {
    temp?: number | null;
    bp?: string;
    hr?: number | null;
    spo2?: number | null;
    rr?: number | null;
  };
  symptoms: string[];
  observations: string;
  icd_tags: { code: string; label: string; confidence: number; source_phrase: string }[];
  icd_tag_summary: string[];
  risk_predictions: { condition: string; confidence: number; explanation: string[] }[];
  risk_score: number;  soap_note: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  ai_soap_notes?: string; // Separate field for AI-generated SOAP notes
  matched_cases: { case_id: string; similarity_score: number; diagnosis: string; summary: string }[];
  ai_metadata: any;
  status: 'draft' | 'analyzing' | 'complete' | 'exported' | 'analysis_failed';
  owner_uid: string;
}


// This is the new structure for ICD-10 tags, including a description.
export interface ICD10Code {
  code: string;
  description: string;
}

// Structure for Differential Diagnosis items
export interface DifferentialDiagnosisItem {
  condition: string;
  likelihood: string; // Or number, depending on expected data
}

// Updated AI Analysis Output structure
export interface AIAnalysisOutput {
  summary?: string; // Added
  icd10Tags: ICD10Code[];
  differentialDiagnosis?: DifferentialDiagnosisItem[]; // Added
  recommendedTests?: string[]; // Added
  treatmentSuggestions?: string[]; // Added
  riskScore: number;
  soapNotes: string;
}

export interface PatientAlert {
  iconName: string;
  label: string;
  colorClass: string;
  tooltip: string;
}

// This is the type used by the frontend components
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
  primaryComplaint: string;  vitals: {
    bp?: string;
    hr?: string;
    rr?: string;
    temp?: string;
    spo2?: string;
    [key: string]: string | undefined;
  };
  doctorsObservations: string;
  aiSoapNotes?: string; // AI-generated SOAP notes stored separately from original notes
  status?: 'draft' | 'analyzing' | 'complete' | 'exported' | 'analysis_failed';
  aiAnalysis?: AIAnalysisOutput;
  alert?: PatientAlert;
  allergies?: string[]; 
  medications?: string[]; 
  notes?: string; // Original doctor's notes (preserved)
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

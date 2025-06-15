import type { LucideProps } from "lucide-react";
import React from "react";
import type { NewCaseFormValues } from "@/components/new-case/NewCaseForm";
import { ObjectId } from "mongodb";
import type { SimilarCaseOutput } from "./similar-cases";

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
  // Medical History Fields
  primary_complaint?: string;
  previous_conditions?: string[];
  allergies?: string[];
  current_medications?: string[];
  icd_tags: { code: string; label: string; confidence: number; source_phrase: string }[];
  icd_tag_summary: string[];
  risk_predictions: { condition: string; confidence: number; explanation: string[] }[];
  risk_score: number;
  soap_note: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  matched_cases: { case_id: string; similarity_score: number; diagnosis: string; summary: string }[];
  // Enhanced Medical History Analysis
  medical_history_analysis?: {
    allergy_warnings?: string[];
    medication_interactions?: string[];
    previous_conditions_impact?: string[];
  };
  ai_metadata: any;
  status: 'draft' | 'analyzing' | 'complete' | 'exported' | 'analysis_failed';
  owner_uid: string;
  ai_soap_notes?: string; // Add AI SOAP notes field
  ai_analysis_timestamp?: Date; // Track when AI analysis was performed
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
  similarCases?: SimilarCaseOutput[]; // Added similar cases
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
  status?: 'draft' | 'analyzing' | 'complete' | 'exported' | 'analysis_failed';
  aiAnalysis?: AIAnalysisOutput;
  alert?: PatientAlert;
  // Medical History Fields (consistent with form and database)
  previousConditions?: string[];
  allergies?: string[]; 
  medications?: string[]; 
  notes?: string; 
  aiSoapNotes?: string; // Add AI SOAP notes field to Patient type
  // Enhanced Medical History Analysis for UI display
  medicalHistoryAnalysis?: {
    allergyWarnings?: string[];
    medicationInteractions?: string[];
    previousConditionsImpact?: string[];
  };
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

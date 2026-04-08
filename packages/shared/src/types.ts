/**
 * Shared TypeScript types used across frontend and backend.
 * These replace the duplicated type definitions in src/types/ and backend/src/.
 */

export interface CaseVitals {
  bp: string | null;
  hr: number | null;
  rr: number | null;
  spo2: number | null;
  temp: number | null;
}

export interface CaseEmbeddingDocument {
  id: string;
  subject_id: number;
  hadm_id: number;
  age: number;
  sex: string;
  icd: string[];
  icd_label: string[];
  note: string;
  vitals?: CaseVitals;
  outcomes?: {
    result?: string;
    followUp?: string;
    dischargeStatus?: string;
    lengthOfStay?: number;
    complications?: string[];
  };
  treatments?: {
    medications?: string[];
    procedures?: string[];
    interventions?: string[];
    timeline?: Array<{ date: string; action: string }>;
  };
  diagnostics?: {
    tests?: string[];
    results?: string[];
    imaging?: string[];
    labs?: string[];
  };
  metadata?: {
    complexityScore?: number;
    outcomeClass?: string;
    admissionType?: string;
    caseDate?: Date;
  };
}

export interface SimilarCaseOutput extends Omit<CaseEmbeddingDocument, 'id'> {
  matchConfidence: number;
}

export interface SimilarCaseSearchInput {
  patientInformation?: string;
  vitals?: Record<string, unknown>;
  observations?: string;
  diagnoses?: string[];
  clinicalNote?: string;
  limit?: number;
  minConfidence?: number;
}

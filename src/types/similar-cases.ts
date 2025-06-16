export interface CaseVitals {
  bp: string | null;
  hr: number | null;
  rr: number | null;
  spo2: number | null;
  temp: number | null;
}

// Defines the structure of a document in the case_embedding collection
// Based on the provided $jsonSchema
export interface CaseEmbeddingDocument {
  _id: any; // MongoDB ObjectId, typically handled as string or ObjectId type depending on driver/usage
  age: number;
  embedding: number[]; // Array of numbers (doubles from schema)
  hadm_id: number;
  icd: string[];
  icd_label: string[];
  note: string;
  sex: string;
  subject_id: number;
  vitals?: CaseVitals; // Vitals are optional as per schema structure (not in top-level required)
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

// Input for the /api/similar-cases endpoint (current case data for querying)
export interface SimilarCasesApiInput {
  note: string;
  age?: number;
  sex?: string;
  vitals?: Partial<CaseVitals>; // Current case might have partial or no vitals for the query
  // Add any other fields from the current case that might be used to generate the query embedding
}

// Expected structure from Vertex AI embedding endpoint prediction
interface VertexAIEmbeddingPrediction {
  embeddings: {
    values: number[];
    // Depending on the model, there might be other fields like statistics
  };
}

// Expected structure from Vertex AI embedding endpoint full response
export interface VertexAIEmbeddingResponse {
  predictions: VertexAIEmbeddingPrediction[];
  // Potentially other fields like deployedModelId
}

// Structure of a similar case returned by the API to the frontend
// Excludes the raw embedding and includes a match confidence score
export interface SimilarCaseOutput extends Omit<CaseEmbeddingDocument, 'embedding' | '_id'> {
  id: string; // Use string representation of _id for frontend
  matchConfidence: number; // Score from vector search
  // Include fields that are useful for the SimilarCasesPanel.tsx
  // For example, if patientName is derived or stored differently:
  // patientName?: string; 
  // diagnosisOutcome?: string; // This would typically be derived from icd_label or other fields
  // treatmentSummary?: string; // This would likely come from the 'note' or a summarized version
}

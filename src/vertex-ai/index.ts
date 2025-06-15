/**
 * Vertex AI Medical Workflows - Main Export
 * 
 * This module provides enterprise-grade medical AI workflows using Google Vertex AI.
 * Optimized for production use with better error handling, monitoring, and cost efficiency.
 */

// Client exports
export { vertexAIClient, VertexAIClient } from './client/vertex-client';
export type { VertexAIConfig, VertexAIRequest, VertexAIResponse } from './client/vertex-client';

// Prompt template exports
export { 
  PROMPT_TEMPLATES, 
  PromptTemplateEngine,
  ANALYZE_PATIENT_SYMPTOMS_PROMPT,
  ENHANCE_SOAP_NOTES_PROMPT,
  SUMMARIZE_PATIENT_CONDITION_PROMPT
} from './prompts/medical-prompts';
export type { MedicalPromptTemplate } from './prompts/medical-prompts';

// Workflow exports
export { 
  medicalWorkflows,
  MedicalWorkflowService,
  analyzePatientSymptoms,
  enhanceSoapNotes,
  summarizePatientCondition
} from './workflows/medical-workflows';

// Schema and type exports
export {
  AnalyzePatientSymptomsInputSchema,
  AnalyzePatientSymptomsOutputSchema,
  EnhanceSoapNotesInputSchema,
  EnhanceSoapNotesOutputSchema,
  SummarizePatientConditionInputSchema,
  SummarizePatientConditionOutputSchema
} from './workflows/medical-workflows';

export type {
  AnalyzePatientSymptomsInput,
  AnalyzePatientSymptomsOutput,
  EnhanceSoapNotesInput,
  EnhanceSoapNotesOutput,
  SummarizePatientConditionInput,
  SummarizePatientConditionOutput
} from './workflows/medical-workflows';

/**
 * Quick start usage:
 * 
 * ```typescript
 * import { analyzePatientSymptoms } from '@/vertex-ai';
 * 
 * const result = await analyzePatientSymptoms({
 *   patientName: 'John Doe',
 *   age: 45,
 *   gender: 'Male',
 *   visitDate: '2025-06-15',
 *   primaryComplaint: 'Chest pain',
 *   vitals: 'BP 140/90, HR 85',
 *   observations: 'Patient reports intermittent chest pain...',
 *   medicalHistory: {
 *     allergies: ['penicillin'],
 *     currentMedications: ['lisinopril 10mg'],
 *     previousConditions: ['hypertension']
 *   }
 * });
 * ```
 */

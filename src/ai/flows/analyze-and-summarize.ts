import { analyzePatientSymptoms, AnalyzePatientSymptomsInput, analyzePatientSymptomsEnhanced } from './analyze-patient-symptoms';
import { summarizePatientCondition, SummarizePatientConditionInput, summarizePatientConditionEnhanced } from './summarize-patient-condition';
import { enhanceSoapNotesFlow, enhanceSoapNotesEnhanced } from './enhance-notes';
import { z } from 'zod';

// Combined input schema: superset of all fields
export const AnalyzeAndSummarizeInputSchema = z.object({
  patientInformation: z.string(),
  vitals: z.string(),
  observations: z.string(),
  medicalHistory: z.any().optional(),
  currentNotes: z.string().optional(),
  enhanceSoapNotes: z.boolean().optional(),
});
export type AnalyzeAndSummarizeInput = z.infer<typeof AnalyzeAndSummarizeInputSchema>;

// Combined output schema
export const AnalyzeAndSummarizeOutputSchema = z.object({
  analysis: z.any(),
  summary: z.any(),
  enhancedSoapNotes: z.string().optional(),
});
export type AnalyzeAndSummarizeOutput = z.infer<typeof AnalyzeAndSummarizeOutputSchema>;

/**
 * Combined AI workflow: runs analysis, summary, and optionally SOAP enhancement.
 * @param input - Combined input
 * @returns Combined output
 */
export async function analyzeAndSummarizePatient(input: AnalyzeAndSummarizeInput): Promise<AnalyzeAndSummarizeOutput> {
  // Run analysis
  const analysis = input.medicalHistory
    ? await analyzePatientSymptomsEnhanced({
        patientInformation: input.patientInformation,
        vitals: input.vitals,
        observations: input.observations,
        medicalHistory: input.medicalHistory,
      })
    : await analyzePatientSymptoms({
        patientInformation: input.patientInformation,
        vitals: input.vitals,
        observations: input.observations,
      });
  // Run summary
  const summary = input.medicalHistory
    ? await summarizePatientConditionEnhanced({
        patientInformation: input.patientInformation,
        vitals: input.vitals,
        observations: input.observations,
        medicalHistory: input.medicalHistory,
      })
    : await summarizePatientCondition({
        patientInformation: input.patientInformation,
        vitals: input.vitals,
        observations: input.observations,
      });
  // Optionally run SOAP enhancement
  let enhancedSoapNotes: string | undefined = undefined;
  if (input.enhanceSoapNotes && input.currentNotes) {
    const enhanced = input.medicalHistory
      ? await enhanceSoapNotesEnhanced({
          patientInformation: input.patientInformation,
          vitals: input.vitals,
          observations: input.observations,
          currentNotes: input.currentNotes,
          medicalHistory: input.medicalHistory,
        })
      : await enhanceSoapNotesFlow({
          patientInformation: input.patientInformation,
          vitals: input.vitals,
          observations: input.observations,
          currentNotes: input.currentNotes,
        });
    enhancedSoapNotes = enhanced.enhancedSoapNotes;
  }
  return { analysis, summary, ...(enhancedSoapNotes ? { enhancedSoapNotes } : {}) };
} 
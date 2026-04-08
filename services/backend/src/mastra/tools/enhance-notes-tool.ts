import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Mastra tool for enhancing clinical SOAP notes.
 * The actual enhancement is done by the Mastra agent's LLM instructions.
 * This tool provides the structured input/output interface.
 * Migrated from Genkit enhanceSoapNotes flow.
 */
export const enhanceNotesTool = createTool({
  id: 'enhance-notes',
  description: 'Enhance clinical SOAP notes with additional clinical detail and formatting',
  inputSchema: z.object({
    patientInformation: z.string().optional().describe('Comprehensive details about the patient, including medical history'),
    vitals: z.string().optional().describe('Patient vitals such as heart rate, blood pressure, etc.'),
    observations: z.string().optional().describe('Doctor\'s observations regarding the patient\'s condition'),
    currentNotes: z.string().optional().describe('Current clinical notes to enhance'),
    medicalHistory: z
      .object({
        allergies: z.array(z.string()).optional(),
        currentMedications: z.array(z.string()).optional(),
        previousConditions: z.array(z.string()).optional(),
        primaryComplaint: z.string().optional(),
      })
      .optional()
      .describe('Structured medical history data'),
    enhancementType: z
      .enum(['full', 'minimal', 'billing-focused'])
      .default('full')
      .describe('Level of enhancement'),
  }),
  outputSchema: z.object({
    enhancedNotes: z.string().describe('Enhanced SOAP notes with improved structure'),
    suggestedIcdCodes: z.array(z.string()).optional().describe('Suggested ICD-10 codes'),
    qualityNotes: z.array(z.string()).optional().describe('Suggestions for improving documentation'),
    medicalHistoryIntegration: z
      .object({
        allergyConsiderations: z.array(z.string()).optional(),
        medicationReferences: z.array(z.string()).optional(),
        previousConditionRelevance: z.array(z.string()).optional(),
      })
      .optional(),
  }),
  execute: async ({ context }) => {
    // The actual enhancement is handled by the Mastra agent's LLM instructions.
    // This tool returns the input as a structured response for the agent to process.
    // The agent will call this tool and use the returned data to generate enhanced notes.

    const qualityNotes: string[] = [];

    // Validate SOAP note structure
    if (context.currentNotes) {
      if (!context.currentNotes.includes('S:')) {
        qualityNotes.push('Missing Subjective (S:) section');
      }
      if (!context.currentNotes.includes('O:')) {
        qualityNotes.push('Missing Objective (O:) section');
      }
      if (!context.currentNotes.includes('A:')) {
        qualityNotes.push('Missing Assessment (A:) section');
      }
      if (!context.currentNotes.includes('P:')) {
        qualityNotes.push('Missing Plan (P:) section');
      }
    }

    // Check for medical history integration opportunities
    if (context.medicalHistory?.allergies && context.medicalHistory.allergies.length > 0) {
      qualityNotes.push(`Consider documenting allergy precautions for: ${context.medicalHistory.allergies.join(', ')}`);
    }

    if (context.medicalHistory?.currentMedications && context.medicalHistory.currentMedications.length > 5) {
      qualityNotes.push('Patient on polypharmacy (>5 medications) - consider medication reconciliation');
    }

    return {
      enhancedNotes: context.currentNotes || '',
      suggestedIcdCodes: [],
      qualityNotes,
      medicalHistoryIntegration: {
        allergyConsiderations: context.medicalHistory?.allergies || [],
        medicationReferences: context.medicalHistory?.currentMedications || [],
        previousConditionRelevance: context.medicalHistory?.previousConditions || [],
      },
    };
  },
});

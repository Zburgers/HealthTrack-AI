'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PatientConditionSummaryOutputSchema, PatientConditionSummaryOutput } from '@/types/ai-outputs';

// Input schema for the summarizePatientCondition flow
// Reusing/adapting AnalyzePatientSymptomsInput for consistency
const SummarizePatientConditionInputSchema = z.object({
  patientInformation: z
    .string()
    .describe('Comprehensive details about the patient, including medical history, age, gender, primary complaint, known conditions, medications, allergies.'),
  vitals: z.string().describe('Patient vitals such as BP, HR, Temp, RR, SpO2.'),
  observations: z
    .string()
    .describe('Clinician’s free-text notes or initial observations regarding the patient’s condition.'),
});

export type SummarizePatientConditionInput = z.infer<typeof SummarizePatientConditionInputSchema>;

// Prompt definition for summarizing patient condition
const patientConditionSummaryPrompt = ai.definePrompt({
  name: 'patientConditionSummaryPrompt',
  input: { schema: SummarizePatientConditionInputSchema },
  output: { schema: PatientConditionSummaryOutputSchema },
  prompt: `You are an expert medical AI assistant. Your role is to synthesize patient data into a concise, insightful summary to support clinical decision-making. You DO NOT provide diagnoses, prognoses, or specific treatment prescriptions.

Analyze the following patient data:
Patient Information: {{{patientInformation}}}
Vitals: {{{vitals}}}
Observations: {{{observations}}}

Generate a structured clinical summary with the following sections:
1.  **Overall Assessment:** A 1-2 sentence holistic overview of the patient's current status and primary concerns based *solely* on the provided data.
2.  **Key Findings:** A bulleted list identifying the most clinically significant positive findings and pertinent negative findings from the patient information, vitals, and observations. List at least 2-3 key findings if possible, but do not invent if not present.
3.  **Care Suggestions:** A bulleted list of general, non-prescriptive considerations. These might include potential areas for further investigation (e.g., 'Consider further cardiac workup if symptoms persist'), types of supportive care (e.g., 'Focus on symptomatic relief and hydration'), or aspects to monitor (e.g., 'Close monitoring of respiratory status is advisable'). AVOID suggesting specific medications or definitive treatment plans. List at least 2-3 potential considerations if appropriate.
4.  **Further Data Needed:** Critically evaluate the completeness of the provided data. State clearly if more specific information or tests would be beneficial for a more thorough understanding (e.g., 'Further assessment would benefit from recent lab results such as CBC and electrolytes,' or 'Consider imaging studies if abdominal pain is a primary feature'). If the provided data is very limited, state that a comprehensive summary is not possible and recommend gathering more detailed information. If the data seems reasonably sufficient for an initial overview, state that.

Constraints:
- Be objective and stick strictly to the provided data. Do not make assumptions or infer information not present.
- If data is contradictory or insufficient for a particular section, state this explicitly (e.g., 'Insufficient data to determine key hematological findings for Key Findings section.').
- The language should be professional and clinical.
- Output must strictly adhere to the PatientConditionSummaryOutputSchema (overallAssessment, keyFindings, careSuggestions, furtherDataNeeded).`,
});

// Flow definition for summarizing patient condition
const summarizePatientConditionFlow = ai.defineFlow(
  {
    name: 'summarizePatientConditionFlow',
    inputSchema: SummarizePatientConditionInputSchema,
    outputSchema: PatientConditionSummaryOutputSchema,
  },
  async (input): Promise<PatientConditionSummaryOutput> => {
    const { output } = await patientConditionSummaryPrompt(input);
    // Ensure all array fields have at least one entry if the AI doesn't provide them, 
    // or provide a default message, to prevent empty arrays if not applicable.
    return {
      overallAssessment: output?.overallAssessment || 'Assessment could not be generated based on provided data.',
      keyFindings: output?.keyFindings && output.keyFindings.length > 0 ? output.keyFindings : ['No specific key findings identified or data insufficient.'],
      careSuggestions: output?.careSuggestions && output.careSuggestions.length > 0 ? output.careSuggestions : ['No specific care suggestions identified or data insufficient.'],
      furtherDataNeeded: output?.furtherDataNeeded || 'Evaluation of information sufficiency could not be determined.',
    };
  }
);

// Exported function to summarize patient condition
export async function summarizePatientCondition(
  input: SummarizePatientConditionInput
): Promise<PatientConditionSummaryOutput> {
  return summarizePatientConditionFlow(input);
}

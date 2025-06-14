import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the enhanceSoapNotes flow
export const EnhanceSoapNotesInputSchema = z.object({
  patientInformation: z
    .string()
    .describe('Comprehensive details about the patient, including medical history.'),
  vitals: z.string().describe('Patient vitals such as heart rate, blood pressure, etc.'),
  observations: z
    .string()
    .describe('Original doctor’s observations or clinical context regarding the patient’s condition.'),
  currentNotes: z.string().describe('The current clinical notes text to be enhanced into SOAP format.'),
});
export type EnhanceSoapNotesInput = z.infer<typeof EnhanceSoapNotesInputSchema>;

// Output schema for the enhanceSoapNotes flow
export const EnhanceSoapNotesOutputSchema = z.object({
  enhancedSoapNotes: z.string().describe('The enhanced and restructured SOAP notes.'),
});
export type EnhanceSoapNotesOutput = z.infer<typeof EnhanceSoapNotesOutputSchema>;

// Prompt definition for enhancing SOAP notes
const enhanceSoapNotesPrompt = ai.definePrompt({
  name: 'enhanceSoapNotesPrompt',
  input: { schema: EnhanceSoapNotesInputSchema },
  output: { schema: EnhanceSoapNotesOutputSchema },  prompt: `As a medical AI, your task is to enhance and restructure the provided "Current Clinical Notes" into a standard SOAP (Subjective, Objective, Assessment, Plan) format.
Use the following patient context to ensure accuracy and completeness:
Patient Information: {{{patientInformation}}}
Vitals: {{{vitals}}}
Original Doctor's Observations/Context: {{{observations}}}

Current Clinical Notes to Enhance:
{{{currentNotes}}}

Instructions:
1. If the "Current Clinical Notes" contain actual clinical content, enhance and restructure them into proper SOAP format.
2. If the "Current Clinical Notes" are empty or contain only a generation prompt, create comprehensive SOAP notes based on the patient information, vitals, and doctor's observations.
3. Review all provided information to identify subjective complaints, objective findings, clinical assessment, and treatment plan.
4. Organize this information clearly under the S, O, A, and P headings.
5. Ensure the language is concise, clinically relevant, and professional.
6. Do not invent information not present in the provided texts.
7. Use the "Original Doctor's Observations/Context" as the primary source of clinical findings.

CRITICAL: Output only the enhanced SOAP notes in a single string, formatted clearly with S:, O:, A:, P: headings exactly as shown below:

S: [Subjective text - patient's reported symptoms, concerns, and history]
O: [Objective text - vital signs, physical examination findings, test results]
A: [Assessment text - clinical diagnosis, analysis, and impression]
P: [Plan text - treatment plan, follow-up, and next steps]

Each section must start with the exact prefix (S:, O:, A:, P:) followed by a space and the content. This format is required for proper parsing.
`,
});

// Flow definition for enhancing SOAP notes
export const enhanceSoapNotesFlow = ai.defineFlow(
  {
    name: 'enhanceSoapNotesFlow',
    inputSchema: EnhanceSoapNotesInputSchema,
    outputSchema: EnhanceSoapNotesOutputSchema,
  },
  async (input) => {
    const { output } = await enhanceSoapNotesPrompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the AI model for enhancing notes.');
    }
    return output;
  }
);

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
  output: { schema: EnhanceSoapNotesOutputSchema },
  prompt: `As a medical AI, your task is to enhance and restructure the provided "Current Clinical Notes" into a standard SOAP (Subjective, Objective, Assessment, Plan) format.
Use the following patient context to ensure accuracy and completeness:
Patient Information: {{{patientInformation}}}
Vitals: {{{vitals}}}
Original Doctor's Observations/Context: {{{observations}}}

Current Clinical Notes to Enhance:
{{{currentNotes}}}

Review the "Current Clinical Notes". Identify subjective complaints, objective findings, your assessment of the patient's condition, and the proposed plan.
Organize this information clearly under the S, O, A, and P headings.
Ensure the language is concise, clinically relevant, and professional.
If the "Current Clinical Notes" are already well-structured, refine them for clarity and completeness.
If sections are missing, try to infer them from the "Original Doctor's Observations/Context" or other provided patient information if possible. If information is not available, clearly state that in the respective SOAP section (e.g., "Assessment: Further information needed based on provided context.").
Do not invent information not present in the provided texts.
The primary goal is to structure and enhance the narrative of the "Current Clinical Notes" using the supporting context.

Output only the enhanced SOAP notes in a single string, formatted clearly with S:, O:, A:, P: headings.
Example:
S: [Subjective text]
O: [Objective text]
A: [Assessment text]
P: [Plan text]
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

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

CRITICAL FORMATTING REQUIREMENTS:
- Each section MUST start on a new line
- Use exactly "S:", "O:", "A:", "P:" followed by ONE space
- Do NOT use standalone letters like "P" in the content that could be confused with section headers
- If you need to mention a "Plan" or "Patient" in the content, use "Treatment plan" or "The patient" instead
- Ensure there are NO ambiguous single letters that could interfere with parsing

Format exactly as shown:

S: [Subjective - patient's reported symptoms, concerns, and history]

O: [Objective - vital signs, physical examination findings, test results]

A: [Assessment - clinical diagnosis, analysis, and impression]

P: [Plan - treatment plan, follow-up, and next steps. Use "Treatment plan:" or "Recommended:" instead of standalone "P:" within content]

Each section must start with the exact prefix (S:, O:, A:, P:) followed by a space and the content on the same line. This format is required for proper parsing.
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

// Enhanced input schema with medical history
export const EnhanceSoapNotesInputSchemaEnhanced = z.object({
  patientInformation: z
    .string()
    .describe('Comprehensive details about the patient, including medical history.'),
  vitals: z.string().describe('Patient vitals such as heart rate, blood pressure, etc.'),
  observations: z
    .string()
    .describe('Original doctor’s observations or clinical context regarding the patient’s condition.'),
  currentNotes: z.string().describe('The current clinical notes text to be enhanced into SOAP format.'),
  medicalHistory: z.object({
    allergies: z.array(z.string()).optional().describe('Known allergies and adverse reactions.'),
    currentMedications: z.array(z.string()).optional().describe('Current medications and dosages.'),
    previousConditions: z.array(z.string()).optional().describe('Previous medical conditions and diagnoses.'),
    primaryComplaint: z.string().optional().describe('Patient\'s primary reason for visit.'),
  }).optional().describe('Structured medical history data for enhanced SOAP notes.'),
});
export type EnhanceSoapNotesInputEnhanced = z.infer<typeof EnhanceSoapNotesInputSchemaEnhanced>;

// Enhanced output schema with medical history considerations
export const EnhanceSoapNotesOutputSchemaEnhanced = z.object({
  enhancedSoapNotes: z.string().describe('The enhanced and restructured SOAP notes with medical history integration.'),
  medicalHistoryIntegration: z.object({
    allergyConsiderations: z.array(z.string()).optional().describe('Allergy-related considerations mentioned in notes.'),
    medicationReferences: z.array(z.string()).optional().describe('Current medication references in notes.'),
    previousConditionRelevance: z.array(z.string()).optional().describe('How previous conditions relate to current presentation.'),
  }).optional().describe('Summary of how medical history was integrated into the SOAP notes.'),
});
export type EnhanceSoapNotesOutputEnhanced = z.infer<typeof EnhanceSoapNotesOutputSchemaEnhanced>;

// Enhanced prompt definition for SOAP notes with medical history
const enhanceSoapNotesPromptEnhanced = ai.definePrompt({
  name: 'enhanceSoapNotesPromptEnhanced',
  input: { schema: EnhanceSoapNotesInputSchemaEnhanced },
  output: { schema: EnhanceSoapNotesOutputSchemaEnhanced },
  prompt: `As a medical AI specializing in clinical documentation, enhance and restructure the provided clinical notes into comprehensive SOAP format, incorporating the patient's complete medical history.

PATIENT CONTEXT:
Patient Information: {{{patientInformation}}}
Vitals: {{{vitals}}}
Original Doctor's Observations: {{{observations}}}

{{#if medicalHistory}}
MEDICAL HISTORY:
{{#if medicalHistory.primaryComplaint}}Primary Complaint: {{{medicalHistory.primaryComplaint}}}{{/if}}
{{#if medicalHistory.allergies}}Known Allergies: {{{medicalHistory.allergies}}}{{/if}}
{{#if medicalHistory.currentMedications}}Current Medications: {{{medicalHistory.currentMedications}}}{{/if}}
{{#if medicalHistory.previousConditions}}Previous Conditions: {{{medicalHistory.previousConditions}}}{{/if}}
{{/if}}

CURRENT CLINICAL NOTES TO ENHANCE:
{{{currentNotes}}}

ENHANCED SOAP INTEGRATION INSTRUCTIONS:

1. **Subjective Section Enhancement**:
   - Include primary complaint prominently
   - Reference relevant previous conditions that relate to current symptoms
   - Mention patient's medication compliance and any side effects
   - Note any allergy-related concerns expressed by patient

2. **Objective Section Enhancement**:
   - Include all vital signs with normal ranges context
   - Reference baseline values if previous conditions suggest monitoring needs
   - Note any medication effects on physical findings

3. **Assessment Section Enhancement**:
   - Consider differential diagnosis in context of previous conditions
   - Factor in current medications when assessing symptoms
   - Include allergy considerations in diagnostic reasoning
   - Assess risk based on medical history

4. **Plan Section Enhancement**:
   - **CRITICAL**: Always check treatment plans against known allergies
   - Consider medication interactions with current prescriptions
   - Reference previous condition management in ongoing care
   - Include specific allergy precautions if applicable
   - Mention medication monitoring needs based on history

MEDICAL HISTORY INTEGRATION REQUIREMENTS:
- **Allergies**: Flag any treatment considerations that conflict with known allergies
- **Current Medications**: Consider interactions and contraindications
- **Previous Conditions**: Relate current presentation to past medical history
- **Continuity of Care**: Ensure plan aligns with ongoing medical management

SAFETY AND CLINICAL STANDARDS:
- Prioritize patient safety through allergy awareness
- Ensure medication reconciliation is considered
- Maintain clinical accuracy and professional language
- Include relevant medical history context without over-elaboration

FORMAT REQUIREMENTS:
Each section MUST start with the exact prefix followed by ONE space:

S: [Enhanced subjective findings incorporating medical history]

O: [Enhanced objective findings with historical context]

A: [Enhanced assessment considering complete medical picture]

P: [Enhanced plan with allergy precautions and medication considerations]

Additionally, provide a summary of how medical history was integrated into the SOAP notes, including:
- Allergy considerations addressed
- Medication references incorporated
- Previous condition relevance established`,
});

// Enhanced flow definition for SOAP notes
export const enhanceSoapNotesFlowEnhanced = ai.defineFlow(
  {
    name: 'enhanceSoapNotesFlowEnhanced',
    inputSchema: EnhanceSoapNotesInputSchemaEnhanced,
    outputSchema: EnhanceSoapNotesOutputSchemaEnhanced,
  },
  async (input) => {
    const { output } = await enhanceSoapNotesPromptEnhanced(input);
    if (!output) {
      throw new Error('Failed to get a response from the AI model for enhancing notes.');
    }
    return output;
  }
);

// Enhanced exported function
export async function enhanceSoapNotesEnhanced(
  input: EnhanceSoapNotesInputEnhanced
): Promise<EnhanceSoapNotesOutputEnhanced> {
  return enhanceSoapNotesFlowEnhanced(input);
}

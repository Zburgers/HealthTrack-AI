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

// Enhanced input schema with structured medical history
const SummarizePatientConditionInputSchemaEnhanced = z.object({
  patientInformation: z
    .string()
    .describe('Comprehensive details about the patient, including medical history, age, gender, primary complaint, known conditions, medications, allergies.'),
  vitals: z.string().describe('Patient vitals such as BP, HR, Temp, RR, SpO2.'),
  observations: z
    .string()
    .describe('Clinician\'s free-text notes or initial observations regarding the patient\'s condition.'),
  medicalHistory: z.object({
    allergies: z.array(z.string()).optional().describe('Known allergies and adverse reactions.'),
    currentMedications: z.array(z.string()).optional().describe('Current medications and dosages.'),
    previousConditions: z.array(z.string()).optional().describe('Previous medical conditions and diagnoses.'),
    primaryComplaint: z.string().optional().describe('Patient\'s primary reason for visit.'),
  }).optional().describe('Structured medical history data for comprehensive patient summary.'),
});

export type SummarizePatientConditionInputEnhanced = z.infer<typeof SummarizePatientConditionInputSchemaEnhanced>;

// Enhanced output schema with medical history insights
const PatientConditionSummaryOutputSchemaEnhanced = z.object({
  overallAssessment: z.string().describe('Comprehensive overview of patient status including medical history context.'),
  keyFindings: z.array(z.string()).describe('Key clinical findings including medical history relevance.'),
  careSuggestions: z.array(z.string()).describe('Care recommendations considering complete medical picture.'),
  furtherDataNeeded: z.string().describe('Additional information needs assessment.'),
  medicalHistoryInsights: z.object({
    allergyImpact: z.array(z.string()).optional().describe('How allergies impact current care.'),
    medicationConsiderations: z.array(z.string()).optional().describe('Current medication relevance to condition.'),
    previousConditionRelevance: z.array(z.string()).optional().describe('How past conditions relate to current presentation.'),
    riskFactorAnalysis: z.array(z.string()).optional().describe('Risk factors identified from medical history.'),
  }).optional().describe('Detailed medical history impact analysis.'),
});

export type PatientConditionSummaryOutputEnhanced = z.infer<typeof PatientConditionSummaryOutputSchemaEnhanced>;

// Enhanced prompt definition with medical history focus
const patientConditionSummaryPromptEnhanced = ai.definePrompt({
  name: 'patientConditionSummaryPromptEnhanced',
  input: { schema: SummarizePatientConditionInputSchemaEnhanced },
  output: { schema: PatientConditionSummaryOutputSchemaEnhanced },
  prompt: `You are an expert medical AI assistant specializing in comprehensive patient analysis. Synthesize all patient data including detailed medical history into a thorough clinical summary to support informed clinical decision-making.

PATIENT DATA:
Patient Information: {{{patientInformation}}}
Vitals: {{{vitals}}}
Observations: {{{observations}}}

{{#if medicalHistory}}
STRUCTURED MEDICAL HISTORY:
{{#if medicalHistory.primaryComplaint}}Primary Complaint: {{{medicalHistory.primaryComplaint}}}{{/if}}
{{#if medicalHistory.allergies}}Known Allergies: {{{medicalHistory.allergies}}}{{/if}}
{{#if medicalHistory.currentMedications}}Current Medications: {{{medicalHistory.currentMedications}}}{{/if}}
{{#if medicalHistory.previousConditions}}Previous Medical Conditions: {{{medicalHistory.previousConditions}}}{{/if}}
{{/if}}

COMPREHENSIVE ANALYSIS REQUIREMENTS:

1. **Enhanced Overall Assessment** (1-2 sentences):
   - Synthesize current presentation with medical history context
   - Highlight how past conditions influence current status
   - Consider medication effects on current presentation

2. **Key Findings with Medical History Context** (bulleted list):
   - Current clinical findings with historical relevance
   - Medication effects or side effects that may be contributing
   - Previous condition exacerbations or complications
   - Allergy-related considerations for current symptoms
   - Risk factors from medical history

3. **Care Suggestions with Medical History Integration** (bulleted list):
   - Treatment considerations that account for known allergies
   - Medication adjustments or interactions to consider
   - Monitoring needs based on previous conditions
   - Preventive measures related to historical risk factors
   - Contraindications based on medical history

4. **Further Data Needed Assessment**:
   - Missing medical history information
   - Need for medication level monitoring
   - Previous condition status updates
   - Allergy severity clarification needs

5. **Medical History Impact Analysis**:
   - **Allergy Impact**: How allergies affect treatment options
   - **Medication Considerations**: Current med relevance to condition
   - **Previous Condition Relevance**: Past conditions affecting current care
   - **Risk Factor Analysis**: Historical risk factors identified

CLINICAL SAFETY PRIORITIES:
- Always consider drug allergies in treatment suggestions
- Factor in medication interactions with current prescriptions
- Assess risk based on complete medical history
- Highlight any contraindications clearly

ANALYSIS STANDARDS:
- Be objective and evidence-based
- Acknowledge data limitations explicitly
- Prioritize patient safety through comprehensive history review
- Use professional clinical language
- Avoid speculation beyond available data

OUTPUT FORMAT:
Provide structured analysis following the PatientConditionSummaryOutputSchemaEnhanced, ensuring all medical history insights are thoroughly integrated into each section`,
});

// Enhanced flow definition
const summarizePatientConditionFlowEnhanced = ai.defineFlow(
  {
    name: 'summarizePatientConditionFlowEnhanced',
    inputSchema: SummarizePatientConditionInputSchemaEnhanced,
    outputSchema: PatientConditionSummaryOutputSchemaEnhanced,
  },
  async (input): Promise<PatientConditionSummaryOutputEnhanced> => {
    const { output } = await patientConditionSummaryPromptEnhanced(input);
    
    // Ensure comprehensive output with defaults
    return {
      overallAssessment: output?.overallAssessment || 'Assessment could not be generated based on provided data.',
      keyFindings: output?.keyFindings && output.keyFindings.length > 0 ? output.keyFindings : ['No specific key findings identified or data insufficient.'],
      careSuggestions: output?.careSuggestions && output.careSuggestions.length > 0 ? output.careSuggestions : ['No specific care suggestions identified or data insufficient.'],
      furtherDataNeeded: output?.furtherDataNeeded || 'Evaluation of information sufficiency could not be determined.',
      medicalHistoryInsights: output?.medicalHistoryInsights || {
        allergyImpact: ['No allergy impact analysis available.'],
        medicationConsiderations: ['No medication considerations identified.'],
        previousConditionRelevance: ['No previous condition relevance established.'],
        riskFactorAnalysis: ['No risk factors identified from medical history.'],
      },
    };
  }
);

// Enhanced exported function
export async function summarizePatientConditionEnhanced(
  input: SummarizePatientConditionInputEnhanced
): Promise<PatientConditionSummaryOutputEnhanced> {
  return summarizePatientConditionFlowEnhanced(input);
}

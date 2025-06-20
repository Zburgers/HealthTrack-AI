'use server';

/**
 * @fileOverview AI flow for analyzing patient symptoms, identifying ICD-10 codes,
 * calculating risk scores, and drafting initial SOAP notes.
 *
 * - analyzePatientSymptoms - Analyzes patient data and generates SOAP notes.
 * - AnalyzePatientSymptomsInput - Input type for analyzePatientSymptoms function.
 * - AnalyzePatientSymptomsOutput - Return type for analyzePatientSymptoms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fs from 'fs/promises';
import path from 'path';

// Define the structure of an ICD-10 code entry
const ICD10CodeSchema = z.object({
  code: z.string(),
  desc: z.string(),
});

// Define the structure for the output of fetchICDCodes
const ICD10CodeWithDescriptionSchema = z.object({
  code: z.string(),
  description: z.string(),
});


// Input schema for the analyzePatientSymptoms flow
const AnalyzePatientSymptomsInputSchema = z.object({
  patientInformation: z
    .string()
    .describe('Comprehensive details about the patient, including medical history.'),
  vitals: z.string().describe('Patient vitals such as heart rate, blood pressure, etc.'),
  observations: z
    .string()
    .describe('Doctor’s observations regarding the patient’s condition.'),
});

export type AnalyzePatientSymptomsInput = z.infer<
  typeof AnalyzePatientSymptomsInputSchema
>;

// Output schema for the analyzePatientSymptoms flow
const AnalyzePatientSymptomsOutputSchema = z.object({
  icd10Tags: z
    .array(ICD10CodeWithDescriptionSchema)
    .describe('List of relevant ICD-10 codes with descriptions identified by the analysis.'),
  riskScore: z.number().describe('Calculated risk score based on the input data.'),
  soapNotes: z
    .string()
    .describe(
      'Draft SOAP notes generated by the AI, structured with S:, O:, A:, and P: sections. ' +
      'Example: "S: Patient complains of chest pain.\nO: BP 160/98, HR 92.\nA: Possible unstable angina.\nP: Order ECG."'
    ),
});

export type AnalyzePatientSymptomsOutput = z.infer<
  typeof AnalyzePatientSymptomsOutputSchema
>;

// Tool definition for fetching ICD-10 codes
const fetchICDCodes = ai.defineTool(
  {
    name: 'fetchICDCodes',
    description: 'Retrieves relevant ICD-10 codes with descriptions based on patient symptoms.',
    inputSchema: z.object({
      codes: z.array(z.string()).describe('An array of ICD-10 codes.'),
    }),
    outputSchema: z.array(ICD10CodeWithDescriptionSchema),
  },
  async ({codes}) => {
    try {
      const filePath = path.join(process.cwd(), 'codes_icd10_2026.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const icd10Data = JSON.parse(fileContent) as z.infer<typeof ICD10CodeSchema>[];

      const results = codes.map(code => {
        const found = icd10Data.find(item => item.code === code);
        return {code, description: found ? found.desc : 'Description not found'};
      });
      return results;
    } catch (error) {
      console.error('Error fetching ICD-10 codes:', error);
      return codes.map(code => ({code, description: 'Error fetching description'}));
    }
  }
);

// Tool definition for calculating risk score
const calculateRiskScore = ai.defineTool(
  {
    name: 'calculateRiskScore',
    description: 'Calculates a risk score based on patient information and vitals.',
    inputSchema: z.object({
      patientInformation: z
        .string()
        .describe('Comprehensive details about the patient, including medical history.'),
      vitals: z.string().describe('Patient vitals such as heart rate, blood pressure, etc.'),
    }),
    outputSchema: z.number(),
  },
  async input => {
    // Placeholder implementation - replace with actual risk score calculation logic
    console.log('calculating risk score for patient:', input.patientInformation);
    return 0.75; // Example risk score
  }
);

// Prompt definition for analyzing patient symptoms and drafting SOAP notes
const analyzePatientSymptomsPrompt = ai.definePrompt({
  name: 'analyzePatientSymptomsPrompt',
  input: {schema: AnalyzePatientSymptomsInputSchema},
  output: {schema: AnalyzePatientSymptomsOutputSchema},
  tools: [fetchICDCodes, calculateRiskScore],  prompt: `As a medical AI, analyze the patient information, vitals, and doctor's observations to identify relevant ICD-10 tags, calculate a risk score, and draft initial SOAP notes.

Patient Information: {{{patientInformation}}}
Vitals: {{{vitals}}}
Observations: {{{observations}}}

First, identify a list of relevant ICD-10 codes based on the patient's symptoms and conditions described in the patient information and doctor's observations. Then, use the fetchICDCodes tool to retrieve the descriptions for these codes. Finally, use the calculateRiskScore tool to determine the patient's risk score based on provided patient information and vitals.

Based on this, draft SOAP notes which summarize the Subjective findings, Objective findings, Assessment, and Plan. Be concise and clinically relevant.

IMPORTANT: Format the SOAP notes with clear prefixes for parsing:
S: [Subjective findings - patient's reported symptoms and concerns]
O: [Objective findings - vital signs, physical examination, test results]
A: [Assessment - clinical diagnosis and analysis]
P: [Plan - treatment plan and next steps]

Ensure that the ICD-10 codes and their descriptions, as well as the risk score, are incorporated into the SOAP notes appropriately.

Output the ICD-10 tags with their descriptions, risk score, and SOAP notes in the format specified by the AnalyzePatientSymptomsOutputSchema.`,
});

// Flow definition for analyzing patient symptoms
const analyzePatientSymptomsFlow = ai.defineFlow(
  {
    name: 'analyzePatientSymptomsFlow',
    inputSchema: AnalyzePatientSymptomsInputSchema,
    outputSchema: AnalyzePatientSymptomsOutputSchema,
  },
  async input => {
    const {output} = await analyzePatientSymptomsPrompt(input);
    return output!;
  }
);

// Exported function to analyze patient symptoms
export async function analyzePatientSymptoms(
  input: AnalyzePatientSymptomsInput
): Promise<AnalyzePatientSymptomsOutput> {
  return analyzePatientSymptomsFlow(input);
}

// Enhanced input schema for the analyzePatientSymptoms flow with medical history
const AnalyzePatientSymptomsInputSchemaEnhanced = z.object({
  patientInformation: z
    .string()
    .describe('Comprehensive details about the patient, including medical history.'),
  vitals: z.string().describe('Patient vitals such as heart rate, blood pressure, etc.'),
  observations: z
    .string()
    .describe('Doctor\'s observations regarding the patient\'s condition.'),
  medicalHistory: z.object({
    allergies: z.array(z.string()).optional().describe('Known allergies and adverse reactions.'),
    currentMedications: z.array(z.string()).optional().describe('Current medications and dosages.'),
    previousConditions: z.array(z.string()).optional().describe('Previous medical conditions and diagnoses.'),
    primaryComplaint: z.string().optional().describe('Patient\'s primary reason for visit.'),
  }).optional().describe('Structured medical history data for enhanced analysis.'),
});

export type AnalyzePatientSymptomsInputEnhanced = z.infer<typeof AnalyzePatientSymptomsInputSchemaEnhanced>;

// Enhanced output schema with medical history considerations
const AnalyzePatientSymptomsOutputSchemaEnhanced = z.object({
  icd10Tags: z
    .array(ICD10CodeWithDescriptionSchema)
    .describe('List of relevant ICD-10 codes with descriptions identified by the analysis.'),
  riskScore: z.number().describe('Calculated risk score based on the input data.'),
  soapNotes: z
    .string()
    .describe(
      'Draft SOAP notes generated by the AI, structured with S:, O:, A:, and P: sections. ' +
      'Example: "S: Patient complains of chest pain.\nO: BP 160/98, HR 92.\nA: Possible unstable angina.\nP: Order ECG."'
    ),
  allergyWarnings: z
    .array(z.string())
    .optional()
    .describe('Specific warnings related to allergies and potential contraindications.'),
  medicationInteractions: z
    .array(z.string())
    .optional()
    .describe('Potential medication interactions or concerns based on current medications.'),
  previousConditionsImpact: z
    .array(z.string())
    .optional()
    .describe('Analysis of how previous conditions might impact current presentation.'),
});

export type AnalyzePatientSymptomsOutputEnhanced = z.infer<typeof AnalyzePatientSymptomsOutputSchemaEnhanced>;

// Enhanced tool for calculating risk score with medical history
const calculateRiskScoreEnhanced = ai.defineTool(
  {
    name: 'calculateRiskScoreEnhanced',
    description: 'Calculates a comprehensive risk score based on patient information, vitals, and medical history.',
    inputSchema: z.object({
      patientInformation: z
        .string()
        .describe('Comprehensive details about the patient.'),
      vitals: z.string().describe('Patient vitals such as heart rate, blood pressure, etc.'),
      allergies: z.array(z.string()).optional().describe('Known allergies.'),
      currentMedications: z.array(z.string()).optional().describe('Current medications.'),
      previousConditions: z.array(z.string()).optional().describe('Previous medical conditions.'),
    }),
    outputSchema: z.object({
      riskScore: z.number().describe('Overall risk score (0.0-1.0).'),
      riskFactors: z.array(z.string()).describe('Identified risk factors.'),
      allergyRiskLevel: z.enum(['low', 'moderate', 'high']).describe('Allergy-related risk level.'),
      medicationRiskLevel: z.enum(['low', 'moderate', 'high']).describe('Medication-related risk level.'),
    }),
  },
  async (input) => {
    // Enhanced risk calculation considering medical history
    let baseRisk = 0.3; // Base risk
    const riskFactors: string[] = [];
    let allergyRiskLevel: 'low' | 'moderate' | 'high' = 'low';
    let medicationRiskLevel: 'low' | 'moderate' | 'high' = 'low';

    // Analyze allergies
    if (input.allergies && input.allergies.length > 0) {
      const criticalAllergies = input.allergies.filter(allergy => 
        allergy.toLowerCase().includes('penicillin') || 
        allergy.toLowerCase().includes('nsaid') ||
        allergy.toLowerCase().includes('latex') ||
        allergy.toLowerCase().includes('contrast')
      );
      
      if (criticalAllergies.length > 0) {
        baseRisk += 0.2;
        allergyRiskLevel = 'high';
        riskFactors.push(`Critical allergies: ${criticalAllergies.join(', ')}`);
      } else if (input.allergies.length > 3) {
        baseRisk += 0.1;
        allergyRiskLevel = 'moderate';
        riskFactors.push('Multiple allergies present');
      }
    }

    // Analyze medications
    if (input.currentMedications && input.currentMedications.length > 0) {
      if (input.currentMedications.length > 5) {
        baseRisk += 0.15;
        medicationRiskLevel = 'high';
        riskFactors.push('Polypharmacy (>5 medications)');
      }
      
      const highRiskMeds = input.currentMedications.filter(med =>
        med.toLowerCase().includes('warfarin') ||
        med.toLowerCase().includes('insulin') ||
        med.toLowerCase().includes('digoxin') ||
        med.toLowerCase().includes('lithium')
      );
      
      if (highRiskMeds.length > 0) {
        baseRisk += 0.1;
        medicationRiskLevel = medicationRiskLevel === 'high' ? 'high' : 'moderate';
        riskFactors.push(`High-risk medications: ${highRiskMeds.join(', ')}`);
      }
    }

    // Analyze previous conditions
    if (input.previousConditions && input.previousConditions.length > 0) {
      const chronicConditions = input.previousConditions.filter(condition =>
        condition.toLowerCase().includes('diabetes') ||
        condition.toLowerCase().includes('hypertension') ||
        condition.toLowerCase().includes('heart') ||
        condition.toLowerCase().includes('kidney') ||
        condition.toLowerCase().includes('liver')
      );
      
      if (chronicConditions.length > 0) {
        baseRisk += 0.1 * chronicConditions.length;
        riskFactors.push(`Chronic conditions: ${chronicConditions.join(', ')}`);
      }
    }

    // Cap the risk score at 1.0
    const finalRiskScore = Math.min(baseRisk, 1.0);

    return {
      riskScore: finalRiskScore,
      riskFactors,
      allergyRiskLevel,
      medicationRiskLevel,
    };
  }
);

// Enhanced prompt definition with medical history focus
const analyzePatientSymptomsPromptEnhanced = ai.definePrompt({
  name: 'analyzePatientSymptomsPromptEnhanced',
  input: {schema: AnalyzePatientSymptomsInputSchemaEnhanced},
  output: {schema: AnalyzePatientSymptomsOutputSchemaEnhanced},
  tools: [fetchICDCodes, calculateRiskScoreEnhanced],
  prompt: `As a medical AI specializing in comprehensive patient analysis, analyze the patient information, vitals, observations, and medical history to provide detailed clinical insights.

Patient Information: {{{patientInformation}}}
Vitals: {{{vitals}}}
Observations: {{{observations}}}
{{#if medicalHistory}}
Medical History:
{{#if medicalHistory.primaryComplaint}}Primary Complaint: {{{medicalHistory.primaryComplaint}}}{{/if}}
{{#if medicalHistory.allergies}}Known Allergies: {{{medicalHistory.allergies}}}{{/if}}
{{#if medicalHistory.currentMedications}}Current Medications: {{{medicalHistory.currentMedications}}}{{/if}}
{{#if medicalHistory.previousConditions}}Previous Conditions: {{{medicalHistory.previousConditions}}}{{/if}}
{{/if}}

ANALYSIS REQUIREMENTS:

1. **ICD-10 Code Identification**: Identify relevant ICD-10 codes based on symptoms, conditions, and medical history. Use the fetchICDCodes tool to get descriptions.

2. **Comprehensive Risk Assessment**: Use the calculateRiskScoreEnhanced tool to determine risk score, considering:
   - Current symptoms and vitals
   - Known allergies and their severity
   - Current medications and interactions
   - Previous conditions and their impact

3. **SOAP Notes Generation**: Create detailed SOAP notes that incorporate:
   - Subjective: Patient's complaints and medical history
   - Objective: Vital signs and physical findings
   - Assessment: Clinical diagnosis considering medical history
   - Plan: Treatment plan with allergy and medication considerations

4. **Medical History Analysis**: 
   - **Allergy Warnings**: Identify any treatments or medications that should be avoided
   - **Medication Interactions**: Flag potential interactions with current medications
   - **Previous Conditions Impact**: Analyze how past conditions affect current presentation

CRITICAL SAFETY CONSIDERATIONS:
- Always check for drug allergies before suggesting treatments
- Consider medication interactions with current prescriptions
- Factor in previous conditions when assessing risk
- Highlight any contraindications clearly

FORMAT REQUIREMENTS:
- SOAP notes must use clear S:, O:, A:, P: prefixes
- Include allergy warnings prominently in the plan section
- Mention medication considerations in assessment and plan
- Reference previous conditions when relevant

Ensure all outputs are clinically sound and prioritize patient safety through comprehensive medical history integration.`,
});

// Enhanced flow definition
const analyzePatientSymptomsFlowEnhanced = ai.defineFlow(
  {
    name: 'analyzePatientSymptomsFlowEnhanced',
    inputSchema: AnalyzePatientSymptomsInputSchemaEnhanced,
    outputSchema: AnalyzePatientSymptomsOutputSchemaEnhanced,
  },
  async (input) => {
    const {output} = await analyzePatientSymptomsPromptEnhanced(input);
    return output!;
  }
);

// Enhanced exported function
export async function analyzePatientSymptomsEnhanced(
  input: AnalyzePatientSymptomsInputEnhanced
): Promise<AnalyzePatientSymptomsOutputEnhanced> {
  return analyzePatientSymptomsFlowEnhanced(input);
}

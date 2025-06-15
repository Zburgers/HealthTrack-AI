import { z } from 'zod';

// Original schema for backward compatibility
export const PatientConditionSummaryOutputSchema = z.object({
  overallAssessment: z.string().describe("A brief summary of the patient's current primary issues and overall state."),
  keyFindings: z.array(z.string()).describe("A list of the most significant findings from the provided information."),
  careSuggestions: z.array(z.string()).describe("A list of general care considerations or potential areas for further investigation (non-prescriptive)."),
  furtherDataNeeded: z.string().describe("Statement on whether more data/tests are needed, or if provided data is sufficient for a preliminary assessment."),
});

export type PatientConditionSummaryOutput = z.infer<typeof PatientConditionSummaryOutputSchema>;

// Enhanced AI output types with medical history integration
export const EnhancedAIAnalysisOutputSchema = z.object({
  // Standard analysis fields
  summary: z.string().describe('Comprehensive AI-generated analysis summary.'),
  riskScore: z.number().describe('Calculated risk score (0.0-1.0).'),
  
  // ICD-10 and diagnostic information
  icd10Tags: z.array(z.object({
    code: z.string(),
    description: z.string(),
  })).optional().describe('Relevant ICD-10 codes with descriptions.'),
  
  differentialDiagnosis: z.array(z.object({
    condition: z.string(),
    likelihood: z.string(),
  })).optional().describe('Differential diagnosis options.'),
  
  // Enhanced medical history considerations
  medicalHistoryAnalysis: z.object({
    allergyWarnings: z.array(z.string()).optional().describe('Allergy-related warnings and contraindications.'),
    medicationInteractions: z.array(z.string()).optional().describe('Potential medication interactions.'),
    previousConditionsImpact: z.array(z.string()).optional().describe('Impact of previous conditions on current presentation.'),
    riskFactorAnalysis: z.array(z.string()).optional().describe('Risk factors identified from medical history.'),
  }).optional().describe('Comprehensive medical history analysis.'),
  
  // Clinical recommendations
  recommendedTests: z.array(z.string()).optional().describe('Recommended diagnostic tests.'),
  treatmentSuggestions: z.array(z.string()).optional().describe('Treatment suggestions.'),
  
  // SOAP notes
  soapNotes: z.object({
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    plan: z.string(),
  }).optional().describe('Structured SOAP notes.'),
  
  // Monitoring and follow-up
  monitoringRequirements: z.array(z.string()).optional().describe('Required monitoring based on medical history.'),
  followUpRecommendations: z.array(z.string()).optional().describe('Follow-up recommendations.'),
});

export type EnhancedAIAnalysisOutput = z.infer<typeof EnhancedAIAnalysisOutputSchema>;

// Medical history specific analysis outputs
export const MedicalHistoryAnalysisSchema = z.object({
  allergyAnalysis: z.object({
    riskLevel: z.enum(['low', 'moderate', 'high']).describe('Overall allergy risk level.'),
    criticalAllergies: z.array(z.string()).describe('Life-threatening or critical allergies.'),
    drugContraindications: z.array(z.string()).describe('Medications to avoid due to allergies.'),
    alternativeTreatments: z.array(z.string()).optional().describe('Alternative treatments for allergic patients.'),
  }).optional(),
  
  medicationAnalysis: z.object({
    interactionRisk: z.enum(['low', 'moderate', 'high']).describe('Medication interaction risk level.'),
    potentialInteractions: z.array(z.object({
      medications: z.array(z.string()),
      interaction: z.string(),
      severity: z.enum(['minor', 'moderate', 'major']),
    })).optional().describe('Specific medication interactions identified.'),
    polypharmacyRisk: z.boolean().describe('Whether patient is at risk from polypharmacy.'),
    medicationReview: z.array(z.string()).optional().describe('Medications that need review or monitoring.'),
  }).optional(),
  
  previousConditionsAnalysis: z.object({
    relevantConditions: z.array(z.string()).describe('Previous conditions relevant to current presentation.'),
    complicationRisk: z.array(z.string()).describe('Potential complications based on medical history.'),
    monitoringNeeds: z.array(z.string()).describe('Monitoring requirements based on previous conditions.'),
    treatmentModifications: z.array(z.string()).optional().describe('Treatment modifications needed due to previous conditions.'),
  }).optional(),
});

export type MedicalHistoryAnalysis = z.infer<typeof MedicalHistoryAnalysisSchema>;

// Enhanced SOAP notes output with medical history integration
export const EnhancedSoapNotesSchema = z.object({
  subjective: z.string().describe('Patient-reported symptoms and concerns including medical history.'),
  objective: z.string().describe('Objective findings including vital signs and examination.'),
  assessment: z.string().describe('Clinical assessment considering complete medical history.'),
  plan: z.string().describe('Treatment plan with allergy and medication considerations.'),
  
  medicalHistoryIntegration: z.object({
    allergyConsiderations: z.array(z.string()).optional().describe('How allergies were considered in the plan.'),
    medicationReferences: z.array(z.string()).optional().describe('Current medication references in notes.'),
    previousConditionContext: z.array(z.string()).optional().describe('Previous condition context provided.'),
  }).optional().describe('Summary of medical history integration in SOAP notes.'),
});

export type EnhancedSoapNotes = z.infer<typeof EnhancedSoapNotesSchema>;

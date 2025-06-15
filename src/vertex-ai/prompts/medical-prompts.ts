/**
 * Optimized prompt templates for Vertex AI medical workflows
 * These templates are designed to be more token-efficient while maintaining clinical accuracy
 */

import { z } from 'zod';

// Base medical prompt interface
export interface MedicalPromptTemplate {
  name: string;
  version: string;
  description: string;
  template: string;
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  metadata?: {
    estimatedTokens: number;
    clinicalDomain: string[];
    safetyLevel: 'high' | 'medium' | 'low';
  };
}

// Patient Analysis Prompt Template (Optimized)
export const ANALYZE_PATIENT_SYMPTOMS_PROMPT: MedicalPromptTemplate = {
  name: 'analyze_patient_symptoms',
  version: 'v2_optimized',
  description: 'Analyzes patient symptoms for ICD-10 codes, risk assessment, and SOAP notes',
  template: `Medical AI: Analyze patient data for comprehensive clinical assessment.

PATIENT DATA:
Name: {{patientName}}, {{age}}y {{gender}}
Visit: {{visitDate}}
Chief Complaint: {{primaryComplaint}}
Vitals: {{vitals}}
Observations: {{observations}}

{{#if medicalHistory}}
HISTORY:
{{#if medicalHistory.allergies}}Allergies: {{medicalHistory.allergies}}{{/if}}
{{#if medicalHistory.currentMedications}}Medications: {{medicalHistory.currentMedications}}{{/if}}
{{#if medicalHistory.previousConditions}}Previous: {{medicalHistory.previousConditions}}{{/if}}
{{/if}}

TASKS (Execute in order):
1. SAFETY CHECK: Identify allergy risks and medication interactions
2. ICD-10 CODES: List relevant codes (use tool for descriptions)
3. RISK SCORE: Calculate using enhanced tool (0.0-1.0)
4. SOAP NOTES: Generate structured clinical notes

SAFETY PRIORITIES:
- Flag critical allergies (penicillin, NSAIDs, latex, contrast)
- Check medication interactions
- Consider previous condition impacts

OUTPUT FORMAT:
Return valid JSON with:
- icd10Tags: Array of {code, description}
- riskScore: Number
- soapNotes: String with S:, O:, A:, P: sections
- allergyWarnings: Array of strings
- medicationInteractions: Array of strings  
- previousConditionsImpact: Array of strings

SOAP FORMAT REQUIREMENTS:
S: [Patient complaints + relevant history]
O: [Vitals + physical findings + medication effects]
A: [Clinical assessment + risk factors + history context]
P: [Treatment plan + allergy precautions + monitoring needs]

Generate comprehensive yet concise clinical assessment prioritizing patient safety.`,
  
  inputSchema: z.object({
    patientName: z.string(),
    age: z.number(),
    gender: z.string(),
    visitDate: z.string(),
    primaryComplaint: z.string(),
    vitals: z.string(),
    observations: z.string(),
    medicalHistory: z.object({
      allergies: z.array(z.string()).optional(),
      currentMedications: z.array(z.string()).optional(),
      previousConditions: z.array(z.string()).optional(),
    }).optional(),
  }),
  
  outputSchema: z.object({
    icd10Tags: z.array(z.object({
      code: z.string(),
      description: z.string(),
    })),
    riskScore: z.number(),
    soapNotes: z.string(),
    allergyWarnings: z.array(z.string()).optional(),
    medicationInteractions: z.array(z.string()).optional(),
    previousConditionsImpact: z.array(z.string()).optional(),
  }),
  
  metadata: {
    estimatedTokens: 650,
    clinicalDomain: ['symptom_analysis', 'icd_coding', 'risk_assessment'],
    safetyLevel: 'high',
  },
};

// SOAP Enhancement Prompt Template (Optimized)
export const ENHANCE_SOAP_NOTES_PROMPT: MedicalPromptTemplate = {
  name: 'enhance_soap_notes',
  version: 'v2_optimized',
  description: 'Enhances clinical notes into structured SOAP format with medical history integration',
  template: `Clinical Documentation AI: Enhance notes to professional SOAP format.

PATIENT CONTEXT:
{{patientInformation}}
Vitals: {{vitals}}
Clinical Notes: {{observations}}

{{#if medicalHistory}}
MEDICAL HISTORY:
{{#if medicalHistory.allergies}}Allergies: {{medicalHistory.allergies}}{{/if}}
{{#if medicalHistory.currentMedications}}Current Meds: {{medicalHistory.currentMedications}}{{/if}}
{{#if medicalHistory.previousConditions}}Previous: {{medicalHistory.previousConditions}}{{/if}}
{{/if}}

CURRENT NOTES TO ENHANCE:
{{currentNotes}}

ENHANCEMENT TASK:
{{#if isEmpty}}Generate comprehensive SOAP notes from available data{{else}}Enhance existing notes to professional SOAP format{{/if}}

SOAP INTEGRATION REQUIREMENTS:
S: Include chief complaint + relevant history + medication compliance
O: Vitals + physical findings + medication effects + historical baselines  
A: Clinical assessment + differential diagnosis + risk stratification + history context
P: Treatment plan + allergy precautions + interaction checks + monitoring needs

CRITICAL SAFETY:
- Always verify treatments against known allergies
- Flag potential medication interactions
- Consider previous condition management
- Include specific monitoring requirements

FORMAT REQUIREMENTS:
Each section MUST start with exact prefix:
S: [content]
O: [content] 
A: [content]
P: [content]

OUTPUT JSON:
{
  "enhancedSoapNotes": "formatted SOAP notes string",
  "medicalHistoryIntegration": {
    "allergyConsiderations": ["specific allergy impacts"],
    "medicationReferences": ["current med relevance"],
    "previousConditionRelevance": ["how past conditions relate"]
  }
}

Generate clinically accurate, professionally formatted SOAP notes integrating complete medical context.`,
  
  inputSchema: z.object({
    patientInformation: z.string(),
    vitals: z.string(),
    observations: z.string(),
    currentNotes: z.string(),
    medicalHistory: z.object({
      allergies: z.array(z.string()).optional(),
      currentMedications: z.array(z.string()).optional(),
      previousConditions: z.array(z.string()).optional(),
      primaryComplaint: z.string().optional(),
    }).optional(),
    isEmpty: z.boolean().optional(),
  }),
  
  outputSchema: z.object({
    enhancedSoapNotes: z.string(),
    medicalHistoryIntegration: z.object({
      allergyConsiderations: z.array(z.string()).optional(),
      medicationReferences: z.array(z.string()).optional(),
      previousConditionRelevance: z.array(z.string()).optional(),
    }).optional(),
  }),
  
  metadata: {
    estimatedTokens: 580,
    clinicalDomain: ['clinical_documentation', 'soap_notes'],
    safetyLevel: 'high',
  },
};

// Patient Summary Prompt Template (Optimized)
export const SUMMARIZE_PATIENT_CONDITION_PROMPT: MedicalPromptTemplate = {
  name: 'summarize_patient_condition',
  version: 'v2_optimized',
  description: 'Creates comprehensive patient summaries for clinical decision support',
  template: `Clinical Summary AI: Generate comprehensive patient assessment for decision support.

PATIENT DATA:
{{patientInformation}}
Vitals: {{vitals}}
Clinical Notes: {{observations}}

{{#if medicalHistory}}
MEDICAL HISTORY:
{{#if medicalHistory.allergies}}Allergies: {{medicalHistory.allergies}}{{/if}}
{{#if medicalHistory.currentMedications}}Medications: {{medicalHistory.currentMedications}}{{/if}}
{{#if medicalHistory.previousConditions}}Previous Conditions: {{medicalHistory.previousConditions}}{{/if}}
{{/if}}

ANALYSIS FRAMEWORK:
1. Overall Assessment: Synthesize current status with historical context
2. Key Findings: Prioritize clinically significant findings + history relevance
3. Care Suggestions: Evidence-based recommendations considering full medical picture
4. Data Gaps: Identify missing information critical for care decisions
5. History Impact: Analyze how past conditions affect current care

CLINICAL PRIORITIES:
- Patient safety through comprehensive history review
- Risk stratification based on complete medical picture
- Contraindication identification
- Care continuity considerations

OUTPUT STRUCTURE:
{
  "overallAssessment": "1-2 sentence comprehensive status",
  "keyFindings": ["prioritized clinical findings with history context"],
  "careSuggestions": ["evidence-based care recommendations"],
  "furtherDataNeeded": "critical information gaps assessment",
  "medicalHistoryInsights": {
    "allergyImpact": ["how allergies affect treatment options"],
    "medicationConsiderations": ["current med relevance to condition"],
    "previousConditionRelevance": ["past conditions affecting current care"],
    "riskFactorAnalysis": ["historical risk factors identified"]
  }
}

CONSTRAINTS:
- Objective analysis based only on provided data
- Professional clinical language
- No specific diagnoses or prescriptions
- Acknowledge data limitations explicitly
- Prioritize patient safety in all recommendations

Generate actionable clinical summary supporting informed decision-making.`,
  
  inputSchema: z.object({
    patientInformation: z.string(),
    vitals: z.string(),
    observations: z.string(),
    medicalHistory: z.object({
      allergies: z.array(z.string()).optional(),
      currentMedications: z.array(z.string()).optional(),
      previousConditions: z.array(z.string()).optional(),
      primaryComplaint: z.string().optional(),
    }).optional(),
  }),
  
  outputSchema: z.object({
    overallAssessment: z.string(),
    keyFindings: z.array(z.string()),
    careSuggestions: z.array(z.string()),
    furtherDataNeeded: z.string(),
    medicalHistoryInsights: z.object({
      allergyImpact: z.array(z.string()).optional(),
      medicationConsiderations: z.array(z.string()).optional(),
      previousConditionRelevance: z.array(z.string()).optional(),
      riskFactorAnalysis: z.array(z.string()).optional(),
    }).optional(),
  }),
  
  metadata: {
    estimatedTokens: 620,
    clinicalDomain: ['patient_summary', 'clinical_decision_support'],
    safetyLevel: 'high',
  },
};

// Prompt template registry
export const PROMPT_TEMPLATES = {
  ANALYZE_PATIENT_SYMPTOMS: ANALYZE_PATIENT_SYMPTOMS_PROMPT,
  ENHANCE_SOAP_NOTES: ENHANCE_SOAP_NOTES_PROMPT,
  SUMMARIZE_PATIENT_CONDITION: SUMMARIZE_PATIENT_CONDITION_PROMPT,
} as const;

// Template utility functions
export class PromptTemplateEngine {
  /**
   * Render a template with provided data
   */
  static render(template: string, data: Record<string, any>): string {
    let rendered = template;
    
    // Handle simple variable substitution
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
    
    // Handle nested object access
    rendered = rendered.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, obj, prop) => {
      return data[obj]?.[prop] || match;
    });
    
    // Handle conditional blocks {{#if condition}}...{{/if}}
    rendered = rendered.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      const value = this.getNestedValue(data, condition);
      return value ? content : '';
    });
    
    // Handle array iteration {{#each array}}...{{/each}}
    rendered = rendered.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      const array = data[arrayName];
      if (Array.isArray(array)) {
        return array.map(item => {
          return content.replace(/\{\{this\}\}/g, String(item));
        }).join('');
      }
      return '';
    });
    
    return rendered.trim();
  }
  
  /**
   * Get nested object value using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Validate template data against schema
   */
  static validateInput<T>(data: unknown, schema: z.ZodSchema<T>): T {
    return schema.parse(data);
  }
  
  /**
   * Get template metadata
   */
  static getTemplateInfo(templateName: keyof typeof PROMPT_TEMPLATES) {
    return PROMPT_TEMPLATES[templateName].metadata;
  }
  
  /**
   * Get estimated cost for template
   */
  static estimateCost(templateName: keyof typeof PROMPT_TEMPLATES, inputTokenMultiplier: number = 1): number {
    const template = PROMPT_TEMPLATES[templateName];
    const estimatedTokens = template.metadata?.estimatedTokens || 1000;
    const totalTokens = estimatedTokens * inputTokenMultiplier;
    
    // Gemini 1.5 Pro pricing (approximate)
    const costPer1KTokens = 0.00125; // $0.00125 per 1K tokens
    return (totalTokens / 1000) * costPer1KTokens;
  }
}

export default PROMPT_TEMPLATES;

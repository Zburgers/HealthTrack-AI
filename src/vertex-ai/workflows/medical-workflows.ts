/**
 * Vertex AI Medical Workflows
 * Optimized workflows using Vertex AI client with structured prompt templates
 */

import { vertexAIClient } from '../client/vertex-client';
import { 
  PROMPT_TEMPLATES, 
  PromptTemplateEngine,
  MedicalPromptTemplate 
} from '../prompts/medical-prompts';
import { z } from 'zod';

// Re-export schemas for external use
export const AnalyzePatientSymptomsInputSchema = PROMPT_TEMPLATES.ANALYZE_PATIENT_SYMPTOMS.inputSchema;
export const AnalyzePatientSymptomsOutputSchema = PROMPT_TEMPLATES.ANALYZE_PATIENT_SYMPTOMS.outputSchema;
export const EnhanceSoapNotesInputSchema = PROMPT_TEMPLATES.ENHANCE_SOAP_NOTES.inputSchema;
export const EnhanceSoapNotesOutputSchema = PROMPT_TEMPLATES.ENHANCE_SOAP_NOTES.outputSchema;
export const SummarizePatientConditionInputSchema = PROMPT_TEMPLATES.SUMMARIZE_PATIENT_CONDITION.inputSchema;
export const SummarizePatientConditionOutputSchema = PROMPT_TEMPLATES.SUMMARIZE_PATIENT_CONDITION.outputSchema;

// Type definitions
export type AnalyzePatientSymptomsInput = z.infer<typeof AnalyzePatientSymptomsInputSchema>;
export type AnalyzePatientSymptomsOutput = z.infer<typeof AnalyzePatientSymptomsOutputSchema>;
export type EnhanceSoapNotesInput = z.infer<typeof EnhanceSoapNotesInputSchema>;
export type EnhanceSoapNotesOutput = z.infer<typeof EnhanceSoapNotesOutputSchema>;
export type SummarizePatientConditionInput = z.infer<typeof SummarizePatientConditionInputSchema>;
export type SummarizePatientConditionOutput = z.infer<typeof SummarizePatientConditionOutputSchema>;

/**
 * Medical Workflow Service using Vertex AI
 */
export class MedicalWorkflowService {
  private client = vertexAIClient;

  /**
   * Analyze patient symptoms for ICD-10 codes, risk assessment, and SOAP notes
   */
  async analyzePatientSymptoms(input: AnalyzePatientSymptomsInput): Promise<AnalyzePatientSymptomsOutput> {
    try {
      // Validate input
      const validatedInput = PromptTemplateEngine.validateInput(input, AnalyzePatientSymptomsInputSchema);
      
      // Render the optimized prompt template
      const prompt = PromptTemplateEngine.render(
        PROMPT_TEMPLATES.ANALYZE_PATIENT_SYMPTOMS.template,
        validatedInput
      );

      // Generate structured response with Vertex AI
      const result = await this.client.generateStructuredContent(
        prompt,
        AnalyzePatientSymptomsOutputSchema,
        {
          workflow: 'analyze_patient_symptoms',
          patientId: `${validatedInput.patientName}_${Date.now()}`,
          templateVersion: PROMPT_TEMPLATES.ANALYZE_PATIENT_SYMPTOMS.version,
        }
      );

      // Post-process and validate the response
      return this.postProcessAnalysisResult(result);
    } catch (error) {
      console.error('[Medical Workflow] Patient analysis failed:', error);
      throw new Error(`Patient symptom analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhance clinical notes into structured SOAP format
   */
  async enhanceSoapNotes(input: EnhanceSoapNotesInput): Promise<EnhanceSoapNotesOutput> {
    try {
      // Validate input
      const validatedInput = PromptTemplateEngine.validateInput(input, EnhanceSoapNotesInputSchema);
      
      // Add isEmpty flag for template logic
      const templateData = {
        ...validatedInput,
        isEmpty: !validatedInput.currentNotes || validatedInput.currentNotes.trim().length < 10,
      };
      
      // Render the optimized prompt template
      const prompt = PromptTemplateEngine.render(
        PROMPT_TEMPLATES.ENHANCE_SOAP_NOTES.template,
        templateData
      );

      // Generate structured response
      const result = await this.client.generateStructuredContent(
        prompt,
        EnhanceSoapNotesOutputSchema,
        {
          workflow: 'enhance_soap_notes',
          enhancement_type: templateData.isEmpty ? 'generation' : 'enhancement',
          templateVersion: PROMPT_TEMPLATES.ENHANCE_SOAP_NOTES.version,
        }
      );

      // Validate SOAP format
      return this.postProcessSoapNotes(result);
    } catch (error) {
      console.error('[Medical Workflow] SOAP enhancement failed:', error);
      throw new Error(`SOAP note enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate comprehensive patient condition summary
   */
  async summarizePatientCondition(input: SummarizePatientConditionInput): Promise<SummarizePatientConditionOutput> {
    try {
      // Validate input
      const validatedInput = PromptTemplateEngine.validateInput(input, SummarizePatientConditionInputSchema);
      
      // Render the optimized prompt template
      const prompt = PromptTemplateEngine.render(
        PROMPT_TEMPLATES.SUMMARIZE_PATIENT_CONDITION.template,
        validatedInput
      );

      // Generate structured response
      const result = await this.client.generateStructuredContent(
        prompt,
        SummarizePatientConditionOutputSchema,
        {
          workflow: 'summarize_patient_condition',
          templateVersion: PROMPT_TEMPLATES.SUMMARIZE_PATIENT_CONDITION.version,
        }
      );

      // Ensure required fields and validate
      return this.postProcessPatientSummary(result);
    } catch (error) {
      console.error('[Medical Workflow] Patient summary failed:', error);
      throw new Error(`Patient condition summary failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch process multiple patient analyses
   */
  async batchAnalyzePatients(inputs: AnalyzePatientSymptomsInput[]): Promise<AnalyzePatientSymptomsOutput[]> {
    try {
      const prompts = inputs.map(input => {
        const validatedInput = PromptTemplateEngine.validateInput(input, AnalyzePatientSymptomsInputSchema);
        return PromptTemplateEngine.render(
          PROMPT_TEMPLATES.ANALYZE_PATIENT_SYMPTOMS.template,
          validatedInput
        );
      });

      const results = await this.client.batchGenerate(prompts, {
        workflow: 'batch_analyze_patients',
        batchSize: inputs.length,
      });

      // Parse and validate each result
      return Promise.all(
        results.map(async (result, index) => {
          try {
            const parsed = JSON.parse(result);
            const validated = AnalyzePatientSymptomsOutputSchema.parse(parsed);
            return this.postProcessAnalysisResult(validated);
          } catch (error) {
            console.error(`[Medical Workflow] Batch item ${index} failed:`, error);
            // Return a safe default for failed items
            return this.getDefaultAnalysisResult(inputs[index]);
          }
        })
      );
    } catch (error) {
      console.error('[Medical Workflow] Batch analysis failed:', error);
      throw new Error(`Batch patient analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get workflow performance metrics
   */
  async getWorkflowMetrics() {
    return {
      templates: Object.keys(PROMPT_TEMPLATES).map(key => ({
        name: key,
        version: PROMPT_TEMPLATES[key as keyof typeof PROMPT_TEMPLATES].version,
        estimatedTokens: PROMPT_TEMPLATES[key as keyof typeof PROMPT_TEMPLATES].metadata?.estimatedTokens || 0,
        estimatedCost: PromptTemplateEngine.estimateCost(key as keyof typeof PROMPT_TEMPLATES),
      })),
      client: this.client.getConfig(),
      totalTemplates: Object.keys(PROMPT_TEMPLATES).length,
    };
  }

  /**
   * Private helper methods for post-processing
   */
  private postProcessAnalysisResult(result: AnalyzePatientSymptomsOutput): AnalyzePatientSymptomsOutput {
    // Validate SOAP format
    if (result.soapNotes && !this.isValidSoapFormat(result.soapNotes)) {
      console.warn('[Medical Workflow] Invalid SOAP format detected, attempting to fix...');
      result.soapNotes = this.fixSoapFormat(result.soapNotes);
    }

    // Ensure risk score is within valid range
    if (result.riskScore < 0 || result.riskScore > 1) {
      console.warn('[Medical Workflow] Risk score out of range, clamping to 0-1');
      result.riskScore = Math.max(0, Math.min(1, result.riskScore));
    }

    // Ensure arrays are properly initialized
    result.allergyWarnings = result.allergyWarnings || [];
    result.medicationInteractions = result.medicationInteractions || [];
    result.previousConditionsImpact = result.previousConditionsImpact || [];

    return result;
  }

  private postProcessSoapNotes(result: EnhanceSoapNotesOutput): EnhanceSoapNotesOutput {
    // Validate and fix SOAP format
    if (!this.isValidSoapFormat(result.enhancedSoapNotes)) {
      console.warn('[Medical Workflow] Invalid SOAP format detected, attempting to fix...');
      result.enhancedSoapNotes = this.fixSoapFormat(result.enhancedSoapNotes);
    }

    // Ensure medical history integration is initialized
    if (!result.medicalHistoryIntegration) {
      result.medicalHistoryIntegration = {
        allergyConsiderations: [],
        medicationReferences: [],
        previousConditionRelevance: [],
      };
    }

    return result;
  }

  private postProcessPatientSummary(result: SummarizePatientConditionOutput): SummarizePatientConditionOutput {
    // Ensure arrays have at least one entry
    if (!result.keyFindings || result.keyFindings.length === 0) {
      result.keyFindings = ['Assessment pending additional clinical information'];
    }

    if (!result.careSuggestions || result.careSuggestions.length === 0) {
      result.careSuggestions = ['Continue current care plan pending further evaluation'];
    }

    // Ensure medical history insights are initialized
    if (!result.medicalHistoryInsights) {
      result.medicalHistoryInsights = {
        allergyImpact: ['No specific allergy impacts identified'],
        medicationConsiderations: ['No specific medication considerations noted'],
        previousConditionRelevance: ['No previous condition relevance established'],
        riskFactorAnalysis: ['Standard risk assessment pending additional data'],
      };
    }

    return result;
  }

  private isValidSoapFormat(soapNotes: string): boolean {
    const soapPattern = /S:\s*(.+?)(?=\n\s*O:|\n\s*$)[\s\S]*?O:\s*(.+?)(?=\n\s*A:|\n\s*$)[\s\S]*?A:\s*(.+?)(?=\n\s*P:|\n\s*$)[\s\S]*?P:\s*(.+?)(?=\n\s*$|$)/i;
    return soapPattern.test(soapNotes.trim());
  }

  private fixSoapFormat(soapNotes: string): string {
    // Basic SOAP format correction
    let fixed = soapNotes.trim();
    
    // Ensure proper section headers
    fixed = fixed.replace(/^S[:\s]*(.+?)(?=\nO|$)/im, 'S: $1');
    fixed = fixed.replace(/\nO[:\s]*(.+?)(?=\nA|$)/im, '\n\nO: $1');
    fixed = fixed.replace(/\nA[:\s]*(.+?)(?=\nP|$)/im, '\n\nA: $1');
    fixed = fixed.replace(/\nP[:\s]*(.+?)$/im, '\n\nP: $1');
    
    return fixed;
  }

  private getDefaultAnalysisResult(input: AnalyzePatientSymptomsInput): AnalyzePatientSymptomsOutput {
    return {
      icd10Tags: [],
      riskScore: 0.5,
      soapNotes: `S: ${input.primaryComplaint}\n\nO: ${input.vitals}\n\nA: Assessment pending\n\nP: Plan to be determined`,
      allergyWarnings: [],
      medicationInteractions: [],
      previousConditionsImpact: [],
    };
  }
}

// Singleton instance for the application
export const medicalWorkflows = new MedicalWorkflowService();

// Convenience functions for direct usage
export async function analyzePatientSymptoms(input: AnalyzePatientSymptomsInput): Promise<AnalyzePatientSymptomsOutput> {
  return medicalWorkflows.analyzePatientSymptoms(input);
}

export async function enhanceSoapNotes(input: EnhanceSoapNotesInput): Promise<EnhanceSoapNotesOutput> {
  return medicalWorkflows.enhanceSoapNotes(input);
}

export async function summarizePatientCondition(input: SummarizePatientConditionInput): Promise<SummarizePatientConditionOutput> {
  return medicalWorkflows.summarizePatientCondition(input);
}

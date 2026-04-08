import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MastraService } from '../mastra/mastra.service';
import { ClerkAuthGuard, ClerkUser } from '../auth/guards/clerk-auth.guard';
import { OrgScopedGuard } from '../auth/guards/org-scoped.guard';

@UseGuards(ClerkAuthGuard, OrgScopedGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly mastraService: MastraService) {}

  @Post('analyze')
  async analyzePatient(@Body() input: AnalyzePatientDto) {
    const agent = this.mastraService.getAgentById('patient-analysis-agent');
    const prompt = this.buildAnalysisPrompt(input);
    const response = await agent.generate(prompt);
    return { analysis: response.text };
  }

  @Post('enhance-notes')
  async enhanceNotes(@Body() input: EnhanceNotesDto) {
    const agent = this.mastraService.getAgentById('soap-notes-agent');
    const prompt = this.buildEnhancePrompt(input);
    const response = await agent.generate(prompt);
    return { enhancedNotes: response.text };
  }

  private buildAnalysisPrompt(input: AnalyzePatientDto): string {
    return `
      Analyze the following patient data and provide a clinical assessment:

      Patient Information:
      ${JSON.stringify(input.patientInformation, null, 2)}

      Symptoms:
      ${JSON.stringify(input.symptoms, null, 2)}

      ${input.medicalHistory ? `Medical History: ${input.medicalHistory}` : ''}
      ${input.currentMedications ? `Current Medications: ${input.currentMedications}` : ''}

      Please provide:
      1. Differential diagnoses with likelihood assessments
      2. Recommended next steps (labs, imaging, referrals)
      3. Relevant ICD-10 code suggestions
      4. Risk assessment and urgency level
    `;
  }

  private buildEnhancePrompt(input: EnhanceNotesDto): string {
    return `
      Enhance the following SOAP notes for clinical documentation quality:

      Subjective: ${input.subjective || 'Not provided'}
      Objective: ${input.objective || 'Not provided'}
      Assessment: ${input.assessment || 'Not provided'}
      Plan: ${input.plan || 'Not provided'}

      Enhancement type: ${input.enhancementType || 'full'}

      Please:
      1. Enhance each section with appropriate clinical detail
      2. Use standard medical terminology
      3. Suggest relevant ICD-10 codes
      4. Identify any documentation gaps
    `;
  }
}

export interface AnalyzePatientDto {
  patientInformation: Record<string, unknown>;
  symptoms: Array<{ description: string; severity?: number; duration?: string }>;
  medicalHistory?: string;
  currentMedications?: string;
}

export interface EnhanceNotesDto {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  enhancementType?: 'full' | 'minimal' | 'billing-focused';
}

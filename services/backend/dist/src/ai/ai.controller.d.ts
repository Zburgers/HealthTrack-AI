import { MastraService } from '../mastra/mastra.service';
export declare class AIController {
    private readonly mastraService;
    constructor(mastraService: MastraService);
    analyzePatient(input: AnalyzePatientDto): Promise<{
        analysis: string;
    }>;
    enhanceNotes(input: EnhanceNotesDto): Promise<{
        enhancedNotes: string;
    }>;
    private buildAnalysisPrompt;
    private buildEnhancePrompt;
}
export interface AnalyzePatientDto {
    patientInformation: Record<string, unknown>;
    symptoms: Array<{
        description: string;
        severity?: number;
        duration?: string;
    }>;
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

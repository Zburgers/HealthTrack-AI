'use server';

import { analyzePatientSymptoms, type AnalyzePatientSymptomsInput, type AnalyzePatientSymptomsOutput } from '@/ai/flows/analyze-patient-symptoms';

interface SubmitNewCaseResponse {
  success: boolean;
  data?: AnalyzePatientSymptomsOutput;
  error?: string;
}

export async function submitNewCase(data: AnalyzePatientSymptomsInput): Promise<SubmitNewCaseResponse> {
  try {
    // Here you would typically validate the input further if needed,
    // or interact with a database to store the initial case before analysis.
    
    const result = await analyzePatientSymptoms(data);
    
    // Potentially save the analysis result to a database here, associated with the case.
    // For now, we just return it.
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error analyzing patient symptoms:', error);
    // It's good practice to log the error on the server.
    // Avoid sending detailed internal error messages to the client unless necessary.
    return { success: false, error: (error instanceof Error ? error.message : 'An unknown error occurred during analysis.') };
  }
}

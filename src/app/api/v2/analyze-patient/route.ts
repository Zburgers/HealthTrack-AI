/**
 * Patient Analysis API using Vertex AI
 * 
 * Optimized endpoint for analyzing patient symptoms using Vertex AI workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzePatientSymptoms, AnalyzePatientSymptomsInputSchema } from '@/vertex-ai';

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await req.json();

    // Validate input
    const validationResult = AnalyzePatientSymptomsInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.format(),
        message: 'Please verify patient data format and try again.'
      }, { status: 400 });
    }

    // Use optimized Vertex AI workflow
    const result = await analyzePatientSymptoms(validationResult.data);
    const duration = Date.now() - startTime;

    // Log performance metrics
    console.log('[Vertex AI API] Patient analysis completed:', {
      duration,
      patientName: validationResult.data.patientName,
      riskScore: result.riskScore,
      icdCodesCount: result.icd10Tags.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ...result,
      metadata: {
        processingTime: duration,
        provider: 'vertex-ai',
        version: 'v2_optimized',
        analysisTimestamp: new Date().toISOString(),
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Vertex AI API] Patient analysis failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json({ 
      error: 'Failed to analyze patient symptoms', 
      details: errorMessage,
      provider: 'vertex-ai',
      retryable: true,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'patient-analysis',
    provider: 'vertex-ai',
    version: 'v2_optimized',
    capabilities: [
      'icd10_coding',
      'risk_assessment', 
      'soap_note_generation',
      'allergy_warnings',
      'medication_interactions'
    ],
    timestamp: new Date().toISOString(),
  });
}

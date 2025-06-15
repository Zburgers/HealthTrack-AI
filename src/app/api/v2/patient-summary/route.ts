/**
 * Patient Summary API using Vertex AI
 * 
 * Optimized endpoint for generating patient condition summaries
 */

import { NextRequest, NextResponse } from 'next/server';
import { summarizePatientCondition, SummarizePatientConditionInputSchema } from '@/vertex-ai';

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await req.json();

    // Validate input
    const validationResult = SummarizePatientConditionInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.format(),
        message: 'Please verify patient summary data format and try again.'
      }, { status: 400 });
    }

    // Use optimized Vertex AI workflow
    const result = await summarizePatientCondition(validationResult.data);
    const duration = Date.now() - startTime;

    // Log performance metrics
    console.log('[Vertex AI API] Patient summary completed:', {
      duration,
      keyFindingsCount: result.keyFindings.length,
      careSuggestionsCount: result.careSuggestions.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ...result,
      metadata: {
        processingTime: duration,
        provider: 'vertex-ai',
        version: 'v2_optimized',
        summaryTimestamp: new Date().toISOString(),
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Vertex AI API] Patient summary failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json({ 
      error: 'Failed to generate patient summary', 
      details: errorMessage,
      provider: 'vertex-ai',
      retryable: true,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'patient-summary',
    provider: 'vertex-ai',
    version: 'v2_optimized',
    capabilities: [
      'overall_assessment',
      'key_findings_analysis',
      'care_suggestions',
      'data_gap_identification',
      'medical_history_insights'
    ],
    timestamp: new Date().toISOString(),
  });
}

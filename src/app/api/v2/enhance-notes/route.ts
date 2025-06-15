/**
 * Enhanced Notes API using Vertex AI
 * 
 * This API endpoint uses the optimized Vertex AI workflows instead of Genkit
 * for better performance, monitoring, and cost efficiency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhanceSoapNotes, EnhanceSoapNotesInputSchema } from '@/vertex-ai';

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await req.json();

    // Validate input against the schema
    const validationResult = EnhanceSoapNotesInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.format(),
        message: 'Please check the input format and try again.'
      }, { status: 400 });
    }

    // Use the optimized Vertex AI workflow
    const result = await enhanceSoapNotes(validationResult.data);
    const duration = Date.now() - startTime;

    // Log performance metrics
    console.log('[Vertex AI API] SOAP enhancement completed:', {
      duration,
      inputSize: JSON.stringify(body).length,
      outputSize: JSON.stringify(result).length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ...result,
      metadata: {
        processingTime: duration,
        provider: 'vertex-ai',
        version: 'v2_optimized',
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Vertex AI API] SOAP enhancement failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const isVertexError = errorMessage.includes('Vertex AI');
    
    return NextResponse.json({ 
      error: 'Failed to enhance notes', 
      details: errorMessage,
      provider: 'vertex-ai',
      retryable: !isVertexError, // Only retry if it's not a Vertex AI specific error
    }, { status: 500 });
  }
}

// Optional: Add GET endpoint for health check
export async function GET() {
  try {
    // Simple health check
    return NextResponse.json({
      status: 'healthy',
      provider: 'vertex-ai',
      version: 'v2_optimized',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}

import { enhanceSoapNotes, EnhanceSoapNotesInputSchema } from '@/vertex-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await req.json();
    const validationResult = EnhanceSoapNotesInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.format(),
        message: 'Please check the input format and try again.'
      }, { status: 400 });
    }

    const output = await enhanceSoapNotes(validationResult.data);
    const duration = Date.now() - startTime;

    // Log performance metrics
    console.log('[Vertex AI API] SOAP enhancement completed:', {
      duration,
      inputSize: JSON.stringify(body).length,
      outputSize: JSON.stringify(output).length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ...output,
      metadata: {
        processingTime: duration,
        provider: 'vertex-ai',
        version: 'v1_migrated',
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
      retryable: !isVertexError,
    }, { status: 500 });
  }
}

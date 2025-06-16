/**
 * Patient Analysis API using Vertex AI
 * 
 * Optimized endpoint for analyzing patient symptoms using Vertex AI workflows
 */

// DEPRECATED: Use /api/v2/analyze-and-summarize instead.
import { NextRequest, NextResponse } from 'next/server';
import { analyzePatientSymptoms, AnalyzePatientSymptomsInputSchema } from '@/vertex-ai';
import { makeAICacheKey, getAICache, setAICache } from '@/lib/aiCache';

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'This endpoint is deprecated. Use /api/v2/analyze-and-summarize.' }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ error: 'This endpoint is deprecated. Use /api/v2/analyze-and-summarize.' }, { status: 410 });
}

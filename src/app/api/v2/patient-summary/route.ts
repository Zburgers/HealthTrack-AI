/**
 * Patient Summary API using Vertex AI
 * 
 * Optimized endpoint for generating patient condition summaries
 */

// DEPRECATED: Use /api/v2/analyze-and-summarize instead.
import { NextRequest, NextResponse } from 'next/server';
import { summarizePatientCondition, SummarizePatientConditionInputSchema } from '@/vertex-ai';
import { makeAICacheKey, getAICache, setAICache } from '@/lib/aiCache';

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'This endpoint is deprecated. Use /api/v2/analyze-and-summarize.' }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ error: 'This endpoint is deprecated. Use /api/v2/analyze-and-summarize.' }, { status: 410 });
}

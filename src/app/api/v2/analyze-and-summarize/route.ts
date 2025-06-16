import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeAndSummarizeInputSchema, analyzeAndSummarizePatient } from '@/ai/flows/analyze-and-summarize';
import { makeAICacheKey, getAICache, setAICache } from '@/lib/aiCache';
import stringify from 'json-stable-stringify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = AnalyzeAndSummarizeInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
    }
    const input = validation.data;
    const cacheKey = makeAICacheKey('analyze-and-summarize', stringify(input));
    const cached = await getAICache(cacheKey);
    if (cached) {
      console.log('[API AnalyzeAndSummarize] Cache hit:', cacheKey);
      return NextResponse.json(cached, { status: 200 });
    }
    const result = await analyzeAndSummarizePatient(input);
    await setAICache(cacheKey, 'analyze-and-summarize', input, result, 24 * 60 * 60 * 1000);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[API AnalyzeAndSummarize] Error:', error);
    return NextResponse.json({ error: 'Failed to analyze and summarize', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 
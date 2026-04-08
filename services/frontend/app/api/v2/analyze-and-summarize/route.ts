import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for Analyze and Summarize - DEPRECATED
 *
 * This endpoint previously used Genkit flows. It has been migrated to the
 * NestJS backend with Mastra agents. Please use the backend API instead.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: 'This endpoint has been migrated to the NestJS backend.',
      message: 'AI analysis features are now available via the backend Mastra agents.',
    },
    { status: 410 },
  );
} 
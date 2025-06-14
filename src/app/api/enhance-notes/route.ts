import { enhanceSoapNotesFlow, EnhanceSoapNotesInputSchema } from '@/ai/flows/enhance-notes';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = EnhanceSoapNotesInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.format() }, { status: 400 });
    }

    const output = await enhanceSoapNotesFlow(validationResult.data);
    return NextResponse.json(output, { status: 200 });

  } catch (error) {
    console.error('Error in enhance-notes API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to enhance notes', details: errorMessage }, { status: 500 });
  }
}

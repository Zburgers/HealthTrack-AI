import { NextResponse } from 'next/server';

const errorMessage = {
  error: 'This API endpoint is deprecated.',
  message: 'Database operations must be initiated from the client application via IPC.',
};

/**
 * API Route for Local Embeddings by ID - DEPRECATED
 *
 * This endpoint is disabled. In the HealthTrackAI Electron application, all database
 * operations are handled securely by the Electron main process. This functionality
 * should be triggered from the client-side UI, which uses IPC to communicate.
 */
export async function GET() {
  return NextResponse.json(errorMessage, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json(errorMessage, { status: 403 });
}


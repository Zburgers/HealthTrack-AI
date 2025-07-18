import { NextResponse } from 'next/server';

/**
 * API Route for Database Testing - DEPRECATED
 *
 * This endpoint is disabled. In the HealthTrackAI Electron application, database
 * tests should be executed in the main process environment, not via a Next.js API route.
 * This functionality can be triggered from a developer menu in the client-side UI,
 * which would use an IPC call to request the main process to run the tests.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated.',
      message: 'Database tests must be initiated from the client application via IPC.',
    },
    { status: 403 }
  );
}


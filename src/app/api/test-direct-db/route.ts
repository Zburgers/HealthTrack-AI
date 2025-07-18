import { NextResponse } from 'next/server';

/**
 * API Route for Direct DB Test - DEPRECATED
 *
 * This endpoint is disabled. It was originally created to demonstrate an incorrect
 * architectural pattern. In the HealthTrackAI Electron application, all database
 * operations are handled securely by the Electron main process via IPC.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated.',
      message: 'This endpoint is disabled and was for demonstration purposes only. Use the IPC bridge for all database operations.',
    },
    { status: 403 }
  );
}


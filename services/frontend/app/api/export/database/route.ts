import { NextResponse } from 'next/server';

/**
 * API Route for Database Export - DEPRECATED
 *
 * This endpoint is disabled. In the HealthTrackAI Electron application, database
 * operations like exporting are handled securely by the Electron main process, not by
 * a Next.js API route. This functionality should be triggered from the client-side UI,
 * which will use an IPC call to request the main process to perform the export.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated.',
      message: 'Database exports must be initiated from the client application via IPC.',
    },
    { status: 403 } // 403 Forbidden is appropriate here
  );
}


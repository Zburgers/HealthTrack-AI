import { NextResponse } from 'next/server';

/**
 * API Route for IPC DB Test - DEPRECATED
 *
 * This endpoint is disabled. It was originally created to demonstrate the correct
 * architectural pattern for database access in an Electron/Next.js application.
 * In the refactored architecture, all database operations are initiated from client
 * components via the IPC bridge defined in `src/lib/db/index.ts`.
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


import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Return an empty list of error reports
  return NextResponse.json({ reports: [] }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const report = await req.json();
    console.log('[API error-reports] Received report:', report);
    // For MVP, just acknowledge receipt
    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (e) {
    console.error('[API error-reports] Error parsing request:', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
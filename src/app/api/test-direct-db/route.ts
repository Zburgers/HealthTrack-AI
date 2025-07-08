/**
 * ⚠️ ARCHITECTURAL CONSTRAINT DEMONSTRATION ⚠️
 * 
 * This file demonstrates the INCORRECT approach to SQLite access in Electron apps.
 * Next.js API routes should NOT try to access SQLite directly due to the Node.js version mismatch.
 * 
 * ✅ CORRECT PATTERN:
 * 1. SQLite database lives ONLY in Electron main process
 * 2. Access database ONLY through IPC channels from renderer process
 * 3. Next.js API routes should provide data to renderer, not access SQLite directly
 * 
 * See src/app/api/test-ipc-db/route.ts for the correct approach.
 */

import { NextResponse } from 'next/server';
import { isElectronEnvironment } from '@/lib/db';

export async function GET() {
  try {
    const isElectron = isElectronEnvironment();
    console.log(`🧪 [TEST_DIRECT_DB] Starting direct database test in ${isElectron ? 'Electron' : 'Web'} environment`);
    
    // If not in Electron, we should return an error
    if (!isElectron) {
      return NextResponse.json({
        success: false,
        message: 'Direct database test is only available in Electron environment',
        environment: 'web'
      });
    }
    
    // Return a message explaining the architectural constraint
    return NextResponse.json({
      success: false,
      message: '❌ ARCHITECTURAL CONSTRAINT: API routes should NOT access SQLite directly',
      error: 'SQLite can only be accessed from Electron main process via IPC.',
      correctPattern: 'See /api/test-ipc-db for the correct architecture',
      reason: 'Node.js version mismatch between Next.js and Electron prevents direct access',
      solution: 'Use window.ipcRenderer.invoke("sqlite-operation", ...) from client components'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ [TEST_DIRECT_DB] Test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Direct database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

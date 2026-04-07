import { NextResponse } from 'next/server';
import { isElectronEnvironment } from '@/lib/mongodb/config';

/**
 * Health check endpoint
 * 
 * This API provides status information about the application.
 * Database health must be checked from the renderer process via IPC.
 */
export async function GET() {
  try {
    const isElectron = isElectronEnvironment();
    const timestamp = new Date().toLocaleString();
    
    // Basic health check
    const healthData: any = {
      status: 'ok',
      timestamp,
      environment: isElectron ? 'electron' : 'web',
      nextjs: {
        status: 'running',
        mode: process.env.NODE_ENV
      },
      database: {
        type: isElectron ? 'sqlite' : 'mongodb',
        status: 'check-in-renderer',
        checkCommand: 'window.ipcRenderer.invoke("db:health")'
      }
    };

    // Provide guidance on correct architecture
    if (isElectron) {
      // In Electron environment, database access is only available via IPC from renderer
      healthData.database.message = 'SQLite health can only be checked from renderer process via IPC';
      healthData.database.architecture = {
        correct: 'Use window.ipcRenderer.invoke("db:health") from client components',
        constraint: 'Node.js version mismatch prevents direct SQLite access from Next.js API routes'
      };
    } else {
      // In web environment, we could check MongoDB connection
      healthData.database.status = 'web-mode';
      healthData.database.message = 'MongoDB connection check would be implemented here in web mode';
    }

    console.log(`🏥 [HEALTH_CHECK] ${JSON.stringify(healthData)}`);
    return NextResponse.json(healthData);
    
  } catch (error) {
    console.error('❌ [HEALTH_CHECK] Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

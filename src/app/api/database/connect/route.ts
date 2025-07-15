/**
 * @api {post} /api/database/connect
 * @description Explicitly connects to the MongoDB database using the provided URI
 * or the URI stored in settings.
 *
 * @returns {NextResponse} A Next.js response object with the connection result.
 *   - Success (200): { success: true, connected: true, uri: "..." }
 *   - Failed (500): { success: false, error: "..." }
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getConnectionStatus, initializeDatabaseConnections } from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'healthtrack-settings.json');

export async function POST(request: NextRequest) {
  try {
    console.log('📊 [API] POST /api/database/connect - Explicitly connecting to MongoDB');
    
    // Get URI from request body or settings file
    let mongoUri: string | undefined;
    
    try {
      const body = await request.json();
      mongoUri = body.mongoUri;
    } catch (e) {
      // If body parsing fails, try to get URI from settings
      console.log('📊 [API] No URI provided in request body, checking settings file');
    }
    
    if (!mongoUri) {
      try {
        const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
        const settings = JSON.parse(data);
        mongoUri = settings.mongoUri;
        console.log('📊 [API] Found URI in settings file');
      } catch (error) {
        console.error('📊 [API] Error reading settings file:', error);
      }
    }
    
    if (!mongoUri) {
      return NextResponse.json(
        { success: false, error: 'No MongoDB URI provided or found in settings' },
        { status: 400 }
      );
    }
    
    console.log('📊 [API] Attempting to connect to MongoDB');
    
    // Initialize both database connections
    await initializeDatabaseConnections();
    
    // Get the final connection status
    const status = getConnectionStatus();
    console.log('📊 [API] Connection status after initialization:', status);
    
    if (status.connected) {
      return NextResponse.json({
        success: true,
        connected: true,
        uri: status.uri,
        caseEmbeddingsConnected: status.caseEmbeddingsConnected
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to connect to MongoDB' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('📊 [API] Error connecting to MongoDB:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to MongoDB',
        details: error.message
      },
      { status: 500 }
    );
  }
}

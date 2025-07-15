/**
 * @api {get} /api/database/status
 * @description Retrieves the current status of the MongoDB connection.
 * If not connected but a saved URI exists, it attempts to establish connection.
 *
 * @returns {NextResponse} A Next.js response object with the connection status.
 *   - If connected (200): { connected: true, uri: "...", collections: [...], lastConnected: "..." }
 *   - If not connected (200): { connected: false }
 *   - On error (500): { error: "..." }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getConnectionStatus, getClient, connectToDatabase, connectToCaseEmbeddingsDatabase } from '@/lib/mongodb/connection';
import '@/lib/mongodb/debug'; // Import enhanced debugging
import { promises as fs } from 'fs';
import path from 'path';

let lastConnected: string | null = null;
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'healthtrack-settings.json');

// Helper function to get MongoDB URI from settings
async function getMongoUriFromSettings(): Promise<string | undefined> {
  try {
    const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    const settings = JSON.parse(data);
    return settings.mongoUri;
  } catch (error) {
    // File might not exist, which is fine.
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [API] GET /api/database/status - Checking database connection status');
    let status = getConnectionStatus();
    console.log('📊 [API] Current connection status:', status);
    
    // If not connected but we have a saved URI, try to connect
    if (!status.connected) {
      const savedUri = await getMongoUriFromSettings();
      if (savedUri) {
        console.log('📊 [API] Found saved URI in settings, attempting to connect...');
        try {
          await connectToDatabase(savedUri);
          status = getConnectionStatus(); // Refresh status after connection attempt
          console.log('📊 [API] Main database connection result:', status.connected ? 'Connected' : 'Failed');
          
          // Also check for case embeddings database connection
          if (process.env.MONGODB_URI) {
            console.log('📊 [API] Found case embeddings URI in environment, attempting to connect...');
            try {
              await connectToCaseEmbeddingsDatabase();
              // Refresh status after both connections
              status = getConnectionStatus();
              console.log('📊 [API] Case embeddings connection result:', 
                status.caseEmbeddingsConnected ? 'Connected' : 'Failed');
            } catch (embeddingsError) {
              console.warn('📊 [API] Case embeddings database connection failed:', embeddingsError);
              // Don't fail the entire connection - this is optional
              status = getConnectionStatus();
            }
          }
        } catch (error) {
          console.error('📊 [API] Failed to connect using saved URI:', error);
        }
      } else {
        console.log('📊 [API] No saved MongoDB URI found in settings');
      }
    } else {
      console.log('📊 [API] Already connected to MongoDB');
    }

    if (status.connected) {
      if (!lastConnected) {
        lastConnected = new Date().toISOString();
      }
      
      // Get collection info for the response
      const client = getClient();
      console.log('📊 [API] Fetching collection list from database');
      const collections = await client.db().listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log(`📊 [API] Found ${collectionNames.length} collections`);

      console.log('📊 [API] Returning successful connection status');
      return NextResponse.json({
        connected: true,
        uri: status.uri,
        collections: collectionNames,
        lastConnected: lastConnected,
        caseEmbeddingsConnected: status.caseEmbeddingsConnected
      });
    } else {
      lastConnected = null; // Reset when not connected
      console.log('📊 [API] Returning disconnected status');
      return NextResponse.json({ connected: false });
    }
  } catch (error: any) {
    console.error('📊 [API] Error fetching database status:', error);
    return NextResponse.json(
      { 
        connected: false, 
        error: 'Failed to retrieve database status.', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

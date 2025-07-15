/**
 * MongoDB Database Initializer
 * 
 * This module handles automatic database initialization during application startup.
 * It attempts to establish connections to:
 * 1. The main database using the URI from healthtrack-settings.json
 * 2. The case embeddings database using the URI from environment variables
 */
import { connectToDatabase, connectToCaseEmbeddingsDatabase, getConnectionStatus } from './connection';
import { checkAllConnections } from './debug';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'healthtrack-settings.json');

/**
 * Gets the MongoDB URI from the settings file
 */
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

/**
 * Initializes all database connections automatically
 */
export async function initializeDatabaseConnections(): Promise<boolean> {
  console.log('🚀 [DATABASE] Initializing database connections');
  const results = {
    mainConnected: false,
    caseEmbeddingsConnected: false
  };

  // Connect to main database (from settings file)
  try {
    const mongoUri = await getMongoUriFromSettings();
    if (mongoUri) {
      console.log('📊 [DATABASE] Found MongoDB URI in settings, connecting to main database...');
      await connectToDatabase(mongoUri);
      results.mainConnected = true;
      console.log('✅ [DATABASE] Successfully connected to main database');
    } else {
      console.log('ℹ️ [DATABASE] No MongoDB URI found in settings file. Skipping main database connection.');
    }
  } catch (error) {
    console.error('❌ [DATABASE] Error connecting to main database:', error);
  }

  // Connect to case embeddings database (from environment variables)
  try {
    if (process.env.MONGODB_URI) {
      console.log('📊 [DATABASE] Found case embeddings URI in environment, connecting...');
      await connectToCaseEmbeddingsDatabase();
      results.caseEmbeddingsConnected = true;
      console.log('✅ [DATABASE] Successfully connected to case embeddings database');
    } else {
      console.log('ℹ️ [DATABASE] No case embeddings URI found in environment. Skipping connection.');
    }
  } catch (error) {
    console.error('❌ [DATABASE] Error connecting to case embeddings database:', error);
  }

  // Get final status
  const status = getConnectionStatus();
  console.log('📊 [DATABASE] Final connection status:', {
    mainConnected: status.connected,
    mainUri: status.uri,
    caseEmbeddingsConnected: status.caseEmbeddingsConnected,
    caseEmbeddingsUri: status.caseEmbeddingsUri
  });

  // Log more detailed connection info using the debug module
  try {
    await checkAllConnections();
  } catch (error) {
    console.error('❌ [DATABASE] Error checking connection details:', error);
  }

  return results.mainConnected || results.caseEmbeddingsConnected;
}

// Schedule connection check to run periodically (every 5 minutes)
let connectionCheckInterval: NodeJS.Timeout | null = null;

export function startPeriodicConnectionChecks(intervalMs = 5 * 60 * 1000): void {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  console.log(`📊 [DATABASE] Setting up periodic connection checks (every ${intervalMs/1000} seconds)`);
  
  connectionCheckInterval = setInterval(async () => {
    console.log('📊 [DATABASE] Running scheduled connection check');
    await checkAllConnections();
  }, intervalMs);
}

export function stopPeriodicConnectionChecks(): void {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
    console.log('📊 [DATABASE] Stopped periodic connection checks');
  }
}

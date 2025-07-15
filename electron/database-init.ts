/**
 * Database Initialization Module
 * 
 * This module provides functions for initializing MongoDB connections
 * from the Electron main process.
 */
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

/**
 * Interface for database status response
 */
interface DatabaseStatusResponse {
  connected: boolean;
  uri?: string;
  collections?: string[];
  caseEmbeddingsConnected?: boolean;
  error?: string;
}

/**
 * Path to settings file
 */
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'healthtrack-settings.json');

/**
 * Check if settings file contains MongoDB URI
 */
export function hasMongoDbUri(): boolean {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, 'utf8'));
      return !!settings.mongoUri;
    }
  } catch (error) {
    console.error('❌ [DATABASE] Error reading settings file:', error);
  }
  return false;
}

/**
 * Initialize MongoDB connection by calling the API endpoint
 * This approach uses the API layer to ensure consistency with the Next.js app
 */
export async function initializeMongoDBConnection(baseUrl: string): Promise<boolean> {
  console.log('📊 [DATABASE] Initializing MongoDB connections via API...');
  
  if (!hasMongoDbUri()) {
    console.log('ℹ️ [DATABASE] No MongoDB URI found in settings. Skipping automatic connection.');
    return false;
  }
  
  try {
    // First call the database/status endpoint to trigger connections
    const statusUrl = `${baseUrl}/api/database/status`;
    console.log(`📊 [DATABASE] Calling API to check database status: ${statusUrl}`);
    
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json() as DatabaseStatusResponse;
    
    if (statusData.connected) {
      console.log('✅ [DATABASE] Successfully connected to MongoDB via API');
      console.log(`📊 [DATABASE] Connected to: ${statusData.uri || 'unknown'}`);
      
      if (statusData.collections?.length) {
        console.log(`📊 [DATABASE] Available collections: ${statusData.collections.join(', ')}`);
      }
      
      if (statusData.caseEmbeddingsConnected) {
        console.log('✅ [DATABASE] Case embeddings database also connected');
      }
      
      return true;
    } else {
      console.log('⚠️ [DATABASE] Not connected according to status endpoint');
      
      // If not connected, try to force a connection
      const connectUrl = `${baseUrl}/api/database/connect`;
      console.log(`📊 [DATABASE] Attempting to connect via API: ${connectUrl}`);
      
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, 'utf8'));
      const connectResponse = await fetch(connectUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mongoUri: settings.mongoUri })
      });
      
      const connectData = await connectResponse.json() as {
        success: boolean;
        error?: string;
      };
      
      if (connectData.success) {
        console.log('✅ [DATABASE] Successfully connected to MongoDB via connect endpoint');
        return true;
      } else {
        console.error('❌ [DATABASE] Failed to connect to MongoDB:', connectData.error);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ [DATABASE] Error initializing MongoDB connection:', error);
    return false;
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(baseUrl: string): Promise<void> {
  try {
    const url = `${baseUrl}/api/database/status`;
    console.log(`📊 [DATABASE] Checking database health: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json() as DatabaseStatusResponse;
    
    if (data.connected) {
      console.log('✅ [DATABASE] Database health check passed');
    } else {
      console.log('⚠️ [DATABASE] Database health check failed, not connected');
    }
  } catch (error) {
    console.error('❌ [DATABASE] Error checking database health:', error);
  }
}

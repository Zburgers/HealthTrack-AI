/**
 * Enhanced debugging for the database connection flow
 * This adds detailed logging to help trace connection issues
 */
import { MongoClient } from 'mongodb';
import { 
  connectToDatabase as originalConnectToDatabase,
  connectToCaseEmbeddingsDatabase as originalConnectToCaseEmbeddingsDatabase, 
  getConnectionStatus as originalGetConnectionStatus,
  getClient, 
  getDb,
  getEmbeddingsClient,
  getEmbeddingsDb
} from './connection';

// Variables to track connection states
let isMonitoring = false;
let mainLastChecked: Date | null = null;
let embeddingsLastChecked: Date | null = null;

// Decorator for logging database connection attempts
export function withConnectionLogging<T extends (...args: any[]) => Promise<MongoClient>>(fn: T, name: string): T {
  return (async (...args: any[]) => {
    console.log(`📊 [CONNECTION] Attempting ${name} database connection...`);
    try {
      const client = await fn(...args);
      console.log(`✅ [CONNECTION] ${name} database connection successful`);
      return client;
    } catch (error) {
      console.error(`❌ [CONNECTION] ${name} database connection failed:`, error);
      throw error;
    }
  }) as T;
}

// Usage example (not exported by default):
export const connectToDatabaseWithLogging = withConnectionLogging(originalConnectToDatabase, 'main');
export const connectToCaseEmbeddingsDatabaseWithLogging = withConnectionLogging(originalConnectToCaseEmbeddingsDatabase, 'case embeddings');

// Decorator for logging connection status
export function withStatusLogging<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    const status = fn(...args);
    console.log('🔍 [STATUS] Database connection status:', {
      mainConnected: status.connected,
      mainUri: status.uri,
      caseEmbeddingsConnected: status.caseEmbeddingsConnected,
      caseEmbeddingsUri: status.caseEmbeddingsUri
    });
    return status;
  }) as T;
}

// Usage example (not exported by default):
export const getConnectionStatusWithLogging = withStatusLogging(originalGetConnectionStatus);

/**
 * Checks if a MongoDB client is connected and operational.
 * 
 * @param client The MongoDB client to check
 * @param name The name of the connection for logging purposes
 * @returns Boolean indicating if connection is alive
 */
export async function checkConnection(client: MongoClient | null, name: string): Promise<boolean> {
  if (!client) {
    console.log(`ℹ️ [MONGODB_DEBUG] ${name} client is null`);
    return false;
  }

  try {
    const pingResult = await client.db().admin().ping();
    const isAlive = !!pingResult.ok;
    console.log(`${isAlive ? '✅' : '❌'} [MONGODB_DEBUG] ${name} connection status: ${isAlive ? 'Alive' : 'Dead'}`);
    return isAlive;
  } catch (error) {
    console.error(`❌ [MONGODB_DEBUG] Error checking ${name} connection:`, error);
    return false;
  }
}

/**
 * Checks all MongoDB connections and logs their status
 */
export async function checkAllConnections(): Promise<{
  mainConnected: boolean;
  embeddingsConnected: boolean;
}> {
  console.log('📊 [MONGODB_DEBUG] Checking all MongoDB connections...');
  
  // Try to get clients without throwing errors
  let mainClient = null;
  let embeddingsClient = null;
  
  try {
    mainClient = getClient();
  } catch (error) {
    console.log('ℹ️ [MONGODB_DEBUG] Main database client not initialized');
  }
  
  try {
    embeddingsClient = getEmbeddingsClient();
  } catch (error) {
    console.log('ℹ️ [MONGODB_DEBUG] Embeddings database client not initialized');
  }
  
  // Check connection status
  const mainConnected = await checkConnection(mainClient, 'Main database');
  const embeddingsConnected = await checkConnection(embeddingsClient, 'Case embeddings');
  
  // Update last checked timestamps
  mainLastChecked = mainConnected ? new Date() : mainLastChecked;
  embeddingsLastChecked = embeddingsConnected ? new Date() : embeddingsLastChecked;
  
  // Log overall status
  console.log('📊 [MONGODB_DEBUG] Connection status summary:', {
    mainConnected,
    embeddingsConnected,
    mainLastChecked: mainLastChecked ? mainLastChecked.toISOString() : null,
    embeddingsLastChecked: embeddingsLastChecked ? embeddingsLastChecked.toISOString() : null
  });
  
  return {
    mainConnected,
    embeddingsConnected
  };
}

// Re-export other methods
export { 
  getClient, 
  getDb, 
  getEmbeddingsClient, 
  getEmbeddingsDb 
};
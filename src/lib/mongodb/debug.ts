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

// Add connection logging to the connection helper
export const connectToDatabase = async (uri?: string): Promise<MongoClient> => {
  console.log('📊 [CONNECTION] Attempting main database connection...');
  try {
    const client = await originalConnectToDatabase(uri);
    console.log('✅ [CONNECTION] Main database connection successful');
    return client;
  } catch (error) {
    console.error('❌ [CONNECTION] Main database connection failed:', error);
    throw error;
  }
};

// Add connection logging to the case embeddings connection helper
export const connectToCaseEmbeddingsDatabase = async (): Promise<MongoClient> => {
  console.log('📊 [CONNECTION] Attempting case embeddings database connection...');
  try {
    const client = await originalConnectToCaseEmbeddingsDatabase();
    console.log('✅ [CONNECTION] Case embeddings database connection successful');
    return client;
  } catch (error) {
    console.error('❌ [CONNECTION] Case embeddings database connection failed:', error);
    throw error;
  }
};

// Add status debugging to getConnectionStatus
export const getConnectionStatus = () => {
  const status = originalGetConnectionStatus();
  console.log('🔍 [STATUS] Database connection status:', {
    mainConnected: status.connected,
    mainUri: status.uri,
    caseEmbeddingsConnected: status.caseEmbeddingsConnected,
    caseEmbeddingsUri: status.caseEmbeddingsUri
  });
  return status;
};

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
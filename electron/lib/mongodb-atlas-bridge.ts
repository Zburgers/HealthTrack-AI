/**
 * MongoDB Connection Bridge
 * 
 * This module provides access to the MongoDB connection utilities
 * from within the Electron main process while respecting TypeScript
 * module boundaries.
 */

// Since we can't directly import from src/ in electron/, we'll re-export
// the needed functionality or create our own MongoDB Atlas connection logic

import { MongoClient, Db } from 'mongodb';

// MongoDB Atlas connection state
let atlasClient: MongoClient | null = null;
let atlasDb: Db | null = null;
let atlasConnectedUri: string | null = null;

/**
 * Connect to MongoDB Atlas with the provided URI
 */
export async function connectToAtlas(uri: string): Promise<MongoClient> {
  // If already connected to the same URI, return existing client
  if (atlasClient && atlasConnectedUri === uri) {
    console.log('📊 [ATLAS-BRIDGE] Using existing Atlas connection');
    return atlasClient;
  }

  // Close existing connection if connecting to different URI
  if (atlasClient) {
    console.log('📊 [ATLAS-BRIDGE] Closing previous Atlas connection');
    await atlasClient.close();
    atlasClient = null;
    atlasDb = null;
    atlasConnectedUri = null;
  }

  try {
    console.log('📊 [ATLAS-BRIDGE] Connecting to Atlas...');
    
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Increased from 5000ms to 30000ms
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Add explicit connect timeout
      retryWrites: true, // Enable retry writes
      retryReads: true, // Enable retry reads
      maxIdleTimeMS: 300000, // 5 minutes
      heartbeatFrequencyMS: 10000,
      // Add specific options for Atlas connections
      tls: true, // Ensure TLS is enabled for Atlas
      tlsInsecure: false,
      directConnection: false, // Allow driver to connect to replica set
    });
    
    await client.connect();
    
    // Test the connection with a simple ping
    await client.db().admin().ping();
    
    atlasClient = client;
    atlasDb = client.db(); // Use default database from URI
    atlasConnectedUri = uri;
    
    console.log('✅ [ATLAS-BRIDGE] Successfully connected to Atlas');
    return client;
  } catch (error) {
    console.error('❌ [ATLAS-BRIDGE] Failed to connect to Atlas:', error);
    
    // Add specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('Server selection timed out')) {
        console.error('💡 [ATLAS-BRIDGE] Possible causes: Network connectivity, IP whitelist, or incorrect URI');
      } else if (error.message.includes('Authentication failed')) {
        console.error('💡 [ATLAS-BRIDGE] Check username/password in connection string');
      } else if (error.message.includes('bad auth')) {
        console.error('💡 [ATLAS-BRIDGE] Invalid authentication credentials');
      }
    }
    
    throw error;
  }
}

/**
 * Get the current Atlas database instance
 */
export function getAtlasDb(): Db {
  if (!atlasDb) {
    throw new Error('Atlas database not connected. Call connectToAtlas first.');
  }
  return atlasDb;
}

/**
 * Get the current Atlas client instance
 */
export function getAtlasClient(): MongoClient {
  if (!atlasClient) {
    throw new Error('Atlas client not connected. Call connectToAtlas first.');
  }
  return atlasClient;
}

/**
 * Disconnect from Atlas
 */
export async function disconnectFromAtlas(): Promise<void> {
  if (atlasClient) {
    console.log('📊 [ATLAS-BRIDGE] Disconnecting from Atlas...');
    await atlasClient.close();
    atlasClient = null;
    atlasDb = null;
    atlasConnectedUri = null;
    console.log('✅ [ATLAS-BRIDGE] Disconnected from Atlas');
  }
}

/**
 * Check if Atlas is connected
 */
export function isAtlasConnected(): boolean {
  return atlasClient !== null && atlasDb !== null;
}

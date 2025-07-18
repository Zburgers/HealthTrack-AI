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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    
    atlasClient = client;
    atlasDb = client.db(); // Use default database from URI
    atlasConnectedUri = uri;
    
    console.log('✅ [ATLAS-BRIDGE] Successfully connected to Atlas');
    return client;
  } catch (error) {
    console.error('❌ [ATLAS-BRIDGE] Failed to connect to Atlas:', error);
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

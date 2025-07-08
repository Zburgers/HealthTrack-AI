/**
 * MongoDB Connection Module - Universal Database Framework
 * 
 * This module provides seamless access to both local and remote databases
 * without requiring changes to existing API routes. It automatically detects
 * the environment and routes database operations accordingly.
 */

import { UniversalMongoClient, initializeDatabaseFramework } from './mongodb/framework';

// Global client instance for backward compatibility
let universalClient: UniversalMongoClient | null = null;

/**
 * Main connection function that works in all environments
 * Automatically connects to local database in Electron, remote in web
 */
export async function connectToDatabase() {
  if (universalClient) {
    return universalClient;
  }

  try {
    universalClient = await initializeDatabaseFramework();
    console.log("✅ Successfully connected to database (universal framework)");
    return universalClient;
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    throw error;
  }
}

/**
 * Legacy verification function for backward compatibility
 */
export async function verifyDatabaseConnection() {
  try {
    await connectToDatabase();
    console.log("✅ Database connection verified successfully via universal framework");
  } catch (error) {
    console.error("❌ Database connection verification failed:", error);
    throw error;
  }
}

// Re-export all the existing exports from the mongodb/index.ts file
export * from './mongodb/index';

// Re-export framework components for advanced usage
export { 
  UniversalMongoClient, 
  initializeDatabaseFramework 
} from './mongodb/framework';

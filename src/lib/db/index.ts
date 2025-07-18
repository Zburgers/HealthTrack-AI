// src/lib/db/index.ts
// =======================
// Frontend Database Bridge
//
// This module provides a unified, safe way for the Next.js frontend (client and server-side)
// to interact with the database. It determines the environment and routes all database
// requests through the Electron IPC bridge, ensuring the main process is the single
// source of truth for data access.

import { IQuery } from '../../../electron/lib/datasources/IDataSource';
import { Patient } from '@/types';

/**
 * Checks if the code is running in the Electron renderer process.
 * This is the only environment where IPC is available.
 */
export function isElectronEnvironment(): boolean {
  // Check if window and ipcRenderer are available
  return typeof window !== 'undefined' && !!window.ipcRenderer;
}

/**
 * The core database query function for the frontend.
 * All database operations, regardless of where they originate in the frontend,
 * must go through this function.
 *
 * @param query The IQuery object describing the operation.
 * @returns A promise that resolves with the result from the main process.
 */
async function queryDatabase<T>(query: IQuery): Promise<T> {
  if (!isElectronEnvironment()) {
    // This code is running in a standard Node.js environment (e.g., Next.js build process)
    // or a browser without Electron's preload script. Return a mock error or empty state.
    console.warn(`[DB Bridge] Attempted to query database outside of Electron environment. Query: ${query.type}`);
    // Depending on the query, you might want to return null, an empty array, or throw.
    // For now, we throw to make it obvious that this path was taken.
    throw new Error('Database operations are only available within the Electron application.');
  }
  return window.ipcRenderer.invoke('db:query', query);
}

// Collection-based helper functions that wrap the core query function
// This provides a more convenient API for the rest of the frontend code.

const createCollection = (collectionName: string) => ({
  findOne: (filter: Record<string, unknown>) => 
    queryDatabase({ type: `${collectionName}.findOne`, params: { filter } }),

  find: (filter: Record<string, unknown> = {}, options: Record<string, unknown> = {}) => 
    queryDatabase({ type: `${collectionName}.find`, params: { filter, options } }),

  insertOne: (document: Record<string, unknown>) => 
    queryDatabase({ type: `${collectionName}.insertOne`, params: { document } }),

  updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>, options: Record<string, unknown> = {}) => 
    queryDatabase({ type: `${collectionName}.updateOne`, params: { filter, update, options } }),

  deleteOne: (filter: Record<string, unknown>) => 
    queryDatabase({ type: `${collectionName}.deleteOne`, params: { filter } }),
});

/**
 * A mock "Db" object that provides a familiar, collection-based API.
 * This is a compatibility layer to minimize refactoring in the calling code.
 * It does not hold a real database connection.
 */
const db = {
  collection: (name: string) => createCollection(name),

  /**
   * Finds similar cases using the main process's vector search capabilities.
   * @param params The patient data and optional filters.
   * @returns A promise that resolves with an array of similar cases.
   */
  findSimilarCases: (params: { patientData: Patient; filters?: Record<string, unknown> }) => {
    if (!isElectronEnvironment()) {
      throw new Error('Database operations are only available within the Electron application.');
    }
    return window.ipcRenderer.invoke('db:findSimilarCases', params);
  },
};

/**
 * The main function to get access to the database API from the frontend.
 * Replaces the old direct-connection `getDb`.
 */
export function getDb() {
  return db;
}

// Exporting other functions and types that might be needed for compatibility
// These are mostly placeholders now.
export const isLocalCollection = (collectionName: string): boolean => {
  // In the new architecture, the frontend doesn't know or care.
  // We can assume everything is handled by the main process.
  console.warn(`[DB Bridge] Deprecated call to isLocalCollection for '${collectionName}'.`);
  return false; // Or true, depending on what the legacy code expects.
};

// Mock adapters for type compatibility if needed by old test files.
export class SQLiteDatabaseAdapter {}
export class MongoDBDatabaseAdapter {}
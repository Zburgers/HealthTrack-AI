// src/lib/db/index.ts
// =======================
// Frontend Database Bridge
//
// This module provides a unified way for the Next.js frontend to interact
// with the MongoDB database via API routes.

import { Patient } from '@/types';

/**
 * Checks if the code is running in an Electron environment.
 * Always returns false in a web-only app.
 */
export function isElectronEnvironment(): boolean {
  return false;
}

/**
 * The core database query function for the frontend.
 * Routes queries through API endpoints in a web-first architecture.
 */
async function queryDatabase<T>(query: { type: string; params: Record<string, unknown> }): Promise<T> {
  // Route through API endpoints
  const response = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new Error(`Database query failed: ${response.statusText}`);
  }

  return response.json();
}

// Collection-based helper functions that wrap the core query function
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
 */
const db = {
  collection: (name: string) => createCollection(name),

  /**
   * Finds similar cases using the backend's vector search capabilities.
   */
  findSimilarCases: async (params: { patientData: Patient; filters?: Record<string, unknown> }) => {
    const response = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'findSimilarCases', params }),
    });

    if (!response.ok) {
      throw new Error(`Find similar cases failed: ${response.statusText}`);
    }

    return response.json();
  },
};

/**
 * The main function to get access to the database API from the frontend.
 */
export function getDb() {
  return db;
}

/**
 * Check if a collection is considered local (for backward compatibility).
 * In a web-first architecture, all collections are remote.
 */
export const isLocalCollection = (_collectionName: string): boolean => {
  return false;
};

// Placeholder adapters for type compatibility with legacy test files.
export class SQLiteDatabaseAdapter {}
export class MongoDBDatabaseAdapter {}

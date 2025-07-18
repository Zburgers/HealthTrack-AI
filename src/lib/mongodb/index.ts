/**
 * MongoDB Module - Unified Database Interface
 * 
 * This module provides a single entry point for all database operations,
 * automatically routing to local or remote databases based on environment
 * and collection configuration.
 */

import { Db, Collection, Document, Filter, FindOptions, UpdateFilter, UpdateOptions, InsertOneResult, UpdateResult, DeleteResult, OptionalUnlessRequiredId } from 'mongodb';
import { 
  COLLECTIONS, 
  getDatabaseTarget, 
  isElectronEnvironment,
  isValidCollection,
  type CollectionName,
} from './config';

// Import connection modules
import { 
  connectToRemoteDatabase, 
  getRemoteDatabase, 
  isRemoteDatabaseConnected 
} from './remote';

// Import connection/initializer modules
import {
  connectToDatabase,
  connectToCaseEmbeddingsDatabase,
  getConnectionStatus,
} from './connection';

// Import initializer functions
import {
  initializeDatabaseConnections,
  startPeriodicConnectionChecks,
  stopPeriodicConnectionChecks,
} from './initializer';

// Import debug utilities
import { checkAllConnections } from './debug';

// Import IPC modules for backward compatibility
import { 
  isElectronIPCAvailable,
  findOneViaIPC,
  findViaIPC,
  insertOneViaIPC,
  updateOneViaIPC,
  deleteOneViaIPC,
  getPatientsViaIPC,
  getPatientViaIPC,
  createPatientViaIPC,
  updatePatientViaIPC,
  deletePatientViaIPC,
} from './electron';

// To be implemented: IPC handlers for AI cache
export const getAICacheViaIPC = (key: string) => { throw new Error("Not implemented"); };
export const setAICacheViaIPC = (key: string, value: unknown) => { throw new Error("Not implemented"); };


/**
 * Get the appropriate database for a collection
 * This is the main routing function that determines which database to use
 */
export async function getDatabase(collection: CollectionName): Promise<Db> {
  // Validate collection name
  if (!isValidCollection(collection)) {
    throw new Error(`Invalid collection: ${collection}`);
  }

  const target = getDatabaseTarget(collection);

  // This check is no longer needed here. The renderer will be routed to IPC calls, 
  // and the main process will need a different way to get the local DB.
  // For web context, target will be 'remote' anyway.
  if (target === 'local' && !isElectronEnvironment()) {
      throw new Error(`Local collection ${collection} cannot be accessed from the web environment.`);
  }

  if (target === 'remote') {
    if (!isRemoteDatabaseConnected()) {
      await connectToRemoteDatabase();
    }
    return getRemoteDatabase();
  }

  // This part should now only be reached in the main process for local DB
  // We need a way to get the local DB instance here.
  // This will be addressed in a subsequent step.
  // For now, let's prevent it from breaking.
  // In the future, this should return the local Db instance for the main process.
  // For now, we'll fall through and it will likely fail, which is expected
  // until the main process direct access is implemented.
  if (isElectronEnvironment()) {
    // This is a placeholder. The main process should get the DB directly.
    // The renderer process uses IPC and won't hit this.
    console.warn("Attempting to get local DB from non-IPC path in main process.");
  }


  if (!isRemoteDatabaseConnected()) {
    await connectToRemoteDatabase();
  }
  return getRemoteDatabase();
}

/**
 * Get a collection with automatic database routing
 */
export async function getCollection<T extends Document = Document>(collectionName: CollectionName): Promise<Collection<T>> {
  const db = await getDatabase(collectionName);
  return db.collection<T>(collectionName);
}

/**
 * Unified database operations that work across environments
 */
export class DatabaseOperations {
  /**
   * Find one document
   */
  static async findOne<T extends Document>(collection: CollectionName, query: Filter<T>): Promise<T | null> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return findOneViaIPC(collection, query);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection<T>(collection);
    return col.findOne(query) as unknown as T | null;
  }

  /**
   * Find multiple documents
   */
  static async find<T extends Document>(collection: CollectionName, query: Filter<T>, options?: FindOptions<T>): Promise<T[]> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return findViaIPC(collection, query, options);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection<T>(collection);
    const cursor = col.find(query, options);
    
    if (options?.sort) cursor.sort(options.sort);
    if (options?.limit) cursor.limit(options.limit);
    
    return (await cursor.toArray()) as unknown as T[];
  }

  /**
   * Insert one document
   */
  static async insertOne<T extends Document>(collection: CollectionName, document: T): Promise<InsertOneResult<T>> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return insertOneViaIPC(collection, document);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection<T>(collection);
    return col.insertOne(document as OptionalUnlessRequiredId<T>);
  }

  /**
   * Update one document
   */
  static async updateOne<T extends Document>(collection: CollectionName, filter: Filter<T>, update: UpdateFilter<T>, options?: UpdateOptions): Promise<UpdateResult> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return updateOneViaIPC(collection, filter, update, options);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection<T>(collection);
    return col.updateOne(filter, update, options);
  }

  /**
   * Delete one document
   */
  static async deleteOne<T extends Document>(collection: CollectionName, filter: Filter<T>): Promise<DeleteResult> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return deleteOneViaIPC(collection, filter);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection<T>(collection);
    return col.deleteOne(filter);
  }
}

/**
 * High-level patient operations
 */
export class PatientOperations {
  static async getPatients(): Promise<Document[]> {
    console.log('📊 [MONGODB] PatientOperations.getPatients(): Fetching all non-deleted patients');
    try {
      // Check connection status first
      const status = getConnectionStatus();
      if (!status.connected) {
        console.error('❌ [MONGODB] Database not connected when fetching patients');
        throw new Error('Database not connected. Please check your MongoDB connection.');
      }
      
      const patients = await DatabaseOperations.find(COLLECTIONS.PATIENTS, { isDeleted: { $ne: true } });
      console.log(`✅ [MONGODB] Successfully fetched ${patients.length} patients`);
      return patients;
    } catch (error) {
      console.error('❌ [MONGODB] Error fetching patients:', error);
      throw error;
    }
  }

  static async getPatient(id: string): Promise<Document | null> {
    console.log(`📊 [MONGODB] PatientOperations.getPatient(): Fetching patient with ID ${id}`);
    try {
      const { ObjectId } = require('mongodb');
      const patient = await DatabaseOperations.findOne(COLLECTIONS.PATIENTS, { _id: new ObjectId(id) });
      console.log(`✅ [MONGODB] ${patient ? 'Found' : 'Did not find'} patient with ID ${id}`);
      return patient;
    } catch (error) {
      console.error(`❌ [MONGODB] Error fetching patient with ID ${id}:`, error);
      throw error;
    }
  }

  static async createPatient(patient: Document): Promise<Document> {
    console.log('📊 [MONGODB] PatientOperations.createPatient(): Creating new patient');
    try {
      const { ObjectId } = require('mongodb');
      const newPatient = {
        ...patient,
        _id: new ObjectId(),
        createdAt: new Date(),
        last_updated: new Date(),
        isDeleted: false
      };
      
      await DatabaseOperations.insertOne(COLLECTIONS.PATIENTS, newPatient);
      console.log(`✅ [MONGODB] Successfully created patient with ID ${newPatient._id}`);
      return newPatient;
    } catch (error) {
      console.error('❌ [MONGODB] Error creating patient:', error);
      throw error;
    }
  }

  static async updatePatient(id: string, updates: Document): Promise<UpdateResult> {
    console.log(`📊 [MONGODB] PatientOperations.updatePatient(): Updating patient with ID ${id}`);
    try {
      const { ObjectId } = require('mongodb');
      const result = await DatabaseOperations.updateOne(
        COLLECTIONS.PATIENTS,
        { _id: new ObjectId(id) },
        { $set: { ...updates, last_updated: new Date() } }
      );
      console.log(`✅ [MONGODB] Updated patient with ID ${id}. Modified: ${result.modifiedCount || 0}`);
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB] Error updating patient with ID ${id}:`, error);
      throw error;
    }
  }

  static async deletePatient(id: string): Promise<boolean> {
    console.log(`📊 [MONGODB] PatientOperations.deletePatient(): Soft deleting patient with ID ${id}`);
    try {
      // In Electron renderer, use IPC
      if (isElectronEnvironment() && isElectronIPCAvailable()) {
        console.log(`📊 [MONGODB] Using IPC for patient deletion`);
        return deletePatientViaIPC(id);
      }
  
      // Direct database access (soft delete)
      console.log(`📊 [MONGODB] Performing soft delete via direct database access`);
      const { ObjectId } = require('mongodb');
      const result = await DatabaseOperations.updateOne(
        COLLECTIONS.PATIENTS,
        { _id: new ObjectId(id) },
        { 
          $set: { 
            isDeleted: true, 
            deletedAt: new Date(),
            deletedBy: 'user'
          } 
        }
      );
      
      console.log(`✅ [MONGODB] Soft deleted patient with ID ${id}. Modified: ${result.modifiedCount || 0}`);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`❌ [MONGODB] Error deleting patient with ID ${id}:`, error);
      throw error;
    }
  }
}

/**
 * AI Cache operations
 */
export class AICacheOperations {
  /**
   * Retrieves the cached output for a given key if it exists and is not expired.
   * 
   * @param key - The cache key to look up.
   * @returns The cached output if found and valid, or `null` if not found or an error occurs.
   * 
   * @remarks
   * This method returns `null` instead of throwing errors if cache retrieval fails.
   * Callers should handle the possibility of a `null` return value.
   */
  static async getCache(key: string): Promise<unknown> {
    console.log(`📊 [MONGODB] AICacheOperations.getCache(): Looking up cache for key: ${key}`);
    try {
      const now = new Date();
      const entry = await DatabaseOperations.findOne(
        COLLECTIONS.AI_CACHE,
        { key, expiresAt: { $gt: now } }
      );
      
      console.log(`✅ [MONGODB] Cache ${entry ? 'hit' : 'miss'} for key: ${key}`);
      return entry?.output || null;
    } catch (error) {
      console.error(`❌ [MONGODB] Error retrieving cache for key ${key}:`, error);
      return null; // Return null instead of throwing on cache errors
    }
  }

  static async setCache(key: string, workflow: string, input: unknown, output: unknown, expiryMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    console.log(`📊 [MONGODB] AICacheOperations.setCache(): Setting cache for key: ${key}`);
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expiryMs);
      
      await DatabaseOperations.updateOne(
        COLLECTIONS.AI_CACHE,
        { key },
        {
          $set: {
            key,
            workflow,
            input,
            output,
            createdAt: now,
            expiresAt,
          },
        },
      { upsert: true }
      );
      console.log(`✅ [MONGODB] Successfully set cache for key: ${key}`);
    } catch (error) {
      console.error(`❌ [MONGODB] Error setting cache for key ${key}:`, error);
      throw error;
    }
  }
}


// Export connection and initialization functions
export {
  connectToDatabase,
  connectToCaseEmbeddingsDatabase,
  getConnectionStatus,
  initializeDatabaseConnections,
  startPeriodicConnectionChecks,
  stopPeriodicConnectionChecks,
  checkAllConnections
};
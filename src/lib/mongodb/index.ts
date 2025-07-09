/**
 * MongoDB Module - Unified Database Interface
 * 
 * This module provides a single entry point for all database operations,
 * automatically routing to local or remote databases based on environment
 * and collection configuration.
 */

import { Db, Collection, Document } from 'mongodb';
import { 
  COLLECTIONS, 
  COLLECTION_DISTRIBUTION, 
  getDatabaseTarget, 
  isElectronEnvironment,
  isValidCollection,
  type CollectionName,
  type DistributionType 
} from './config';

// Import connection modules
import { 
  connectToRemoteDatabase, 
  getRemoteDatabase, 
  isRemoteDatabaseConnected 
} from './remote';

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
export const setAICacheViaIPC = (key: string, value: any) => { throw new Error("Not implemented"); };


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
  static async findOne(collection: CollectionName, query: any): Promise<any> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return findOneViaIPC(collection, query);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection(collection);
    return col.findOne(query);
  }

  /**
   * Find multiple documents
   */
  static async find(collection: CollectionName, query: any, options?: any): Promise<any[]> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return findViaIPC(collection, query, options);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection(collection);
    const cursor = col.find(query, options);
    
    if (options?.sort) cursor.sort(options.sort);
    if (options?.limit) cursor.limit(options.limit);
    
    return cursor.toArray();
  }

  /**
   * Insert one document
   */
  static async insertOne(collection: CollectionName, document: any): Promise<any> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return insertOneViaIPC(collection, document);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection(collection);
    return col.insertOne(document);
  }

  /**
   * Update one document
   */
  static async updateOne(collection: CollectionName, filter: any, update: any, options?: any): Promise<any> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return updateOneViaIPC(collection, filter, update, options);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection(collection);
    return col.updateOne(filter, update, options);
  }

  /**
   * Delete one document
   */
  static async deleteOne(collection: CollectionName, filter: any): Promise<any> {
    // In Electron renderer, use IPC for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return deleteOneViaIPC(collection, filter);
    }

    // Direct database access (web or remote collections in Electron)
    const col = await getCollection(collection);
    return col.deleteOne(filter);
  }
}

/**
 * High-level patient operations
 */
export class PatientOperations {
  static async getPatients(): Promise<any[]> {
    return DatabaseOperations.find(COLLECTIONS.PATIENTS, { isDeleted: { $ne: true } });
  }

  static async getPatient(id: string): Promise<any> {
    const { ObjectId } = require('mongodb');
    return DatabaseOperations.findOne(COLLECTIONS.PATIENTS, { _id: new ObjectId(id) });
  }

  static async createPatient(patient: any): Promise<any> {
    const { ObjectId } = require('mongodb');
    const newPatient = {
      ...patient,
      _id: new ObjectId(),
      createdAt: new Date(),
      last_updated: new Date(),
      isDeleted: false
    };
    
    await DatabaseOperations.insertOne(COLLECTIONS.PATIENTS, newPatient);
    return newPatient;
  }

  static async updatePatient(id: string, updates: any): Promise<any> {
    const { ObjectId } = require('mongodb');
    return DatabaseOperations.updateOne(
      COLLECTIONS.PATIENTS,
      { _id: new ObjectId(id) },
      { $set: { ...updates, last_updated: new Date() } }
    );
  }

  static async deletePatient(id: string): Promise<boolean> {
    // In Electron renderer, use IPC
    if (isElectronEnvironment() && isElectronIPCAvailable()) {
      return deletePatientViaIPC(id);
    }

    // Direct database access (soft delete)
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
    
    return result.modifiedCount > 0;
  }
}

/**
 * AI Cache operations
 */
export class AICacheOperations {
  static async getCache(key: string): Promise<any> {
    const now = new Date();
    const entry = await DatabaseOperations.findOne(
      COLLECTIONS.AI_CACHE,
      { key, expiresAt: { $gt: now } }
    );
    
    return entry?.output || null;
  }

  static async setCache(key: string, workflow: string, input: any, output: any, expiryMs: number = 24 * 60 * 60 * 1000): Promise<void> {
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
  }
}



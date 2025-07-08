/**
 * Electron IPC Database Access Layer
 * 
 * This module provides database access for the renderer process in Electron
 * via IPC communication with the main process
 */

import { 
  COLLECTIONS, 
  COLLECTION_DISTRIBUTION, 
  isElectronEnvironment,
  type CollectionName 
} from './config';

// Electron API interface (defined in preload.ts)
interface ElectronAPI {
  database: {
    findOne: (collection: string, query: any) => Promise<any>;
    find: (collection: string, query: any, options?: any) => Promise<any[]>;
    insertOne: (collection: string, document: any) => Promise<any>;
    updateOne: (collection: string, filter: any, update: any, options?: any) => Promise<any>;
    deleteOne: (collection: string, filter: any) => Promise<any>;
    getPatients: () => Promise<any[]>;
    getPatient: (id: string) => Promise<any>;
    createPatient: (patient: any) => Promise<any>;
    updatePatient: (id: string, updates: any) => Promise<any>;
    deletePatient: (id: string) => Promise<boolean>;
    getAICache: (key: string) => Promise<any>;
    setAICache: (key: string, workflow: string, input: any, output: any, expiryMs?: number) => Promise<void>;
  };
}

/**
 * Get Electron API from window (if available)
 */
function getElectronAPI(): ElectronAPI | null {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI as ElectronAPI;
  }
  return null;
}

/**
 * Check if we're in Electron and can use IPC
 */
export function isElectronIPCAvailable(): boolean {
  return isElectronEnvironment() && getElectronAPI() !== null;
}

/**
 * Generic database operations via IPC
 */
export async function findOneViaIPC(collection: CollectionName, query: any): Promise<any> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.findOne(collection, query);
}

export async function findViaIPC(collection: CollectionName, query: any, options?: any): Promise<any[]> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.find(collection, query, options);
}

export async function insertOneViaIPC(collection: CollectionName, document: any): Promise<any> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.insertOne(collection, document);
}

export async function updateOneViaIPC(
  collection: CollectionName, 
  filter: any, 
  update: any, 
  options?: any
): Promise<any> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.updateOne(collection, filter, update, options);
}

export async function deleteOneViaIPC(collection: CollectionName, filter: any): Promise<any> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.deleteOne(collection, filter);
}

/**
 * High-level patient operations via IPC
 */
export async function getPatientsViaIPC(): Promise<any[]> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.getPatients();
}

export async function getPatientViaIPC(id: string): Promise<any> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.getPatient(id);
}

export async function createPatientViaIPC(patient: any): Promise<any> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.createPatient(patient);
}

export async function updatePatientViaIPC(id: string, updates: any): Promise<any> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.updatePatient(id, updates);
}

export async function deletePatientViaIPC(id: string): Promise<boolean> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.deletePatient(id);
}

/**
 * AI Cache operations via IPC
 */
export async function getAICacheViaIPC(key: string): Promise<any> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.getAICache(key);
}

export async function setAICacheViaIPC(
  key: string, 
  workflow: string, 
  input: any, 
  output: any, 
  expiryMs?: number
): Promise<void> {
  const electronAPI = getElectronAPI();
  if (!electronAPI) {
    throw new Error('Electron IPC not available');
  }
  
  return electronAPI.database.setAICache(key, workflow, input, output, expiryMs);
}

/**
 * Database routing helper - determines if collection should use local or remote
 */
export function shouldUseLocalDatabase(collection: CollectionName): boolean {
  if (!isElectronEnvironment()) {
    return false;
  }
  
  const distribution = COLLECTION_DISTRIBUTION[collection];
  return distribution === 'local-primary' || distribution === 'local-only';
}

/**
 * Collection validation for IPC operations
 */
export function validateCollection(collection: string): asserts collection is CollectionName {
  if (!Object.values(COLLECTIONS).includes(collection as CollectionName)) {
    throw new Error(`Invalid collection name: ${collection}`);
  }
}

import { isElectronEnvironment } from './config';
import { Document, Filter, FindOptions, UpdateFilter, UpdateOptions, InsertOneResult, UpdateResult, DeleteResult } from 'mongodb';

// This interface should ideally be shared with preload.ts
interface ElectronAPI {
  database: {
    findOne: <T extends Document>(collection: string, query: Filter<T>) => Promise<T | null>;
    find: <T extends Document>(collection: string, query: Filter<T>, options?: FindOptions<T>) => Promise<T[]>;
    insertOne: <T extends Document>(collection: string, document: T) => Promise<InsertOneResult<T>>;
    updateOne: <T extends Document>(collection: string, filter: Filter<T>, update: UpdateFilter<T>, options?: UpdateOptions) => Promise<UpdateResult>;
    deleteOne: <T extends Document>(collection: string, filter: Filter<T>) => Promise<DeleteResult>;
    getPatients: () => Promise<Document[]>;
    getPatient: (id: string) => Promise<Document | null>;
    createPatient: (patient: Document) => Promise<InsertOneResult<Document>>;
    updatePatient: (id: string, updates: Document) => Promise<UpdateResult>;
    deletePatient: (id: string) => Promise<boolean>;
  };
}

function getElectronAPI(): ElectronAPI | null {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI as ElectronAPI;
  }
  return null;
}

export function isElectronIPCAvailable(): boolean {
  return isElectronEnvironment() && getElectronAPI() !== null;
}
import { isElectronEnvironment } from './config';

// This interface should ideally be shared with preload.ts
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

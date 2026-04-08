/**
 * Global TypeScript declarations for window.electronAPI compatibility.
 *
 * In a web-first architecture, window.electronAPI is always undefined.
 * This declaration prevents TypeScript errors in components that still
 * reference window.electronAPI with guards.
 */

export {};

interface ElectronDatabaseAPI {
  findOne: (collection: string, query: unknown) => Promise<unknown>;
  find: (collection: string, query: unknown, options?: unknown) => Promise<unknown[]>;
  insertOne: (collection: string, document: unknown) => Promise<unknown>;
  updateOne: (collection: string, filter: unknown, update: unknown, options?: unknown) => Promise<unknown>;
  deleteOne: (collection: string, filter: unknown) => Promise<unknown>;
  deleteMany: (collection: string, filter: unknown) => Promise<unknown>;
  getPatients: (query?: unknown) => Promise<unknown[]>;
  getPatient: (idOrQuery: unknown) => Promise<unknown>;
  createPatient: (patient: unknown) => Promise<unknown>;
  updatePatient: (idOrQuery: unknown, update?: unknown) => Promise<unknown>;
  deletePatient: (idOrObj: unknown) => Promise<unknown>;
  getInfo: () => Promise<unknown>;
  exportData: () => Promise<unknown>;
  getStorageSettings: () => Promise<unknown>;
  getStats: () => Promise<unknown>;
  ready: () => Promise<boolean>;
  checkStatus: () => Promise<unknown>;
  health: () => Promise<unknown>;
  getUserMongoUri: () => Promise<string>;
  setUserMongoUri: (uri: string) => Promise<void>;
  testConnection: (uri: string) => Promise<{ success: boolean; error?: string }>;
  saveUserMongoUri: (uri: string) => Promise<void>;
}

interface ElectronDataSourceAPI {
  query: (query: { type: string; params: Record<string, unknown>; rawQuery?: unknown }) => Promise<unknown>;
  getAvailable: () => Promise<Array<{ id: string; name: string; description?: string; status: string }>>;
  connect: (sourceId: string, config: Record<string, unknown>) => Promise<void>;
  disconnect: () => Promise<void>;
  getActiveStatus: () => Promise<{ sourceId: string | null; status: string | null; error: Error | null }>;
  getConnectionInfo: (sourceId: string) => Promise<{
    isConnected: boolean;
    uri?: string;
    database?: string;
    collections?: string[];
    lastConnected?: string;
    serverInfo?: unknown;
  } | null>;
  onStatusUpdate: (callback: (event: unknown) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: {
      database: ElectronDatabaseAPI;
      dataSource: ElectronDataSourceAPI;
    };
  }
}

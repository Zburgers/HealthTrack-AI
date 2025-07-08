import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script for HealthTrack-AI Electron app
 * 
 * This script runs in a privileged context and exposes secure APIs
 * to the renderer process via contextBridge
 */

// Define the API interface that will be available in the renderer
export interface ElectronAPI {  // Database operations
  database: {
    // Patient operations
    getPatients: () => Promise<any[]>;
    getPatient: (id: string) => Promise<any>;
    createPatient: (patient: any) => Promise<any>;
    updatePatient: (id: string, updates: any) => Promise<any>;
    deletePatient: (id: string) => Promise<boolean>;
    
    // AI Cache operations
    getAICache: (key: string) => Promise<any>;
    setAICache: (key: string, workflow: string, input: any, output: any, expiryMs?: number) => Promise<void>;
    
    // Generic database operations
    findOne: (collection: string, query: any) => Promise<any>;
    find: (collection: string, query: any, options?: any) => Promise<any[]>;
    insertOne: (collection: string, document: any) => Promise<any>;
    updateOne: (collection: string, filter: any, update: any, options?: any) => Promise<any>;
    deleteOne: (collection: string, filter: any) => Promise<any>;
    
    // Database information and management
    getInfo: () => Promise<any>;
    exportData: () => Promise<any>;
    chooseStorageLocation: () => Promise<any>;
    getStorageSettings: () => Promise<any>;
    updateStorageSettings: (settings: any) => Promise<any>;
    healthCheck: () => Promise<any>;
  };
  
  // Cache management operations
  cache: {
    getMetrics: () => Promise<any>;
    clear: () => Promise<{ success: boolean }>;
    warm: () => Promise<{ success: boolean }>;
    optimize: () => Promise<{ success: boolean }>;
    getStatus: () => Promise<any>;
  };
  
  // App information
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    isOnline: () => Promise<boolean>;
    getDataPath: () => Promise<string>;
  };
  
  // System operations
  system: {
    openExternal: (url: string) => Promise<void>;
    showItemInFolder: (path: string) => Promise<void>;
    exportData: (data: any, filename: string) => Promise<string>;
    importData: (filePath: string) => Promise<any>;
  };
}

// Expose secure API to renderer process
const electronAPI: ElectronAPI = {  database: {
    // Patient operations
    getPatients: () => ipcRenderer.invoke('db-getPatients'),
    getPatient: (id: string) => ipcRenderer.invoke('db-getPatient', id),
    createPatient: (patient: any) => ipcRenderer.invoke('db-createPatient', patient),
    updatePatient: (id: string, updates: any) => ipcRenderer.invoke('db-updatePatient', id, updates),
    deletePatient: (id: string) => ipcRenderer.invoke('db-deletePatient', id),
    
    // AI Cache operations
    getAICache: (key: string) => ipcRenderer.invoke('db-getAICache', key),
    setAICache: (key: string, workflow: string, input: any, output: any, expiryMs?: number) => 
      ipcRenderer.invoke('db-setAICache', key, workflow, input, output, expiryMs),
    
    // Generic database operations
    findOne: (collection: string, query: any) => ipcRenderer.invoke('db-findOne', collection, query),
    find: (collection: string, query: any, options?: any) => ipcRenderer.invoke('db-find', collection, query, options),
    insertOne: (collection: string, document: any) => ipcRenderer.invoke('db-insertOne', collection, document),
    updateOne: (collection: string, filter: any, update: any, options?: any) => 
      ipcRenderer.invoke('db-updateOne', collection, filter, update, options),
    deleteOne: (collection: string, filter: any) => ipcRenderer.invoke('db-deleteOne', collection, filter),
    
    // Database information and management
    getInfo: () => ipcRenderer.invoke('db-getInfo'),
    exportData: () => ipcRenderer.invoke('db-exportData'),
    chooseStorageLocation: () => ipcRenderer.invoke('db-chooseStorageLocation'),
    getStorageSettings: () => ipcRenderer.invoke('db-getStorageSettings'),
    updateStorageSettings: (settings: any) => ipcRenderer.invoke('db-updateStorageSettings', settings),
    healthCheck: () => ipcRenderer.invoke('db-healthCheck'),
  },
  
  cache: {
    getMetrics: () => ipcRenderer.invoke('cache:getMetrics'),
    clear: () => ipcRenderer.invoke('cache:clear'),
    warm: () => ipcRenderer.invoke('cache:warm'),
    optimize: () => ipcRenderer.invoke('cache:optimize'),
    getStatus: () => ipcRenderer.invoke('cache:getStatus'),
  },
  
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
    isOnline: () => ipcRenderer.invoke('app:isOnline'),
    getDataPath: () => ipcRenderer.invoke('app:getDataPath'),
  },
  
  system: {
    openExternal: (url: string) => ipcRenderer.invoke('system:openExternal', url),
    showItemInFolder: (path: string) => ipcRenderer.invoke('system:showItemInFolder', path),
    exportData: (data: any, filename: string) => ipcRenderer.invoke('system:exportData', data, filename),
    importData: (filePath: string) => ipcRenderer.invoke('system:importData', filePath),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Also expose a flag to detect Electron environment
contextBridge.exposeInMainWorld('isElectron', true);

// Development helpers
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDev', {
    openDevTools: () => ipcRenderer.invoke('dev:openDevTools'),
    reload: () => ipcRenderer.invoke('dev:reload'),
  });
}

// Expose ipcRenderer.invoke directly for convenience
contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});

// Log that preload script has loaded
console.log('🔌 HealthTrack-AI preload script loaded successfully');

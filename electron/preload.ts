import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script for HealthTrack-AI Electron app
 * 
 * This script runs in a privileged context and exposes secure APIs
 * to the renderer process via contextBridge
 */

// Expose secure API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // 🎯 Clara's Switchboard Architecture - Unified Data Access
  dataSource: {
    // Central query method - all data operations flow through here
    query: (query: { type: string; params: Record<string, any>; rawQuery?: any }) => 
      ipcRenderer.invoke('data:query', query),
    
    // Data source management
    getAvailable: () => ipcRenderer.invoke('data-source:get-available'),
    connect: (sourceId: string, config: Record<string, any>) => 
      ipcRenderer.invoke('data-source:connect', sourceId, config),
    disconnect: () => ipcRenderer.invoke('data-source:disconnect'),
    getActiveStatus: () => ipcRenderer.invoke('data-source:get-active-status'),
    getConnectionInfo: () => ipcRenderer.invoke('data-source:get-connection-info'),
    
    // Status update events
    onStatusUpdate: (callback: (event: any) => void) => {
      ipcRenderer.on('data-source:status-update', callback);
      return () => ipcRenderer.removeListener('data-source:status-update', callback);
    }
  },

  // Legacy database API (preserved for backward compatibility during transition)
  database: {
    // Generic database operations
    findOne: (c: string, q: any) => ipcRenderer.invoke('db:findOne', c, q),
    find: (c: string, q: any, o?: any) => ipcRenderer.invoke('db:find', c, q, o),
    insertOne: (c: string, d: any) => ipcRenderer.invoke('db:insertOne', c, d),
    updateOne: (c: string, f: any, u: any, o?: any) => ipcRenderer.invoke('db:updateOne', c, f, u, o),
    deleteOne: (c: string, f: any) => ipcRenderer.invoke('db:deleteOne', c, f),
    
    // Patient operations
    getPatients: () => ipcRenderer.invoke('db:getPatients'),
    getPatient: (id: string) => ipcRenderer.invoke('db:getPatient', id),
    createPatient: (p: any) => ipcRenderer.invoke('db:createPatient', p),
    updatePatient: (id: string, u: any) => ipcRenderer.invoke('db:updatePatient', id, u),
    deletePatient: (id: string) => ipcRenderer.invoke('db:deletePatient', id),

    // Status and URI management
    checkStatus: () => ipcRenderer.invoke('db:checkStatus'),
    health: () => ipcRenderer.invoke('db-health'),
    getUserMongoUri: () => ipcRenderer.invoke('db-getUserMongoUri'),
    setUserMongoUri: (uri: string) => ipcRenderer.invoke('db-setUserMongoUri', uri),
    testConnection: (uri: string) => ipcRenderer.invoke('db-testConnection', uri),
  }
});

// Development helpers
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDev', {
    openDevTools: () => ipcRenderer.invoke('dev:openDevTools'),
    reload: () => ipcRenderer.invoke('dev:reload'),
  });
}

// Log that preload script has loaded
console.log('🔌 HealthTrack-AI preload script loaded successfully');

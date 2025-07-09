import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script for HealthTrack-AI Electron app
 * 
 * This script runs in a privileged context and exposes secure APIs
 * to the renderer process via contextBridge
 */

// Expose secure API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
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

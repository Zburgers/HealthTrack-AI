const { contextBridge, ipcRenderer } = require('electron');

// Expose a comprehensive API to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Basic info
  isElectron: true,
  platform: process.platform,
  
  // Database operations
  database: {
    // Basic CRUD operations
    findOne: (collection, query) => ipcRenderer.invoke('db-findOne', collection, query),
    find: (collection, query, options) => ipcRenderer.invoke('db-find', collection, query, options),
    insertOne: (collection, document) => ipcRenderer.invoke('db-insertOne', collection, document),
    updateOne: (collection, filter, update, options) => ipcRenderer.invoke('db-updateOne', collection, filter, update, options),
    deleteOne: (collection, filter) => ipcRenderer.invoke('db-deleteOne', collection, filter),
    
    // Patient operations
    getPatients: () => ipcRenderer.invoke('db-getPatients'),
    getPatient: (id) => ipcRenderer.invoke('db-getPatient', id),
    createPatient: (patient) => ipcRenderer.invoke('db-createPatient', patient),
    updatePatient: (id, updates) => ipcRenderer.invoke('db-updatePatient', id, updates),
    deletePatient: (id) => ipcRenderer.invoke('db-deletePatient', id),
    
    // AI Cache operations
    getAICache: (key) => ipcRenderer.invoke('db-getAICache', key),
    setAICache: (key, workflow, input, output, expiryMs) => ipcRenderer.invoke('db-setAICache', key, workflow, input, output, expiryMs),
    
    // Database management
    getInfo: () => ipcRenderer.invoke('db-getInfo'),
    exportData: () => ipcRenderer.invoke('db-exportData'),
    chooseStorageLocation: () => ipcRenderer.invoke('db-chooseStorageLocation'),
    getStorageSettings: () => ipcRenderer.invoke('db-getStorageSettings'),
    getStats: () => ipcRenderer.invoke('db-getStats'),
    healthCheck: () => ipcRenderer.invoke('db-healthCheck')
  },
  
  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings-get'),
    set: (settings) => ipcRenderer.invoke('settings-set', settings),
    chooseDirectory: () => ipcRenderer.invoke('settings-chooseDirectory')
  }
});

// Also expose the flag directly for backward compatibility
contextBridge.exposeInMainWorld('isElectron', true);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose secure API to renderer process
const electronAPI = { database: {
        // Patient operations
        getPatients: () => electron_1.ipcRenderer.invoke('db-getPatients'),
        getPatient: (id) => electron_1.ipcRenderer.invoke('db-getPatient', id),
        createPatient: (patient) => electron_1.ipcRenderer.invoke('db-createPatient', patient),
        updatePatient: (id, updates) => electron_1.ipcRenderer.invoke('db-updatePatient', id, updates),
        deletePatient: (id) => electron_1.ipcRenderer.invoke('db-deletePatient', id),
        // AI Cache operations
        getAICache: (key) => electron_1.ipcRenderer.invoke('db-getAICache', key),
        setAICache: (key, workflow, input, output, expiryMs) => electron_1.ipcRenderer.invoke('db-setAICache', key, workflow, input, output, expiryMs),
        // Generic database operations
        findOne: (collection, query) => electron_1.ipcRenderer.invoke('db-findOne', collection, query),
        find: (collection, query, options) => electron_1.ipcRenderer.invoke('db-find', collection, query, options),
        insertOne: (collection, document) => electron_1.ipcRenderer.invoke('db-insertOne', collection, document),
        updateOne: (collection, filter, update, options) => electron_1.ipcRenderer.invoke('db-updateOne', collection, filter, update, options),
        deleteOne: (collection, filter) => electron_1.ipcRenderer.invoke('db-deleteOne', collection, filter),
        // Database information and management
        getInfo: () => electron_1.ipcRenderer.invoke('db-getInfo'),
        exportData: () => electron_1.ipcRenderer.invoke('db-exportData'),
        chooseStorageLocation: () => electron_1.ipcRenderer.invoke('db-chooseStorageLocation'),
        getStorageSettings: () => electron_1.ipcRenderer.invoke('db-getStorageSettings'),
        updateStorageSettings: (settings) => electron_1.ipcRenderer.invoke('db-updateStorageSettings', settings),
        healthCheck: () => electron_1.ipcRenderer.invoke('db-healthCheck'),
        // MongoDB URI management
        getUserMongoUri: () => electron_1.ipcRenderer.invoke('db-getUserMongoUri'),
        setUserMongoUri: (uri) => electron_1.ipcRenderer.invoke('db-setUserMongoUri', uri),
        validateMongoUri: (uri) => electron_1.ipcRenderer.invoke('db-validateMongoUri', uri),
        // MongoDB health checks
        healthCheckDefault: () => electron_1.ipcRenderer.invoke('db-healthCheckDefault'),
        healthCheckUser: () => electron_1.ipcRenderer.invoke('db-healthCheckUser'),
    },
    cache: {
        getMetrics: () => electron_1.ipcRenderer.invoke('cache:getMetrics'),
        clear: () => electron_1.ipcRenderer.invoke('cache:clear'),
        warm: () => electron_1.ipcRenderer.invoke('cache:warm'),
        optimize: () => electron_1.ipcRenderer.invoke('cache:optimize'),
        getStatus: () => electron_1.ipcRenderer.invoke('cache:getStatus'),
    },
    app: {
        getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
        getPlatform: () => electron_1.ipcRenderer.invoke('app:getPlatform'),
        isOnline: () => electron_1.ipcRenderer.invoke('app:isOnline'),
        getDataPath: () => electron_1.ipcRenderer.invoke('app:getDataPath'),
    },
    system: {
        openExternal: (url) => electron_1.ipcRenderer.invoke('system:openExternal', url),
        showItemInFolder: (path) => electron_1.ipcRenderer.invoke('system:showItemInFolder', path),
        exportData: (data, filename) => electron_1.ipcRenderer.invoke('system:exportData', data, filename),
        importData: (filePath) => electron_1.ipcRenderer.invoke('system:importData', filePath),
    },
};
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
// Also expose a flag to detect Electron environment
electron_1.contextBridge.exposeInMainWorld('isElectron', true);
// Development helpers
if (process.env.NODE_ENV === 'development') {
    electron_1.contextBridge.exposeInMainWorld('electronDev', {
        openDevTools: () => electron_1.ipcRenderer.invoke('dev:openDevTools'),
        reload: () => electron_1.ipcRenderer.invoke('dev:reload'),
    });
}
// Expose ipcRenderer.invoke directly for convenience
electron_1.contextBridge.exposeInMainWorld('ipcRenderer', {
    invoke: (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args),
});
// Log that preload script has loaded
console.log('🔌 HealthTrack-AI preload script loaded successfully');
//# sourceMappingURL=preload.js.map
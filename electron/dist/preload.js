"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * Preload script for HealthTrack-AI Electron app
 *
 * This script runs in a privileged context and exposes secure APIs
 * to the renderer process via contextBridge
 */
// Expose secure API to renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    database: {
        // Generic database operations
        findOne: (c, q) => electron_1.ipcRenderer.invoke('db:findOne', c, q),
        find: (c, q, o) => electron_1.ipcRenderer.invoke('db:find', c, q, o),
        insertOne: (c, d) => electron_1.ipcRenderer.invoke('db:insertOne', c, d),
        updateOne: (c, f, u, o) => electron_1.ipcRenderer.invoke('db:updateOne', c, f, u, o),
        deleteOne: (c, f) => electron_1.ipcRenderer.invoke('db:deleteOne', c, f),
        // Patient operations
        getPatients: () => electron_1.ipcRenderer.invoke('db:getPatients'),
        getPatient: (id) => electron_1.ipcRenderer.invoke('db:getPatient', id),
        createPatient: (p) => electron_1.ipcRenderer.invoke('db:createPatient', p),
        updatePatient: (id, u) => electron_1.ipcRenderer.invoke('db:updatePatient', id, u),
        deletePatient: (id) => electron_1.ipcRenderer.invoke('db:deletePatient', id),
        // Status and URI management
        checkStatus: () => electron_1.ipcRenderer.invoke('db:checkStatus'),
        health: () => electron_1.ipcRenderer.invoke('db-health'),
        getUserMongoUri: () => electron_1.ipcRenderer.invoke('db-getUserMongoUri'),
        setUserMongoUri: (uri) => electron_1.ipcRenderer.invoke('db-setUserMongoUri', uri),
    }
});
// Development helpers
if (process.env.NODE_ENV === 'development') {
    electron_1.contextBridge.exposeInMainWorld('electronDev', {
        openDevTools: () => electron_1.ipcRenderer.invoke('dev:openDevTools'),
        reload: () => electron_1.ipcRenderer.invoke('dev:reload'),
    });
}
// Log that preload script has loaded
console.log('🔌 HealthTrack-AI preload script loaded successfully');
//# sourceMappingURL=preload.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
exports.cleanup = cleanup;
const electron_1 = require("electron");
const mongodb_handlers_1 = require("./mongodb-handlers");
/**
 * Setup IPC handlers for secure communication between main and renderer processes
 */
function setupIpcHandlers() {
    console.log('🔌 Setting up IPC handlers...');
    // Database operations (MongoDB-based)
    (0, mongodb_handlers_1.setupMongoDBIpcHandlers)();
    // App information handlers
    setupAppHandlers();
    // System operation handlers
    setupSystemHandlers();
    console.log('✅ IPC handlers setup complete');
}
/**
 * App information handlers
 */
function setupAppHandlers() {
    // App version
    electron_1.ipcMain.handle('app:getVersion', async () => {
        return electron_1.app.getVersion();
    });
    // Platform info
    electron_1.ipcMain.handle('app:getPlatform', async () => {
        return process.platform;
    });
    // Online status
    electron_1.ipcMain.handle('app:isOnline', async () => {
        // Simple network check - in a real app you might want to ping a server
        return true;
    });
    // Data path
    electron_1.ipcMain.handle('app:getDataPath', async () => {
        return electron_1.app.getPath('userData');
    });
    console.log('✅ App handlers setup complete');
}
/**
 * System operation handlers
 */
function setupSystemHandlers() {
    // Open external URL
    electron_1.ipcMain.handle('system:openExternal', async (event, url) => {
        await electron_1.shell.openExternal(url);
    });
    // Show item in folder
    electron_1.ipcMain.handle('system:showItemInFolder', async (event, fullPath) => {
        electron_1.shell.showItemInFolder(fullPath);
    });
    console.log('✅ System handlers setup complete');
}
/**
 * Cleanup function to close all database connections
 */
async function cleanup() {
    console.log('🧹 Cleaning up IPC handlers...');
    try {
        await (0, mongodb_handlers_1.closeMongoDBConnection)();
        console.log('✅ IPC cleanup complete');
    }
    catch (error) {
        console.error('❌ IPC cleanup failed:', error);
    }
}
//# sourceMappingURL=handlers.js.map
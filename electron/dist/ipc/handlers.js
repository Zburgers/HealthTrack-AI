"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
const electron_1 = require("electron");
const sqlite_db_1 = require("../db/sqlite-db");
const fs = __importStar(require("fs"));
/**
 * Setup IPC handlers for secure communication between main and renderer processes
 */
function setupIpcHandlers() {
    console.log('🔌 Setting up IPC handlers...');
    // Database operations
    setupDatabaseHandlers();
    // App information handlers
    setupAppHandlers();
    // System operation handlers
    setupSystemHandlers();
    console.log('✅ IPC handlers setup complete');
}
/**
 * Database operation handlers
 */
function setupDatabaseHandlers() {
    // Database information handler
    electron_1.ipcMain.handle('db:getInfo', async () => {
        try {
            console.log('🔍 Getting SQLite database info...');
            const db = (0, sqlite_db_1.getSqliteDatabase)();
            const dbPath = (0, sqlite_db_1.getSqliteDbPath)();
            // Get table information
            const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
            const collectionsInfo = [];
            for (const table of tables) {
                const tableInfo = table;
                const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableInfo.name}`).get();
                collectionsInfo.push({
                    name: tableInfo.name,
                    count: count.count,
                    location: 'local'
                });
            }
            // Add remote collections (unchanged)
            collectionsInfo.push({
                name: 'case_embeddings',
                count: 0,
                location: 'remote'
            });
            // Get database size
            let totalSize = '0 MB';
            try {
                const stats = fs.statSync(dbPath);
                totalSize = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
            }
            catch (error) {
                console.warn('Failed to get database size:', error);
            }
            return {
                type: 'hybrid',
                localPath: dbPath,
                remoteHost: 'MongoDB Atlas',
                collections: collectionsInfo,
                totalSize,
                connectionInfo: {
                    isConnected: (0, sqlite_db_1.healthCheck)(),
                    uri: `sqlite://${dbPath}`,
                    host: 'local',
                    database: 'healthtrack_local.sqlite'
                },
                lastBackup: null
            };
        }
        catch (error) {
            console.error('❌ Failed to get database info:', error);
            throw error;
        }
    });
    // Database operations handlers
    // TODO: Re-implement these handlers to work with direct SQLite operations
    // These were temporarily disabled during MongoDB Memory Server cleanup
    /*
    ipcMain.handle('db:findOne', async (event, collection: string, query: any) => {
      console.log(`[IPC_HANDLER] Received db:findOne for collection '${collection}'`);
      const result = await sqliteAdapter.findOne(collection, query);
      console.log(`[IPC_HANDLER] Sending db:findOne result for collection '${collection}'`);
      return result;
    });
  
    ipcMain.handle('db:find', async (event, collection: string, query: any, options: any) => {
      console.log(`[IPC_HANDLER] Received db:find for collection '${collection}'`);
      const result = await sqliteAdapter.find(collection, query, options);
      console.log(`[IPC_HANDLER] Sending db:find result for collection '${collection}'`);
      return result;
    });
  
    ipcMain.handle('db:insertOne', async (event, collection: string, document: any) => {
      console.log(`[IPC_HANDLER] Received db:insertOne for collection '${collection}'`);
      const result = await sqliteAdapter.insertOne(collection, document);
      console.log(`[IPC_HANDLER] Sending db:insertOne result for collection '${collection}'`);
      return result;
    });
  
    ipcMain.handle('db:updateOne', async (event, collection: string, filter: any, update: any) => {
      console.log(`[IPC_HANDLER] Received db:updateOne for collection '${collection}'`);
      const result = await sqliteAdapter.updateOne(collection, filter, update);
      console.log(`[IPC_HANDLER] Sending db:updateOne result for collection '${collection}'`);
      return result;
    });
  
    ipcMain.handle('db:deleteOne', async (event, collection: string, filter: any) => {
      console.log(`[IPC_HANDLER] Received db:deleteOne for collection '${collection}'`);
      const result = await sqliteAdapter.deleteOne(collection, filter);
      console.log(`[IPC_HANDLER] Sending db:deleteOne result for collection '${collection}'`);
      return result;
    });
  
    ipcMain.handle('db:countDocuments', async (event, collection: string, filter: any) => {
      console.log(`[IPC_HANDLER] Received db:countDocuments for collection '${collection}'`);
      const result = await sqliteAdapter.countDocuments(collection, filter);
      console.log(`[IPC_HANDLER] Sending db:countDocuments result for collection '${collection}'`);
      return result;
    });
    */
    // Export handler (modified for SQLite)
    electron_1.ipcMain.handle('db:exportData', async () => {
        try {
            const db = (0, sqlite_db_1.getSqliteDatabase)();
            const exportData = {
                metadata: {
                    exportType: 'SQLite',
                    dbType: 'healthtrack_local',
                    appVersion: process.env.npm_package_version || 'unknown',
                    exportDate: new Date().toLocaleDateString(),
                },
                tables: {}
            };
            // Get all tables
            const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
            for (const table of tables) {
                const tableInfo = table;
                const rows = db.prepare(`SELECT * FROM ${tableInfo.name}`).all();
                exportData.tables[tableInfo.name] = rows;
            }
            // Save to file
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `healthtrack-sqlite-export-${timestamp}.json`;
            const outPath = electron_1.dialog.showSaveDialogSync({
                title: 'Export SQLite Database',
                defaultPath: filename,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            if (!outPath)
                return null;
            await fs.promises.writeFile(outPath, JSON.stringify(exportData, null, 2), 'utf8');
            return {
                success: true,
                filePath: outPath,
                tablesExported: Object.keys(exportData.tables).length,
                totalRecords: Object.values(exportData.tables).reduce((sum, records) => sum + records.length, 0)
            };
        }
        catch (error) {
            console.error('❌ Failed to export SQLite database:', error);
            throw error;
        }
    });
}
/**
 * App information handlers
 */
function setupAppHandlers() {
    // App version
    electron_1.ipcMain.handle('app:getVersion', async () => {
        return electron_1.app.getVersion();
    });
    // App paths
    electron_1.ipcMain.handle('app:getPaths', async () => {
        return {
            userData: electron_1.app.getPath('userData'),
            documents: electron_1.app.getPath('documents'),
            downloads: electron_1.app.getPath('downloads'),
            temp: electron_1.app.getPath('temp'),
        };
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
//# sourceMappingURL=handlers.js.map
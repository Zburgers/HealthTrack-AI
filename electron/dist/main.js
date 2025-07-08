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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const env_1 = require("./utils/env");
const sqlite_db_1 = require("./db/sqlite-db");
const handlers_1 = require("./ipc/handlers");
const database_handlers_1 = require("./ipc/database-handlers");
// Keep a global reference of the window object
let mainWindow = null;
let cacheCleanupInterval = null;
/**
 * Create the main application window
 */
function createWindow() {
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800, webPreferences: {
            nodeIntegration: false, // Security: Disable node integration in renderer
            contextIsolation: true, // Security: Enable context isolation
            preload: path.join(__dirname, 'preload.js'), // Preload script for secure IPC
            webSecurity: true,
        },
        icon: path.join(__dirname, '../public/assets/healthtrack.ico'),
        show: false, // Don't show until ready-to-show
        titleBarStyle: 'default',
    });
    // Load the Next.js application
    const startUrl = env_1.isDev
        ? 'http://localhost:9002'
        : `file://${path.join(__dirname, '../out/index.html')}`;
    mainWindow.loadURL(startUrl);
    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
            // Open DevTools in development
            if (env_1.isDev) {
                mainWindow.webContents.openDevTools();
            }
        }
    });
    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    // Prevent navigation to external URLs
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== 'http://localhost:9002' && parsedUrl.origin !== startUrl && !navigationUrl.startsWith('http://localhost:9002')) {
            event.preventDefault();
        }
    });
}
/**
 * Start scheduled AI cache cleanup job
 */
function startCacheCleanupJob() {
    // Clean up expired cache entries every hour (3600000 ms)
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
    console.log('🗑️ Starting AI cache cleanup job (runs every hour)...');
    // Run initial cleanup
    (0, sqlite_db_1.cleanupExpiredAiCache)().catch(error => {
        console.error('❌ Initial cache cleanup failed:', error);
    });
    // Schedule periodic cleanup
    cacheCleanupInterval = setInterval(async () => {
        try {
            const deletedCount = await (0, sqlite_db_1.cleanupExpiredAiCache)();
            if (deletedCount > 0) {
                console.log(`🧹 Scheduled cleanup removed ${deletedCount} expired cache entries`);
            }
        }
        catch (error) {
            console.error('❌ Scheduled cache cleanup failed:', error);
        }
    }, CLEANUP_INTERVAL);
    console.log('✅ AI cache cleanup job started');
}
/**
 * Stop scheduled AI cache cleanup job
 */
function stopCacheCleanupJob() {
    if (cacheCleanupInterval) {
        clearInterval(cacheCleanupInterval);
        cacheCleanupInterval = null;
        console.log('✅ AI cache cleanup job stopped');
    }
}
/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        console.log('🚀 Initializing HealthTrack-AI Electron app...');
        // Set environment variables for consistent detection
        process.env.ELECTRON_ENV = 'true';
        process.env.IS_ELECTRON = 'true';
        // Initialize local SQLite database (optional, will auto-init on first use)
        console.log('� Initializing SQLite database...');
        try {
            await (0, sqlite_db_1.initializeSqliteDatabase)();
            console.log(`✅ Local database initialized at: ${(0, sqlite_db_1.getSqliteDbPath)()}`);
        }
        catch (error) {
            console.warn('⚠️ SQLite database initialization failed, will auto-initialize on first use:', error);
        }
        // Setup IPC handlers for database operations
        console.log('🔌 Setting up IPC handlers...');
        (0, handlers_1.setupIpcHandlers)();
        (0, database_handlers_1.setupDatabaseIpcHandlers)(); // This is the working database handler
        console.log('✅ IPC handlers configured');
        // Start AI cache cleanup job
        console.log('🧠 Initializing smart caching system...');
        startCacheCleanupJob();
        console.log('✅ Smart caching initialized successfully');
        // Create main window
        console.log('� Creating Electron window...');
        createWindow();
        console.log('✅ HealthTrack-AI Electron app initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize app:', error);
        // Show error dialog and quit
        const { dialog } = require('electron');
        await dialog.showErrorBox('Initialization Error', `Failed to start HealthTrack-AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        electron_1.app.quit();
    }
}
/**
 * Application event handlers
 */
// This method will be called when Electron has finished initialization
electron_1.app.whenReady().then(initializeApp);
// Quit when all windows are closed
electron_1.app.on('window-all-closed', () => {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// On macOS, re-create window when dock icon is clicked
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// Security: Prevent new window creation
electron_1.app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        // Prevent new window creation
        event.preventDefault();
        electron_1.shell.openExternal(navigationUrl);
    });
});
// Handle app shutdown
electron_1.app.on('before-quit', async () => {
    console.log('🛑 HealthTrack-AI shutting down...');
    // Stop scheduled cache cleanup job
    stopCacheCleanupJob();
    // Database cleanup will be handled by the SQLite database service
});
// Development: Enable live reload for Electron in development
if (env_1.isDev) {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}
//# sourceMappingURL=main.js.map
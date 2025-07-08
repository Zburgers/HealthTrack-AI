import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { isDev } from './utils/env';
import { initializeSqliteDatabase, getSqliteDbPath, cleanupExpiredAiCache } from './db/sqlite-db';
import { setupIpcHandlers } from './ipc/handlers';
// Removed unused import of initializeDatabase

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let cacheCleanupInterval: NodeJS.Timeout | null = null;

/**
 * Create the main application window
 */
function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,    webPreferences: {
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
  const startUrl = isDev 
    ? 'http://localhost:9002' 
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      
      // Open DevTools in development
      if (isDev) {
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
    shell.openExternal(url);
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
function startCacheCleanupJob(): void {
  // Clean up expired cache entries every hour (3600000 ms)
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  console.log('🗑️ Starting AI cache cleanup job (runs every hour)...');
  
  // Run initial cleanup
  cleanupExpiredAiCache().catch(error => {
    console.error('❌ Initial cache cleanup failed:', error);
  });
  
  // Schedule periodic cleanup
  cacheCleanupInterval = setInterval(async () => {
    try {
      const deletedCount = await cleanupExpiredAiCache();
      if (deletedCount > 0) {
        console.log(`🧹 Scheduled cleanup removed ${deletedCount} expired cache entries`);
      }
    } catch (error) {
      console.error('❌ Scheduled cache cleanup failed:', error);
    }
  }, CLEANUP_INTERVAL);
  
  console.log('✅ AI cache cleanup job started');
}

/**
 * Stop scheduled AI cache cleanup job
 */
function stopCacheCleanupJob(): void {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
    console.log('✅ AI cache cleanup job stopped');
  }
}

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  try {
    console.log('🧠 Initializing HealthTrack-AI...');
    await initializeSqliteDatabase(); // Ensure DB is ready
    setupIpcHandlers(); // Setup all IPC handlers
    await createWindow();
    console.log('✅ HealthTrack-AI Electron app initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    
    // Show error dialog and quit
    const { dialog } = require('electron');
    await dialog.showErrorBox(
      'Initialization Error', 
      `Failed to start HealthTrack-AI: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    app.quit();
  }
}

/**
 * Application event handlers
 */

// This method will be called when Electron has finished initialization
app.whenReady().then(initializeApp);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    // Prevent new window creation
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle app shutdown
app.on('before-quit', async () => {
  console.log('🛑 HealthTrack-AI shutting down...');
  
  // Stop scheduled cache cleanup job
  stopCacheCleanupJob();
  
  // Database cleanup will be handled by the SQLite database service
});

// Development: Enable live reload for Electron in development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

import { app, BrowserWindow, Menu, shell, dialog } from 'electron';
import * as path from 'path';
import * as http from 'http';
import * as fs from 'fs';
import { isDev } from './utils/env';
import { setupDatabaseIPCHandlers } from './ipc/database-handlers';
import './ipc/db-check-status'; // Register db:checkStatus IPC handler
import { setupMongoDBIpcHandlers } from './ipc/mongodb-handlers';

// 🎯 Clara's Switchboard Architecture - Central Data Source Management
import { getDataSourceManager } from './lib/DataSourceManager';

import { MongoDBAtlasDataSource } from './lib/datasources/MongoDBAtlasDataSource';

// --- GTK / X11 fixes for Linux ---
if (process.platform === 'linux') {
  process.env.GDK_BACKEND = 'x11';
  process.env.ELECTRON_DISABLE_WAYLAND = '1';
  process.env.ELECTRON_FORCE_X11 = '1';
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('disable-web-security');
  app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
}

// Mark that we're in Electron
process.env.ELECTRON_ENV = 'true';
process.env.IS_ELECTRON = 'true';


let mainWindow: BrowserWindow | null = null;
let cacheCleanupInterval: NodeJS.Timeout | null = null;

/**
 * Waits for Next.js root page to respond 200 OK
 */
async function waitForNextJsRootPage(url: string, timeoutMs = 60000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, { timeout: 5000 }, (res) => {
          res.statusCode === 200 ? resolve() : reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      });
      console.log('✅ Next.js is ready');
      return true;
    } catch {
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  console.warn(`⚠️ Next.js not ready after ${timeoutMs}ms`);
  return false;
}

/**
 * Creates the main BrowserWindow
 */
async function createWindow(): Promise<void> {
  const startUrl = process.env.ELECTRON_ENV === 'true'
    ? 'http://localhost:9002'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  if (process.env.ELECTRON_ENV === 'true') {
    console.log('⏳ [NEXT] Waiting for Next.js server...');
    const ready = await waitForNextJsRootPage(startUrl);
    if (!ready) console.warn('⚠️ [NEXT] Proceeding without Next.js confirmation');
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../public/assets/healthtrack.ico'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
  });

  console.log(`🔗 [WINDOW] Loading: ${startUrl}`);
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    console.log('✅ [WINDOW] Application window ready');
    mainWindow?.show();
    if (process.env.ELECTRON_ENV === 'true') {
      console.log('🔧 [DEV] Opening DevTools for development');
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.warn(`❌ [WINDOW] Failed to load (${code}): ${desc}`);
    if (code === -102 || code === -105) {
      console.log('⏳ [WINDOW] Retrying in 2 seconds...');
      setTimeout(() => mainWindow?.loadURL(startUrl), 2000);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ [WINDOW] Content loaded successfully');
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // External links
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (e, navUrl) => {
    const origin = new URL(navUrl).origin;
    if ((process.env.ELECTRON_ENV === 'true' && !origin.startsWith('http://localhost:9002')) || 
        (process.env.ELECTRON_ENV !== 'true' && !navUrl.startsWith('file://'))) {
      e.preventDefault();
      shell.openExternal(navUrl);
    }
  });
}

/**
 * Sets up the main application menu
 */
function setupAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    { label: 'File', submenu: [
        { label: 'Settings…', accelerator: 'CmdOrCtrl+,', click: () => mainWindow?.webContents.send('navigate', '/settings') },
        { type: 'separator' },
        { label: 'Exit', role: 'quit' },
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { label: 'Help', submenu: [
        { label: 'About HealthTrack AI', click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About HealthTrack AI',
              message: 'HealthTrack AI v0.1.0',
              detail: 'AI-powered healthcare app with MongoDB backend.'
            });
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/**
 * Clears the cache cleanup job
 */
function stopCacheCleanupJob(): void {
  if (cacheCleanupInterval) {
    clearTimeout(cacheCleanupInterval);
    cacheCleanupInterval = null;
    console.log('✅ Cache cleanup stopped');
  }
}

/**
 * 🎯 Initialize Clara's Switchboard Architecture
 * Sets up the centralized data source management system
 */
async function initializeSwitchboard(): Promise<void> {
  console.log('🎯 [SWITCHBOARD] Initializing Clara\'s Switchboard Architecture...');
  
  try {
    // Get the singleton DataSourceManager
    const dataSourceManager = getDataSourceManager();
    

    
    // Register MongoDB Atlas data source (wraps existing Atlas connection)
    const atlasDataSource = new MongoDBAtlasDataSource();
    dataSourceManager.registerDataSource(atlasDataSource);
    console.log('✅ [SWITCHBOARD] MongoDB Atlas data source registered');
    
    // Initialize the DataSourceManager
    await dataSourceManager.initialize();
    
    console.log('🎯 [SWITCHBOARD] Switchboard Architecture initialized successfully!');
    console.log('📡 [SWITCHBOARD] Available data sources:', 
      dataSourceManager.getAvailableSources().map(s => `${s.id} (${s.name})`).join(', '));
    
    // 🎯 Auto-initialize case embeddings database if URI is available
    await autoInitializeCaseEmbeddings(dataSourceManager);
      
  } catch (error) {
    console.error('❌ [SWITCHBOARD] Failed to initialize Switchboard Architecture:', error);
    throw error;
  }
}

/**
 * 🎯 Auto-initialize case embeddings database
 * This should connect automatically if MONGODB_URI environment variable is set
 * or if it's available in healthtrack-settings.json
 */
async function autoInitializeCaseEmbeddings(dataSourceManager: any): Promise<void> {
  console.log('🔬 [CASE-EMBEDDINGS] Checking auto-initialization...');
  
  try {
    // First check if we have a URI in the settings file
    let caseEmbeddingsUri = process.env.MONGODB_URI;
    const settingsFilePath = path.join(process.cwd(), 'healthtrack-settings.json');
    
    // Try to load from settings file if it exists
    try {
      if (fs.existsSync(settingsFilePath)) {
        console.log('📄 [SETTINGS] Found settings file:', settingsFilePath);
        const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
        
        if (settings.mongoUri) {
          console.log('✅ [SETTINGS] Found mongoUri in settings file');
          caseEmbeddingsUri = settings.mongoUri;
          
          // Set it as environment variable for other parts of the app
          process.env.MONGODB_URI = settings.mongoUri;
        }
      }
    } catch (settingsError) {
      console.error('❌ [SETTINGS] Error reading settings file:', settingsError);
    }
    
    if (caseEmbeddingsUri) {
      console.log('✅ [CASE-EMBEDDINGS] Found MongoDB URI');
      console.log('🔌 [CASE-EMBEDDINGS] Auto-connecting to case embeddings database...');
      
      // Connect to Atlas with the case embeddings URI
      await dataSourceManager.connectDataSource('mongodb-atlas', { 
        uri: caseEmbeddingsUri,
        autoConnect: true,
        purpose: 'case-embeddings'
      });
      
      // Also auto-connect for user data with the same URI
      console.log('🔌 [USER-DATA] Auto-connecting user data database...');
      await dataSourceManager.connectDataSource('mongodb-atlas', {
        uri: caseEmbeddingsUri,
        purpose: 'user-data',
        autoConnect: false
      });
      
      console.log('✅ [DATABASES] Databases auto-initialized successfully');
    } else {
      console.log('⚠️ [CASE-EMBEDDINGS] No MongoDB URI found. Databases will need manual setup.');
    }
  } catch (error) {
    console.error('❌ [CASE-EMBEDDINGS] Failed to auto-initialize databases:', error);
    // Don't throw - this is optional auto-initialization
  }
}

/**
 * Initializes the app
 */
async function initializeApp(): Promise<void> {
  console.log('🧠 Initializing HealthTrack-AI...');

  await createWindow();
  setupAppMenu();

  // Smart caching placeholder
  cacheCleanupInterval = setTimeout(() => console.log('✅ Smart cache ready'), 10000);

  console.log('✅ App initialization complete');
}

// App event handlers
app.whenReady().then(async () => {
  console.log('🚀 [HEALTHTRACK] Starting HealthTrack AI with Switchboard Architecture...');
  try {
    // 🎯 Initialize Clara's Switchboard Architecture first
    console.log('🎯 [SWITCHBOARD] Setting up centralized data source management...');
    await initializeSwitchboard();
    console.log('✅ [SWITCHBOARD] Switchboard Architecture ready!');
    

    
    // Keep existing IPC handlers for backward compatibility during transition
    console.log('🔌 [IPC] Setting up legacy database handlers...');
    setupDatabaseIPCHandlers();
    setupMongoDBIpcHandlers();
    console.log('✅ [IPC] All database handlers ready');
    
    console.log('🖼️ [WINDOW] Creating application window...');
    await initializeApp();
    console.log('✅ [HEALTHTRACK] Application ready with Switchboard Architecture!');
  } catch (error) {
    console.error('❌ [HEALTHTRACK] Failed to initialize:', error);
    dialog.showErrorBox('Initialization Error', 'Failed to start HealthTrack AI. Please check the logs and try again.');
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', async () => {
  console.log('👋 [HEALTHTRACK] Shutting down...');
  
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
  }
  console.log('✅ [HEALTHTRACK] Shutdown complete');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

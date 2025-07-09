import { app, BrowserWindow, Menu, shell, dialog } from 'electron';
import * as path from 'path';
import * as http from 'http';
import { isDev } from './utils/env';
import { startLocalDatabase, stopLocalDatabase } from './lib/local-db';
import { setupDatabaseIPCHandlers } from './ipc/database-handlers';
import { setupMongoDBIpcHandlers } from './ipc/mongodb-handlers';

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
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

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
  console.log('🚀 [HEALTHTRACK] Starting HealthTrack AI...');
  try {
    console.log('📊 [DATABASE] Skipping local database initialization (using remote only)...');
    // await startLocalDatabase(); // Disabled for remote-only mode
    console.log('✅ [DATABASE] Database setup ready');
    
    console.log('🔌 [IPC] Setting up database handlers...');
    setupDatabaseIPCHandlers();
    setupMongoDBIpcHandlers();
    console.log('✅ [IPC] All database handlers ready');
    
    console.log('🖼️ [WINDOW] Creating application window...');
    createWindow();
    setupAppMenu();
    console.log('✅ [HEALTHTRACK] Application ready!');
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
  await stopLocalDatabase();
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

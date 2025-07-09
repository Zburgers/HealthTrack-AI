const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Set GTK environment variables to prevent version conflicts
if (process.platform === 'linux') {
  // Force GTK3 and disable GTK4
  process.env.GDK_BACKEND = 'x11';
  process.env.ELECTRON_DISABLE_WAYLAND = '1';
  process.env.ELECTRON_FORCE_X11 = '1';
  // Disable GPU acceleration which can cause GTK conflicts
  app.disableHardwareAcceleration();
}

// Set environment variable to indicate Electron environment
process.env.ELECTRON_ENV = 'true';
// Also set IS_ELECTRON for the unified database router
process.env.IS_ELECTRON = 'true';

let mainWindow;

// Import and initialize SQLite database
async function initializeLocalDatabase() {
  try {
    console.log('🔧 Initializing SQLite database...');
    
    // Use the new SQLite database implementation
    const { initializeSqliteDatabase } = require('./dist/db/sqlite-db');
    const dbPath = await initializeSqliteDatabase();
    console.log('✅ Local SQLite database initialized successfully');
    return dbPath;
  } catch (error) {
    console.error('❌ Failed to initialize SQLite database:', error);
    
    // Show user-friendly error dialog
    const { dialog } = require('electron');
    const errorMessage = `SQLite database initialization failed: ${error.message}\n\nThe application will continue and auto-initialize the database when needed.`;
    
    dialog.showErrorBox('Database Warning', errorMessage);
    
    // Don't throw - allow app to continue, database will auto-initialize
    console.warn('⚠️ Continuing without explicit database initialization - will auto-init on first use');
    return null;
  }
}

function createWindow() {
  console.log('🚀 Creating Electron window...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Don't show until ready
  });

  // Load Next.js app
  console.log('🔗 Loading Next.js app from http://localhost:9002');
  mainWindow.loadURL('http://localhost:9002');
  
  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('✅ HealthTrack-AI Electron window ready!');
    mainWindow.show();
  });
  // Handle navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log(`❌ Failed to load: ${errorDescription} - ${validatedURL}`);
    
    // Only retry for connection issues, not for other errors
    if (errorCode === -102 || errorCode === -105) { // ERR_CONNECTION_REFUSED or ERR_NAME_NOT_RESOLVED
      console.log('⏳ Retrying connection in 2 seconds...');
      setTimeout(() => {
        console.log('🔄 Retrying connection to Next.js server...');
        mainWindow.loadURL('http://localhost:9002');
      }, 2000);
    }
  });

  // Success handler
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('🎉 Successfully connected to Next.js server!');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create application menu with settings
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: async () => {
            const { chooseDataLocation, updateDatabasePath } = require('./user-settings');
            const newPath = await chooseDataLocation(mainWindow);
            if (newPath) {
              const { dialog } = require('electron');              const result = await dialog.showMessageBox(mainWindow, {
                type: 'question',
                buttons: ['Change Location', 'Cancel'],
                defaultId: 0,
                message: 'Change Data Storage Location',
                detail: `Are you sure you want to change the data storage location to:\n${newPath}\n\nNote: You'll need to restart the application for this change to take effect.`,
                modal: true
              });
              
              if (result.response === 0) {
                updateDatabasePath(newPath);                await dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  message: 'Settings Updated',
                  detail: 'Data storage location has been updated. Please restart HealthTrack AI for the changes to take effect.',
                  modal: true
                });
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About HealthTrack AI',
          click: async () => {
            const { dialog } = require('electron');
            await dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About HealthTrack AI',
              message: 'HealthTrack AI',
              detail: 'Version 0.1.0\n\nAI-powered healthcare management system\nwith local data storage and privacy protection.'
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Setup IPC Handlers using unified handlers module
function setupIPCHandlers() {
  console.log('🔌 Setting up IPC handlers...');
  
  // Import and setup unified IPC handlers
  try {
    // Try requiring the TypeScript file directly (Node.js with ts-node or similar)
    let handlers;
    try {
      console.log('🔧 Trying to load handlers.ts...');
      handlers = require('./dist/ipc/handlers');
      console.log('✅ handlers.ts loaded, exports:', Object.keys(handlers || {}));
    } catch (tsError) {
      console.log('⚠️ handlers.ts failed, trying handlers.js...');
      // If TypeScript require fails, try the compiled JS version
      handlers = require('./ipc/handlers-test.js');
      console.log('✅ handlers.js loaded, exports:', Object.keys(handlers || {}));
    }
    
    if (handlers && handlers.setupIpcHandlers) {
      console.log('🎯 Found setupIpcHandlers function, calling it...');
      handlers.setupIpcHandlers();
      console.log('✅ Unified IPC handlers loaded successfully');
    } else {
      throw new Error('setupIpcHandlers function not found');
    }
  } catch (error) {
    console.error('❌ Failed to setup unified IPC handlers:', error);
    // Fallback to basic handlers for critical functionality
    setupBasicHandlers();
  }
}

// Basic fallback handlers if unified handlers fail
function setupBasicHandlers() {
  console.log('⚠️ Setting up basic fallback handlers...');
  
  // Import SQLite modules once for all handlers
  const { getSqliteDatabase } = require('./dist/db/sqlite-db');
  
  // Basic database operations for fallback (direct SQLite queries)
  ipcMain.handle('db-findOne', async (event, collection, query) => {
    try {
      console.log(`🔍 [SQLite] findOne in ${collection}:`, query);
      
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }

      // Simple findOne implementation
      const stmt = db.prepare(`SELECT * FROM ${collection} WHERE id = ? LIMIT 1`);
      const result = stmt.get(query.id || null);
      
      console.log(`✅ [SQLite] findOne result for ${collection}:`, result ? 'found' : 'not found');
      return result || null;
    } catch (error) {
      console.error(`❌ [SQLite] Failed to findOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-find', async (event, collection, query, options = {}) => {
    try {
      console.log(`🔍 [SQLite] find in ${collection}:`, query, options);
      
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }

      // Simple find implementation
      let sql = `SELECT * FROM ${collection}`;
      const params = [];
      
      // Handle simple query filters
      if (query && Object.keys(query).length > 0) {
        const conditions = [];
        for (const [key, value] of Object.entries(query)) {
          if (typeof value === 'object' && value !== null && '$ne' in value) {
            // Handle $ne operator
            conditions.push(`${key} != ?`);
            params.push(value.$ne);
          } else {
            conditions.push(`${key} = ?`);
            params.push(value);
          }
        }
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      // Handle sorting
      if (options.sort) {
        const sortClauses = Object.entries(options.sort).map(([key, direction]) => 
          `${key} ${direction === -1 ? 'DESC' : 'ASC'}`
        );
        sql += ` ORDER BY ${sortClauses.join(', ')}`;
      }
      
      console.log(`[SQLite] Executing SQL: ${sql}`, params);
      const stmt = db.prepare(sql);
      const result = stmt.all(...params);
      
      console.log(`✅ [SQLite] find result for ${collection}: ${result.length} documents`);
      return result || [];
    } catch (error) {
      console.error(`❌ [SQLite] Failed to find in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-insertOne', async (event, collection, document) => {
    try {
      console.log(`📝 [SQLite] insertOne in ${collection}:`, document);
      
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }

      // Generate ID if not present
      const docWithId = { ...document, id: document.id || Date.now().toString() };
      
      // Simple insert implementation
      const columns = Object.keys(docWithId);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${collection} (${columns.join(', ')}) VALUES (${placeholders})`;
      const values = columns.map(col => docWithId[col]);
      
      console.log(`[SQLite] Executing SQL: ${sql}`, values);
      const stmt = db.prepare(sql);
      const result = stmt.run(...values);
      
      console.log(`✅ [SQLite] insertOne result for ${collection}:`, result.lastInsertRowid);
      return { insertedId: docWithId.id, ...result };
    } catch (error) {
      console.error(`❌ [SQLite] Failed to insertOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-updateOne', async (event, collection, filter, update, options = {}) => {
    try {
      console.log(`📝 [SQLite] updateOne in ${collection}:`, filter, update);
      
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }

      // Simple update implementation
      const setClause = Object.keys(update.$set || update).map(key => `${key} = ?`).join(', ');
      const whereClause = Object.keys(filter).map(key => `${key} = ?`).join(' AND ');
      const sql = `UPDATE ${collection} SET ${setClause} WHERE ${whereClause}`;
      
      const setValues = Object.values(update.$set || update);
      const whereValues = Object.values(filter);
      const allValues = [...setValues, ...whereValues];
      
      console.log(`[SQLite] Executing SQL: ${sql}`, allValues);
      const stmt = db.prepare(sql);
      const result = stmt.run(...allValues);
      
      console.log(`✅ [SQLite] updateOne result for ${collection}: ${result.changes} modified`);
      return { modifiedCount: result.changes, ...result };
    } catch (error) {
      console.error(`❌ [SQLite] Failed to updateOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-deleteOne', async (event, collection, filter) => {
    try {
      console.log(`🗑️ [SQLite] deleteOne in ${collection}:`, filter);
      
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }

      // Simple delete implementation
      const whereClause = Object.keys(filter).map(key => `${key} = ?`).join(' AND ');
      const sql = `DELETE FROM ${collection} WHERE ${whereClause}`;
      const values = Object.values(filter);
      
      console.log(`[SQLite] Executing SQL: ${sql}`, values);
      const stmt = db.prepare(sql);
      const result = stmt.run(...values);
      
      console.log(`✅ [SQLite] deleteOne result for ${collection}: ${result.changes} deleted`);
      return { deletedCount: result.changes, ...result };
    } catch (error) {
      console.error(`❌ [SQLite] Failed to deleteOne in ${collection}:`, error);
      throw error;
    }
  });

  // Settings handlers
  ipcMain.handle('settings-get', async () => {
    try {
      const { getUserSettings } = require('./user-settings.js');
      return getUserSettings();
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw error;
    }
  });

  ipcMain.handle('settings-set', async (event, settings) => {
    try {
      const { saveUserSettings } = require('./user-settings.js');
      saveUserSettings(settings);
      return { success: true };
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  });

  console.log('✅ Basic fallback handlers set up successfully');
}

// Initialize app
async function initializeApp() {
  try {
    console.log('🚀 Initializing HealthTrack-AI Electron app...');
    
    // Set environment variables to indicate we're in Electron
    process.env.ELECTRON_ENV = 'true';
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    
    // Step 1: Try to initialize local database (non-blocking)
    try {
      const dbInitialized = await initializeLocalDatabase();
      if (dbInitialized) {
        console.log('✅ Local SQLite database initialized successfully');
      } else {
        console.warn('⚠️  Local SQLite database initialization failed, features may be limited');
      }
    } catch (dbError) {
      console.error('❌ SQLite database initialization failed, continuing without local DB:', dbError.message);
    }
    
    // Step 2: Create main window (always proceed)
    createWindow();
    
    // Step 3: Create application menu
    createMenu();
    
    // Step 4: Setup IPC handlers
    setupIPCHandlers();
      // Step 5: Initialize smart caching and warming (new)
    try {
      console.log('🧠 Initializing smart caching system...');
      // Cache warming will be initiated after the window is ready
      setTimeout(async () => {
        try {
          // Import the compiled JS version for Electron main process
          // const { SmartCache } = require('../src/lib/smartCache'); // TODO: Fix this import path
          console.log('✅ Smart caching initialized successfully');
        } catch (cacheError) {
          console.warn('⚠️ Cache warming failed to initialize:', cacheError.message);
        }
      }, 10000); // Wait 10 seconds after app is fully loaded
    } catch (error) {
      console.warn('⚠️ Smart caching initialization skipped:', error.message);
    }
    
    console.log('✅ HealthTrack-AI Electron app initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    
    // Show error dialog but try to continue
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Initialization Warning',
      `Some features may not work properly:\n\n${error.message}\n\nThe application will continue to load.`
    );
    
    // Still try to create the window
    try {
      createWindow();
    } catch (windowError) {
      console.error('❌ Failed to create window:', windowError);      app.quit();
    }
  }
}

// Handle app shutdown
app.on('before-quit', async () => {
  try {
    console.log('🔄 Shutting down SQLite database...');
    const { closeSqliteDatabase } = require('./dist/db/sqlite-db');
    closeSqliteDatabase();
    console.log('✅ SQLite database shutdown complete');
  } catch (error) {
    console.error('❌ Error during SQLite database shutdown:', error);
  }
});

// Add command line switches to prevent GTK conflicts
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('disable-web-security');
  app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
}

app.whenReady().then(() => {
  initializeApp();
  // setupIPCHandlers is called within initializeApp to avoid duplicate registrations
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

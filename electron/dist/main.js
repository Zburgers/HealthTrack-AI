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
const http = __importStar(require("http"));
const handlers_1 = require("./ipc/handlers");
const mongodb_handlers_1 = require("./ipc/mongodb-handlers");
// --- GTK / X11 fixes for Linux ---
if (process.platform === 'linux') {
    process.env.GDK_BACKEND = 'x11';
    process.env.ELECTRON_DISABLE_WAYLAND = '1';
    process.env.ELECTRON_FORCE_X11 = '1';
    electron_1.app.disableHardwareAcceleration();
    electron_1.app.commandLine.appendSwitch('disable-gpu');
    electron_1.app.commandLine.appendSwitch('no-sandbox');
    electron_1.app.commandLine.appendSwitch('disable-dev-shm-usage');
    electron_1.app.commandLine.appendSwitch('disable-web-security');
    electron_1.app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
}
// Mark that we're in Electron
process.env.ELECTRON_ENV = 'true';
process.env.IS_ELECTRON = 'true';
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}
let mainWindow = null;
let cacheCleanupInterval = null;
/**
 * Waits for Next.js root page to respond 200 OK
 */
async function waitForNextJsRootPage(url, timeoutMs = 60000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(url, { timeout: 5000 }, (res) => {
                    res.statusCode === 200 ? resolve() : reject(new Error(`Status ${res.statusCode}`));
                });
                req.on('error', reject);
                req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
            });
            console.log('✅ Next.js is ready');
            return true;
        }
        catch {
            await new Promise(res => setTimeout(res, 1000));
        }
    }
    console.warn(`⚠️ Next.js not ready after ${timeoutMs}ms`);
    return false;
}
/**
 * Creates the main BrowserWindow
 */
async function createWindow() {
    console.log('🚀 Creating Electron window...');
    const startUrl = process.env.ELECTRON_ENV === 'true'
        ? 'http://localhost:9002'
        : `file://${path.join(__dirname, '../out/index.html')}`;
    if (process.env.ELECTRON_ENV === 'true') {
        const ready = await waitForNextJsRootPage(startUrl);
        if (!ready)
            console.warn('Proceeding even though Next.js is not ready');
    }
    mainWindow = new electron_1.BrowserWindow({
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
    console.log(`🔗 Loading URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);
    mainWindow.once('ready-to-show', () => {
        console.log('✅ Window ready-to-show');
        mainWindow?.show();
        if (process.env.ELECTRON_ENV === 'true')
            mainWindow?.webContents.openDevTools();
    });
    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
        console.warn(`❌ did-fail-load (${code}): ${desc} @ ${url}`);
        if (code === -102 || code === -105) {
            console.log('⏳ Retrying...');
            setTimeout(() => mainWindow?.loadURL(startUrl), 2000);
        }
    });
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('🎉 Connected to Next.js');
    });
    mainWindow.on('closed', () => { mainWindow = null; });
    // External links
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    mainWindow.webContents.on('will-navigate', (e, navUrl) => {
        const origin = new URL(navUrl).origin;
        if ((process.env.ELECTRON_ENV === 'true' && !origin.startsWith('http://localhost:9002')) ||
            (process.env.ELECTRON_ENV !== 'true' && !navUrl.startsWith('file://'))) {
            e.preventDefault();
            electron_1.shell.openExternal(navUrl);
        }
    });
}
/**
 * Builds the application menu
 */
function createMenu() {
    const template = [
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
                        electron_1.dialog.showMessageBox(mainWindow, {
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
        template.unshift({ label: electron_1.app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] });
    }
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
}
/**
 * Clears the cache cleanup job
 */
function stopCacheCleanupJob() {
    if (cacheCleanupInterval) {
        clearTimeout(cacheCleanupInterval);
        cacheCleanupInterval = null;
        console.log('✅ Cache cleanup stopped');
    }
}
/**
 * Initializes the app
 */
async function initializeApp() {
    console.log('🧠 Initializing HealthTrack-AI...');
    try {
        await (0, handlers_1.setupIpcHandlers)();
        console.log('✅ IPC handlers and MongoDB ready');
    }
    catch (err) {
        console.error('❌ IPC/Mongo setup failed', err);
        electron_1.dialog.showErrorBox('Init Error', `Database connection failed:
${err}`);
    }
    await createWindow();
    createMenu();
    // Smart caching placeholder
    cacheCleanupInterval = setTimeout(() => console.log('✅ Smart cache ready'), 10000);
    console.log('✅ App initialization complete');
}
// App event handlers
electron_1.app.whenReady().then(initializeApp);
electron_1.app.on('window-all-closed', () => { if (process.platform !== 'darwin')
    electron_1.app.quit(); });
electron_1.app.on('activate', () => { if (!mainWindow)
    initializeApp(); });
electron_1.app.on('before-quit', async () => {
    console.log('🛑 Shutting down...');
    stopCacheCleanupJob();
    try {
        await (0, mongodb_handlers_1.closeMongoDBConnection)();
        console.log('✅ MongoDB closed');
    }
    catch (err) {
        console.error('❌ MongoDB close failed', err);
    }
});
electron_1.app.on('web-contents-created', (_e, contents) => contents.on('new-window', e => e.preventDefault()));
//# sourceMappingURL=main.js.map
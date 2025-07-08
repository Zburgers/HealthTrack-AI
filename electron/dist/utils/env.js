"use strict";
/**
 * Environment utilities for Electron app
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isElectron = exports.isDev = void 0;
exports.getAppDataPath = getAppDataPath;
exports.getPlatform = getPlatform;
exports.isOnline = isOnline;
/**
 * Check if running in development mode
 */
exports.isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
/**
 * Check if running in Electron environment
 */
exports.isElectron = process.versions?.electron !== undefined;
/**
 * Get the app data directory
 */
function getAppDataPath() {
    const { app } = require('electron');
    return app.getPath('userData');
}
/**
 * Get the platform
 */
function getPlatform() {
    return process.platform;
}
/**
 * Check if online (for Electron main process, always assume online)
 */
function isOnline() {
    // In Electron main process, navigator is not available
    // For now, we'll assume we're online and let network requests handle connectivity
    return true;
}
//# sourceMappingURL=env.js.map
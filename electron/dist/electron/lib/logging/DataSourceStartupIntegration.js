"use strict";
/**
 * HealthTrack AI - DataSource Manager Startup Integration
 *
 * This module integrates the DataSourceManager logging with the application startup process.
 * It hooks into the existing electron-launcher.sh and main.ts initialization flow.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourceStartupIntegration = void 0;
exports.initializeDataSourceLogging = initializeDataSourceLogging;
exports.autoInitializeOnAppReady = autoInitializeOnAppReady;
exports.integrateWithMainStartup = integrateWithMainStartup;
exports.setupLauncherHooks = setupLauncherHooks;
const electron_1 = require("electron");
const DataSourceManagerLogger_1 = require("./DataSourceManagerLogger");
const DataSourceManager_1 = require("../DataSourceManager");
/**
 * Initialize DataSource Manager logging during application startup
 */
async function initializeDataSourceLogging(config) {
    const startTime = Date.now();
    const finalConfig = {
        enableFileLogging: true,
        enableConsoleLogging: !process.env.SILENT_LOGGING,
        logLevel: process.env.LOG_LEVEL || 'info',
        silentMode: !!process.env.SILENT_LOGGING,
        ...config
    };
    try {
        // Get the global logger (auto-configures from healthtrack-settings.json)
        const logger = (0, DataSourceManagerLogger_1.getGlobalDataSourceLogger)();
        // Log startup information with minimal console output
        if (!finalConfig.silentMode) {
            logger.logDataSourceEvent('startup', 'connect', {
                operation: 'initialize_logging',
                app_version: electron_1.app?.getVersion() || 'unknown',
                node_env: process.env.NODE_ENV,
                electron_env: process.env.ELECTRON_ENV,
                log_level: finalConfig.logLevel,
                file_logging: finalConfig.enableFileLogging,
                console_logging: finalConfig.enableConsoleLogging
            });
        }
        // Initialize the DataSourceManager with logging
        const dataSourceManager = (0, DataSourceManager_1.getDataSourceManager)();
        // Log completion
        const duration = Date.now() - startTime;
        if (!finalConfig.silentMode) {
            logger.logPerformance('datasource_logging_startup', duration, {
                success: true,
                log_file: logger.getLogFile()
            });
        }
    }
    catch (error) {
        // Fail silently to avoid disrupting app startup
        console.error('[DSM-LOG] Failed to initialize logging:', error instanceof Error ? error.message : String(error));
    }
}
/**
 * Hook into Electron app ready event for automatic initialization
 */
function autoInitializeOnAppReady() {
    // Only auto-initialize if not already done
    if (!electron_1.app.isReady()) {
        electron_1.app.whenReady().then(() => {
            initializeDataSourceLogging({
                silentMode: process.env.SILENT_DATASOURCE_LOGGING === 'true'
            });
        });
    }
    else {
        // App is already ready, initialize immediately
        initializeDataSourceLogging({
            silentMode: process.env.SILENT_DATASOURCE_LOGGING === 'true'
        });
    }
}
/**
 * Integration with existing main.ts startup flow
 */
async function integrateWithMainStartup() {
    try {
        // Initialize with minimal output during startup
        await initializeDataSourceLogging({
            silentMode: process.env.NODE_ENV === 'production',
            enableConsoleLogging: process.env.NODE_ENV !== 'production'
        });
        // Get DataSourceManager to ensure it's initialized with logging
        const dataSourceManager = (0, DataSourceManager_1.getDataSourceManager)();
        const logger = (0, DataSourceManagerLogger_1.getGlobalDataSourceLogger)();
        // Log that integration is complete
        logger.logDataSourceEvent('main_startup', 'connect', {
            operation: 'integration_complete',
            available_sources: dataSourceManager.getAvailableSources().length
        });
    }
    catch (error) {
        // Continue silently to avoid breaking app startup
        console.warn('[DSM-LOG] Startup integration warning:', error instanceof Error ? error.message : String(error));
    }
}
/**
 * Hook for electron-launcher.sh script integration
 */
function setupLauncherHooks() {
    // Hook into process events for clean logging shutdown
    process.on('SIGTERM', () => {
        const logger = (0, DataSourceManagerLogger_1.getGlobalDataSourceLogger)();
        logger.logDataSourceEvent('process', 'disconnect', {
            operation: 'shutdown_sigterm',
            signal: 'SIGTERM'
        });
    });
    process.on('SIGINT', () => {
        const logger = (0, DataSourceManagerLogger_1.getGlobalDataSourceLogger)();
        logger.logDataSourceEvent('process', 'disconnect', {
            operation: 'shutdown_sigint',
            signal: 'SIGINT'
        });
    });
    process.on('exit', (code) => {
        const logger = (0, DataSourceManagerLogger_1.getGlobalDataSourceLogger)();
        logger.logDataSourceEvent('process', 'disconnect', {
            operation: 'process_exit',
            exit_code: code
        });
    });
}
/**
 * Export for easy integration into existing startup scripts
 */
exports.DataSourceStartupIntegration = {
    initialize: initializeDataSourceLogging,
    autoInit: autoInitializeOnAppReady,
    integrateWithMain: integrateWithMainStartup,
    setupLauncherHooks,
    // Convenience methods for common scenarios
    silent: () => initializeDataSourceLogging({ silentMode: true }),
    verbose: () => initializeDataSourceLogging({
        silentMode: false,
        logLevel: 'debug',
        enableConsoleLogging: true
    }),
    production: () => initializeDataSourceLogging({
        silentMode: true,
        enableFileLogging: true,
        enableConsoleLogging: false,
        logLevel: 'info'
    })
};
//# sourceMappingURL=DataSourceStartupIntegration.js.map
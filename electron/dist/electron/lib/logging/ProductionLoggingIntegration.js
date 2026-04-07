"use strict";
/**
 * Logging System Integration Script
 *
 * This script integrates the DatabaseLogger with your existing launcher infrastructure
 * and provides enterprise-grade logging for all database operations.
 *
 * Integration Points:
 * - electron-launcher.sh log management
 * - enterprise-runner.sh logging infrastructure
 * - healthtrack-settings.json configuration
 * - DataSourceManager operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeProductionLogging = initializeProductionLogging;
exports.getProductionLogger = getProductionLogger;
exports.logLauncherEvent = logLauncherEvent;
exports.logFromCLI = logFromCLI;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DatabaseLogger_1 = require("./DatabaseLogger");
let logger = null;
/**
 * Initialize the production logging system
 * Called from main.ts during Electron startup
 */
async function initializeProductionLogging() {
    try {
        console.log('🚀 [LOGGING_INIT] Initializing production database logging system...');
        // Determine the correct settings path
        const settingsPath = findSettingsFile();
        // Create logger with settings from healthtrack-settings.json
        logger = (0, DatabaseLogger_1.createDatabaseLogger)(settingsPath);
        // Log system startup
        logger.logDataSourceEvent('system', 'connect', {
            operation: 'logging_system_startup',
            electron_version: process.versions.electron,
            node_version: process.versions.node,
            platform: process.platform,
            arch: process.arch,
            app_version: electron_1.app.getVersion(),
            settings_path: settingsPath
        });
        // Set up process event listeners for clean logging shutdown
        setupProcessEventListeners();
        // Set up performance monitoring
        setupPerformanceMonitoring();
        console.log('✅ [LOGGING_INIT] Production database logging system initialized successfully');
        // Log initial system state
        logSystemInfo();
        return logger;
    }
    catch (error) {
        console.error('❌ [LOGGING_INIT] Failed to initialize production logging system:', error);
        // Fallback to default logger
        logger = (0, DatabaseLogger_1.createDatabaseLogger)();
        logger.logError(error, 'initializeProductionLogging', {
            operation: 'logging_system_startup',
            fallback_used: true
        });
        return logger;
    }
}
/**
 * Find the healthtrack-settings.json file
 */
function findSettingsFile() {
    const possiblePaths = [
        path_1.default.join(process.cwd(), 'healthtrack-settings.json'),
        path_1.default.join(electron_1.app.getPath('userData'), 'healthtrack-settings.json'),
        path_1.default.join(__dirname, '..', '..', 'healthtrack-settings.json'),
        path_1.default.join(electron_1.app.getAppPath(), 'healthtrack-settings.json')
    ];
    for (const settingsPath of possiblePaths) {
        if (fs_1.default.existsSync(settingsPath)) {
            console.log(`📄 [LOGGING_INIT] Found settings file: ${settingsPath}`);
            return settingsPath;
        }
    }
    console.warn('⚠️ [LOGGING_INIT] No settings file found, using default configuration');
    return undefined;
}
/**
 * Set up process event listeners for graceful shutdown
 */
function setupProcessEventListeners() {
    if (!logger)
        return;
    // Graceful shutdown on app quit
    electron_1.app.on('before-quit', async () => {
        if (logger) {
            logger.logDataSourceEvent('system', 'disconnect', {
                operation: 'application_shutdown',
                reason: 'before_quit_event'
            });
            await logger.shutdown();
        }
    });
    // Handle process termination signals
    const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    shutdownSignals.forEach((signal) => {
        process.on(signal, async () => {
            if (logger) {
                logger.logDataSourceEvent('system', 'disconnect', {
                    operation: 'process_signal_shutdown',
                    signal,
                    pid: process.pid
                });
                await logger.shutdown();
            }
            process.exit(0);
        });
    });
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        if (logger) {
            logger.logError(error, 'process.uncaughtException', {
                operation: 'uncaught_exception',
                pid: process.pid
            });
        }
        console.error('❌ [LOGGING_INIT] Uncaught exception:', error);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        if (logger) {
            logger.logError(new Error(String(reason)), 'process.unhandledRejection', {
                operation: 'unhandled_rejection',
                promise_string: String(promise),
                pid: process.pid
            });
        }
        console.error('❌ [LOGGING_INIT] Unhandled promise rejection:', reason);
    });
    console.log('🛡️ [LOGGING_INIT] Process event listeners configured');
}
/**
 * Set up performance monitoring for the application
 */
function setupPerformanceMonitoring() {
    if (!logger)
        return;
    // Monitor memory usage every 30 seconds
    const memoryMonitorInterval = setInterval(() => {
        const memoryUsage = process.memoryUsage();
        logger.logPerformance('memory_usage', memoryUsage.heapUsed, {
            heap_used: memoryUsage.heapUsed,
            heap_total: memoryUsage.heapTotal,
            external: memoryUsage.external,
            rss: memoryUsage.rss,
            timestamp: Date.now()
        });
        // Warn if memory usage is high (over 500MB)
        if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
            logger.logSecurity('high_memory_usage', 'medium', {
                heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                threshold_mb: 500
            });
        }
    }, 30000);
    // Clean up interval on app quit
    electron_1.app.on('before-quit', () => {
        clearInterval(memoryMonitorInterval);
    });
    console.log('📊 [LOGGING_INIT] Performance monitoring configured');
}
/**
 * Log initial system information
 */
function logSystemInfo() {
    if (!logger)
        return;
    const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        electron_version: process.versions.electron,
        node_version: process.versions.node,
        chrome_version: process.versions.chrome,
        app_version: electron_1.app.getVersion(),
        app_name: electron_1.app.getName(),
        user_data_path: electron_1.app.getPath('userData'),
        app_path: electron_1.app.getAppPath(),
        working_directory: process.cwd(),
        environment: process.env.NODE_ENV || 'unknown',
        memory_usage: process.memoryUsage(),
        uptime: process.uptime()
    };
    logger.logDataSourceEvent('system', 'connect', {
        operation: 'system_info_snapshot',
        ...systemInfo
    });
}
/**
 * Get the current logger instance
 */
function getProductionLogger() {
    return logger;
}
/**
 * Integration with your launcher scripts
 * This function can be called from your bash scripts via node
 */
function logLauncherEvent(script, event, metadata = {}) {
    if (!logger) {
        // If logger not initialized, create a temporary one
        logger = (0, DatabaseLogger_1.createDatabaseLogger)();
    }
    logger.logDataSourceEvent('launcher', 'connect', {
        script,
        event,
        ...metadata,
        timestamp: new Date().toISOString()
    });
}
/**
 * Export function for CLI usage (can be called from bash scripts)
 * Usage: node -e "require('./path/to/this/file').logFromCLI('electron-launcher', 'startup', {})"
 */
function logFromCLI(script, event, metadata = '{}') {
    try {
        const parsedMetadata = JSON.parse(metadata);
        logLauncherEvent(script, event, parsedMetadata);
    }
    catch (error) {
        console.error('Failed to log from CLI:', error);
    }
}
// Export for use in bash scripts via require()
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeProductionLogging,
        getProductionLogger,
        logLauncherEvent,
        logFromCLI
    };
}
//# sourceMappingURL=ProductionLoggingIntegration.js.map
"use strict";
/**
 * HealthTrack AI - Production Database Logging Integration
 *
 * This module provides seamless logging integration for the DataSourceManager
 * with its own prefix [DSM-LOG] and minimal CLI interruption.
 *
 * Features:
 * - Integrates with healthtrack-settings.json logging configuration
 * - Works seamlessly with electron-launcher.sh and main.ts startup process
 * - Provides structured logging for all database operations
 * - Zero configuration required - auto-detects environment
 */
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
exports.DataSourceManagerLogger = void 0;
exports.createDataSourceManagerLogger = createDataSourceManagerLogger;
exports.getGlobalDataSourceLogger = getGlobalDataSourceLogger;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
/**
 * Enhanced Database Logger with DataSourceManager Integration
 */
class DataSourceManagerLogger {
    constructor(config) {
        this.isEnabled = true;
        this.config = config || this.loadDefaultConfig();
        this.logFile = this.resolveLogPath();
        this.rotationSize = this.parseSize(this.config.file.maxSize);
        this.ensureLogDirectory();
        // Initialize with minimal output
        this.logInternal('info', 'switchboard', '[DSM-LOG] Database logging initialized', {
            log_file: this.logFile,
            format: this.config.format,
            outputs: this.config.outputs
        });
    }
    /**
     * Load configuration from healthtrack-settings.json or use defaults
     */
    loadDefaultConfig() {
        try {
            // Try multiple locations for healthtrack-settings.json
            const configPaths = [
                path.join(process.cwd(), 'healthtrack-settings.json'),
                path.join(electron_1.app?.getPath('userData') || process.cwd(), 'healthtrack-settings.json')
            ];
            for (const configPath of configPaths) {
                if (fs.existsSync(configPath)) {
                    const settings = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                    if (settings.logging) {
                        return settings.logging;
                    }
                }
            }
        }
        catch (error) {
            // Silently fall back to defaults
        }
        // Default configuration
        return {
            level: 'info',
            format: 'structured',
            outputs: ['console', 'file'],
            file: {
                path: './logs/database-operations.log',
                maxSize: '10MB',
                retention: '7d'
            },
            categories: {
                database: 'debug',
                connection: 'info',
                queries: 'debug',
                performance: 'info',
                errors: 'error',
                switchboard: 'info'
            }
        };
    }
    /**
     * Resolve the absolute log file path
     */
    resolveLogPath() {
        let logPath = this.config.file.path;
        // Handle relative paths
        if (!path.isAbsolute(logPath)) {
            logPath = path.join(process.cwd(), logPath);
        }
        return logPath;
    }
    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    /**
     * Parse size string (e.g., "10MB") to bytes
     */
    parseSize(sizeStr) {
        const match = sizeStr.match(/^(\d+)(KB|MB|GB)?$/i);
        if (!match)
            return 10 * 1024 * 1024; // Default 10MB
        const size = parseInt(match[1]);
        const unit = (match[2] || 'B').toUpperCase();
        switch (unit) {
            case 'GB': return size * 1024 * 1024 * 1024;
            case 'MB': return size * 1024 * 1024;
            case 'KB': return size * 1024;
            default: return size;
        }
    }
    /**
     * Check if logging level should be processed
     */
    shouldLog(level, category) {
        if (!this.isEnabled)
            return false;
        const categoryLevel = this.config.categories[category] || this.config.level;
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentIndex = levels.indexOf(level);
        const requiredIndex = levels.indexOf(categoryLevel);
        return currentIndex >= requiredIndex;
    }
    /**
     * Rotate log file if it exceeds size limit
     */
    rotateLogFile() {
        try {
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                if (stats.size > this.rotationSize) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const rotatedFile = `${this.logFile}.${timestamp}`;
                    fs.renameSync(this.logFile, rotatedFile);
                }
            }
        }
        catch (error) {
            // Continue silently
        }
    }
    /**
     * Internal logging method
     */
    logInternal(level, category, message, metadata) {
        if (!this.shouldLog(level, category))
            return;
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            category: category,
            message,
            metadata
        };
        // Console output with minimal formatting
        if (this.config.outputs.includes('console')) {
            const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '🔍';
            console.log(`${prefix} [DSM-LOG] ${message}`);
        }
        // File output with structured format
        if (this.config.outputs.includes('file')) {
            try {
                this.rotateLogFile();
                const logLine = this.config.format === 'structured'
                    ? JSON.stringify(entry) + '\n'
                    : `[${entry.timestamp}] [${level.toUpperCase()}] [${category}] ${message}\n`;
                fs.appendFileSync(this.logFile, logLine);
            }
            catch (error) {
                // Continue silently to avoid disrupting application flow
            }
        }
    }
    /**
     * Log DataSource Manager events
     */
    logDataSourceEvent(sourceId, operation, metadata) {
        const message = `DataSource ${sourceId}: ${operation}`;
        const level = operation === 'error' ? 'error' : 'info';
        this.logInternal(level, 'switchboard', message, {
            source_id: sourceId,
            operation,
            ...metadata
        });
    }
    /**
     * Log database connections
     */
    logConnection(type, sourceId, metadata) {
        const message = `Connection ${type}: ${sourceId}`;
        this.logInternal('info', 'connection', message, {
            source_id: sourceId,
            connection_type: type,
            ...metadata
        });
    }
    /**
     * Log database queries
     */
    logQuery(queryType, collection, duration, metadata) {
        const message = `Query ${queryType} on ${collection} (${duration}ms)`;
        this.logInternal('debug', 'queries', message, {
            query_type: queryType,
            collection,
            duration,
            ...metadata
        });
    }
    /**
     * Log performance metrics
     */
    logPerformance(operation, duration, metadata) {
        const message = `Performance: ${operation} completed in ${duration}ms`;
        this.logInternal('info', 'performance', message, {
            operation,
            duration,
            ...metadata
        });
    }
    /**
     * Log errors with context
     */
    logError(error, context, metadata) {
        const message = `Error in ${context}: ${error.message}`;
        this.logInternal('error', 'errors', message, {
            error_name: error.name,
            error_message: error.message,
            error_stack: error.stack,
            context,
            ...metadata
        });
    }
    /**
     * Enable/disable logging (useful for testing)
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (enabled) {
            this.logInternal('info', 'switchboard', '[DSM-LOG] Logging enabled');
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get log file path
     */
    getLogFile() {
        return this.logFile;
    }
}
exports.DataSourceManagerLogger = DataSourceManagerLogger;
/**
 * Create a logger instance with auto-configuration
 */
function createDataSourceManagerLogger(config) {
    return new DataSourceManagerLogger(config);
}
/**
 * Singleton instance for global access
 */
let globalLogger = null;
function getGlobalDataSourceLogger() {
    if (!globalLogger) {
        globalLogger = createDataSourceManagerLogger();
    }
    return globalLogger;
}
//# sourceMappingURL=DataSourceManagerLogger.js.map
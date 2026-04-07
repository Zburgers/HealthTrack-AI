"use strict";
/**
 * DatabaseLogger - Production Database Operations Logging System
 *
 * Integrates with HealthTrack-AI's existing logging infrastructure from:
 * - Enterprise launcher scripts (electron-launcher.sh, enterprise-runner.sh)
 * - DataSourceManager logging patterns
 * - healthtrack-settings.json logging configuration
 *
 * This logger provides structured, categorized logging for all database operations
 * with file rotation, performance metrics, and enterprise-grade observability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseLogger = void 0;
exports.createDatabaseLogger = createDatabaseLogger;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
/**
 * High-performance database logger with enterprise features
 */
class DatabaseLogger extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.fileSize = 0;
        this.writeStream = null;
        this.config = config;
        this.logDir = path_1.default.dirname(config.file.path);
        this.currentLogFile = config.file.path;
        this.maxFileSize = this.parseSize(config.file.maxSize);
        this.ensureLogDirectory();
        this.initializeLogFile();
    }
    /**
     * Singleton accessor - integrates with healthtrack-settings.json
     */
    static getInstance(config) {
        if (!DatabaseLogger.instance) {
            if (!config) {
                // Default configuration if none provided
                config = {
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
                        security: 'info'
                    }
                };
            }
            DatabaseLogger.instance = new DatabaseLogger(config);
        }
        return DatabaseLogger.instance;
    }
    /**
     * Load configuration from healthtrack-settings.json
     */
    static loadFromSettings(settingsPath = './healthtrack-settings.json') {
        try {
            const settingsData = fs_1.default.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            if (settings.logging) {
                return DatabaseLogger.getInstance(settings.logging);
            }
        }
        catch (error) {
            console.warn('⚠️ [DATABASE_LOGGER] Could not load settings, using defaults:', error);
        }
        return DatabaseLogger.getInstance();
    }
    /**
     * 🎯 Connection Operations Logging
     */
    logConnection(operation, source, metadata = {}) {
        this.log('info', 'connection', `Database ${operation}: ${source}`, {
            source,
            operation,
            ...metadata
        });
    }
    /**
     * 🎯 Query Operations Logging
     */
    logQuery(queryType, collection, duration, metadata = {}) {
        this.log('debug', 'queries', `Query executed: ${queryType} on ${collection}`, {
            queryType,
            collection,
            duration,
            ...metadata
        });
    }
    /**
     * 🎯 Performance Metrics Logging
     */
    logPerformance(operation, duration, metadata = {}) {
        this.log('performance', 'performance', `Performance: ${operation} completed in ${duration}ms`, {
            operation,
            duration,
            ...metadata
        });
    }
    /**
     * 🎯 Error Logging with Context
     */
    logError(error, context, metadata = {}) {
        this.log('error', 'errors', `Error in ${context}: ${error.message}`, {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context,
            ...metadata
        }, error);
    }
    /**
     * 🎯 Security Events Logging
     */
    logSecurity(event, severity, metadata = {}) {
        this.log('warn', 'security', `Security event: ${event}`, {
            event,
            severity,
            ...metadata
        });
    }
    /**
     * 🎯 DataSourceManager Integration
     */
    logDataSourceEvent(sourceId, event, metadata = {}) {
        const level = event === 'error' ? 'error' : 'info';
        this.log(level, 'database', `DataSource ${event}: ${sourceId}`, {
            sourceId,
            event,
            ...metadata
        });
    }
    /**
     * Core logging method
     */
    log(level, category, message, metadata = {}, error) {
        // Check if this log level should be output for this category
        if (!this.shouldLog(level, category)) {
            return;
        }
        const logEntry = {
            timestamp: new Date(),
            level,
            category,
            message,
            metadata,
            error
        };
        // Emit event for other systems to listen
        this.emit('log', logEntry);
        // Output to configured destinations
        if (this.config.outputs.includes('console')) {
            this.outputToConsole(logEntry);
        }
        if (this.config.outputs.includes('file')) {
            this.outputToFile(logEntry);
        }
    }
    /**
     * Enhanced console output with colors and formatting
     */
    outputToConsole(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase().padEnd(11);
        const category = entry.category.toUpperCase().padEnd(11);
        // Color coding for different log levels
        const colors = {
            debug: '\x1b[36m', // Cyan
            info: '\x1b[32m', // Green
            warn: '\x1b[33m', // Yellow
            error: '\x1b[31m', // Red
            performance: '\x1b[35m' // Magenta
        };
        const reset = '\x1b[0m';
        const color = colors[entry.level] || '';
        const prefix = `[${timestamp}] ${color}[${level}]${reset} [${category}]`;
        if (this.config.format === 'structured' && Object.keys(entry.metadata || {}).length > 0) {
            console.log(`${prefix} ${entry.message}`);
            console.log(`${' '.repeat(25)} Metadata:`, JSON.stringify(entry.metadata, null, 2));
        }
        else {
            console.log(`${prefix} ${entry.message}`);
        }
        // Log error stack trace if present
        if (entry.error && entry.error.stack) {
            console.log(`${' '.repeat(25)} Stack:`, entry.error.stack);
        }
    }
    /**
     * File output with rotation support
     */
    outputToFile(entry) {
        if (!this.writeStream) {
            this.initializeLogFile();
        }
        const logLine = this.formatLogLine(entry);
        const lineSize = Buffer.byteLength(logLine, 'utf8');
        // Check if we need to rotate the log file
        if (this.fileSize + lineSize > this.maxFileSize) {
            this.rotateLogFile();
        }
        if (this.writeStream) {
            this.writeStream.write(logLine);
            this.fileSize += lineSize;
        }
    }
    /**
     * Format log entry for file output
     */
    formatLogLine(entry) {
        if (this.config.format === 'structured') {
            return JSON.stringify({
                timestamp: entry.timestamp.toISOString(),
                level: entry.level,
                category: entry.category,
                message: entry.message,
                metadata: entry.metadata,
                error: entry.error ? {
                    name: entry.error.name,
                    message: entry.error.message,
                    stack: entry.error.stack
                } : undefined
            }) + '\n';
        }
        else {
            const timestamp = entry.timestamp.toISOString();
            const metadata = entry.metadata && Object.keys(entry.metadata).length > 0
                ? ` ${JSON.stringify(entry.metadata)}`
                : '';
            return `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category.toUpperCase()}] ${entry.message}${metadata}\n`;
        }
    }
    /**
     * Check if log should be output based on level configuration
     */
    shouldLog(level, category) {
        const levelPriority = { debug: 0, info: 1, warn: 2, error: 3, performance: 1 };
        const configuredLevel = this.config.categories[category] || this.config.level;
        return levelPriority[level] >= levelPriority[configuredLevel];
    }
    /**
     * Initialize log directory and file
     */
    ensureLogDirectory() {
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
    }
    /**
     * Initialize log file stream
     */
    initializeLogFile() {
        try {
            // Get current file size if it exists
            if (fs_1.default.existsSync(this.currentLogFile)) {
                const stats = fs_1.default.statSync(this.currentLogFile);
                this.fileSize = stats.size;
            }
            else {
                this.fileSize = 0;
            }
            // Create write stream
            this.writeStream = fs_1.default.createWriteStream(this.currentLogFile, { flags: 'a' });
            this.writeStream.on('error', (error) => {
                console.error('❌ [DATABASE_LOGGER] Log file write error:', error);
            });
        }
        catch (error) {
            console.error('❌ [DATABASE_LOGGER] Failed to initialize log file:', error);
        }
    }
    /**
     * Rotate log file when it gets too large
     */
    rotateLogFile() {
        try {
            if (this.writeStream) {
                this.writeStream.end();
            }
            // Create rotated filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
            // Move current log to rotated name
            fs_1.default.renameSync(this.currentLogFile, rotatedFile);
            // Reset file size and create new log file
            this.fileSize = 0;
            this.initializeLogFile();
            console.log(`🔄 [DATABASE_LOGGER] Log file rotated: ${rotatedFile}`);
            // Clean up old log files based on retention policy
            this.cleanupOldLogs();
        }
        catch (error) {
            console.error('❌ [DATABASE_LOGGER] Log rotation failed:', error);
        }
    }
    /**
     * Clean up old log files based on retention policy
     */
    cleanupOldLogs() {
        try {
            const retentionDays = this.parseRetention(this.config.file.retention);
            const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
            const files = fs_1.default.readdirSync(this.logDir);
            const logFiles = files.filter(file => file.includes('database-operations') && file.endsWith('.log') && file !== path_1.default.basename(this.currentLogFile));
            for (const file of logFiles) {
                const filePath = path_1.default.join(this.logDir, file);
                const stats = fs_1.default.statSync(filePath);
                if (stats.mtime.getTime() < cutoffTime) {
                    fs_1.default.unlinkSync(filePath);
                    console.log(`🗑️ [DATABASE_LOGGER] Cleaned up old log file: ${file}`);
                }
            }
        }
        catch (error) {
            console.error('❌ [DATABASE_LOGGER] Log cleanup failed:', error);
        }
    }
    /**
     * Parse size string (e.g., "10MB") to bytes
     */
    parseSize(sizeStr) {
        const units = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
        const match = sizeStr.match(/^(\d+)(KB|MB|GB)$/i);
        if (match) {
            const [, size, unit] = match;
            return parseInt(size) * (units[unit.toUpperCase()] || 1);
        }
        return 10 * 1024 * 1024; // Default 10MB
    }
    /**
     * Parse retention string (e.g., "7d") to days
     */
    parseRetention(retentionStr) {
        const match = retentionStr.match(/^(\d+)d$/i);
        return match ? parseInt(match[1]) : 7; // Default 7 days
    }
    /**
     * Get logging statistics
     */
    getStats() {
        return {
            currentLogSize: this.fileSize,
            maxLogSize: this.maxFileSize,
            logFile: this.currentLogFile
        };
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        return new Promise((resolve) => {
            if (this.writeStream) {
                this.writeStream.end(() => {
                    console.log('✅ [DATABASE_LOGGER] Shutdown complete');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
}
exports.DatabaseLogger = DatabaseLogger;
DatabaseLogger.instance = null;
// Export convenience function for easy integration
function createDatabaseLogger(settingsPath) {
    return settingsPath
        ? DatabaseLogger.loadFromSettings(settingsPath)
        : DatabaseLogger.getInstance();
}
//# sourceMappingURL=DatabaseLogger.js.map
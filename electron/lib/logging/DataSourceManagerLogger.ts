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

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface DatabaseLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'database' | 'connection' | 'queries' | 'performance' | 'errors' | 'switchboard';
  source_id?: string;
  operation?: string;
  duration?: number;
  message: string;
  metadata?: Record<string, any>;
}

export interface LoggingConfig {
  level: string;
  format: 'structured' | 'simple';
  outputs: ('console' | 'file')[];
  file: {
    path: string;
    maxSize: string;
    retention: string;
  };
  categories: Record<string, string>;
}

/**
 * Enhanced Database Logger with DataSourceManager Integration
 */
export class DataSourceManagerLogger {
  private config: LoggingConfig;
  private logFile: string;
  private isEnabled: boolean = true;
  private rotationSize: number;
  
  constructor(config?: LoggingConfig) {
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
  private loadDefaultConfig(): LoggingConfig {
    try {
      // Try multiple locations for healthtrack-settings.json
      const configPaths = [
        path.join(process.cwd(), 'healthtrack-settings.json'),
        path.join(app?.getPath('userData') || process.cwd(), 'healthtrack-settings.json')
      ];

      for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
          const settings = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (settings.logging) {
            return settings.logging;
          }
        }
      }
    } catch (error) {
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
  private resolveLogPath(): string {
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
  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Parse size string (e.g., "10MB") to bytes
   */
  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+)(KB|MB|GB)?$/i);
    if (!match) return 10 * 1024 * 1024; // Default 10MB
    
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
  private shouldLog(level: string, category: string): boolean {
    if (!this.isEnabled) return false;
    
    const categoryLevel = this.config.categories[category] || this.config.level;
    const levels = ['debug', 'info', 'warn', 'error'];
    
    const currentIndex = levels.indexOf(level);
    const requiredIndex = levels.indexOf(categoryLevel);
    
    return currentIndex >= requiredIndex;
  }

  /**
   * Rotate log file if it exceeds size limit
   */
  private rotateLogFile(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.rotationSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedFile = `${this.logFile}.${timestamp}`;
          fs.renameSync(this.logFile, rotatedFile);
        }
      }
    } catch (error) {
      // Continue silently
    }
  }

  /**
   * Internal logging method
   */
  private logInternal(
    level: 'debug' | 'info' | 'warn' | 'error',
    category: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.shouldLog(level, category)) return;

    const entry: DatabaseLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: category as any,
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
      } catch (error) {
        // Continue silently to avoid disrupting application flow
      }
    }
  }

  /**
   * Log DataSource Manager events
   */
  logDataSourceEvent(
    sourceId: string,
    operation: 'register' | 'connect' | 'disconnect' | 'query' | 'error',
    metadata?: Record<string, any>
  ): void {
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
  logConnection(
    type: 'connect' | 'disconnect' | 'retry',
    sourceId: string,
    metadata?: Record<string, any>
  ): void {
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
  logQuery(
    queryType: string,
    collection: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
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
  logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
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
  logError(
    error: Error,
    context: string,
    metadata?: Record<string, any>
  ): void {
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
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.logInternal('info', 'switchboard', '[DSM-LOG] Logging enabled');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Get log file path
   */
  getLogFile(): string {
    return this.logFile;
  }
}

/**
 * Create a logger instance with auto-configuration
 */
export function createDataSourceManagerLogger(config?: LoggingConfig): DataSourceManagerLogger {
  return new DataSourceManagerLogger(config);
}

/**
 * Singleton instance for global access
 */
let globalLogger: DataSourceManagerLogger | null = null;

export function getGlobalDataSourceLogger(): DataSourceManagerLogger {
  if (!globalLogger) {
    globalLogger = createDataSourceManagerLogger();
  }
  return globalLogger;
}

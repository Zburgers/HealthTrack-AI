/**
 * HealthTrack AI - DataSource Manager Startup Integration
 * 
 * This module integrates the DataSourceManager logging with the application startup process.
 * It hooks into the existing electron-launcher.sh and main.ts initialization flow.
 */

import { app } from 'electron';
import { getGlobalDataSourceLogger } from './DataSourceManagerLogger';
import { getDataSourceManager } from '../DataSourceManager';

export interface StartupConfig {
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  silentMode: boolean;
}

/**
 * Initialize DataSource Manager logging during application startup
 */
export async function initializeDataSourceLogging(config?: Partial<StartupConfig>): Promise<void> {
  const startTime = Date.now();
  
  const finalConfig: StartupConfig = {
    enableFileLogging: true,
    enableConsoleLogging: !process.env.SILENT_LOGGING,
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    silentMode: !!process.env.SILENT_LOGGING,
    ...config
  };

  try {
    // Get the global logger (auto-configures from healthtrack-settings.json)
    const logger = getGlobalDataSourceLogger();
    
    // Log startup information with minimal console output
    if (!finalConfig.silentMode) {
      logger.logDataSourceEvent('startup', 'connect', {
        operation: 'initialize_logging',
        app_version: app?.getVersion() || 'unknown',
        node_env: process.env.NODE_ENV,
        electron_env: process.env.ELECTRON_ENV,
        log_level: finalConfig.logLevel,
        file_logging: finalConfig.enableFileLogging,
        console_logging: finalConfig.enableConsoleLogging
      });
    }

    // Initialize the DataSourceManager with logging
    const dataSourceManager = getDataSourceManager();
    
    // Log completion
    const duration = Date.now() - startTime;
    if (!finalConfig.silentMode) {
      logger.logPerformance('datasource_logging_startup', duration, {
        success: true,
        log_file: logger.getLogFile()
      });
    }

  } catch (error) {
    // Fail silently to avoid disrupting app startup
    console.error('[DSM-LOG] Failed to initialize logging:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Hook into Electron app ready event for automatic initialization
 */
export function autoInitializeOnAppReady(): void {
  // Only auto-initialize if not already done
  if (!app.isReady()) {
    app.whenReady().then(() => {
      initializeDataSourceLogging({
        silentMode: process.env.SILENT_DATASOURCE_LOGGING === 'true'
      });
    });
  } else {
    // App is already ready, initialize immediately
    initializeDataSourceLogging({
      silentMode: process.env.SILENT_DATASOURCE_LOGGING === 'true'
    });
  }
}

/**
 * Integration with existing main.ts startup flow
 */
export async function integrateWithMainStartup(): Promise<void> {
  try {
    // Initialize with minimal output during startup
    await initializeDataSourceLogging({
      silentMode: process.env.NODE_ENV === 'production',
      enableConsoleLogging: process.env.NODE_ENV !== 'production'
    });
    
    // Get DataSourceManager to ensure it's initialized with logging
    const dataSourceManager = getDataSourceManager();
    const logger = getGlobalDataSourceLogger();
    
    // Log that integration is complete
    logger.logDataSourceEvent('main_startup', 'connect', {
      operation: 'integration_complete',
      available_sources: dataSourceManager.getAvailableSources().length
    });
    
  } catch (error) {
    // Continue silently to avoid breaking app startup
    console.warn('[DSM-LOG] Startup integration warning:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Hook for electron-launcher.sh script integration
 */
export function setupLauncherHooks(): void {
  // Hook into process events for clean logging shutdown
  process.on('SIGTERM', () => {
    const logger = getGlobalDataSourceLogger();
    logger.logDataSourceEvent('process', 'disconnect', {
      operation: 'shutdown_sigterm',
      signal: 'SIGTERM'
    });
  });

  process.on('SIGINT', () => {
    const logger = getGlobalDataSourceLogger();
    logger.logDataSourceEvent('process', 'disconnect', {
      operation: 'shutdown_sigint',
      signal: 'SIGINT'
    });
  });

  process.on('exit', (code) => {
    const logger = getGlobalDataSourceLogger();
    logger.logDataSourceEvent('process', 'disconnect', {
      operation: 'process_exit',
      exit_code: code
    });
  });
}

/**
 * Export for easy integration into existing startup scripts
 */
export const DataSourceStartupIntegration = {
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

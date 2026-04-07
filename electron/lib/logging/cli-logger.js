#!/usr/bin/env node

/**
 * DataSourceManager CLI Logging Interface
 * 
 * This script provides a simple CLI interface for logging DataSourceManager events
 * from your bash scripts and launcher processes.
 * 
 * Usage Examples:
 * node electron/lib/logging/cli-logger.js startup "electron-launcher" "process_start"
 * node electron/lib/logging/cli-logger.js query "find_patients" "database_query"
 * node electron/lib/logging/cli-logger.js error "connection_failed" "database_error"
 */

const path = require('path');
const fs = require('fs');

// Simple logging without full Electron context
function logEvent(level, operation, metadata = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    category: 'cli',
    operation,
    source: 'cli-logger',
    metadata,
    prefix: 'DSM-CLI'
  };

  // Try to append to the log file if it exists
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'database-operations.log');
    
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Append structured log entry
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine);
    
    // Minimal console output
    console.log(`[DSM-CLI:${timestamp}] ${operation}`);
    
  } catch (error) {
    // Fail silently for CLI
    console.warn(`[DSM-CLI] Logging warning: ${error.message}`);
  }
}

// Parse command line arguments
const [,, level, operation, description] = process.argv;

if (!level || !operation) {
  console.error('Usage: node cli-logger.js <level> <operation> [description]');
  console.error('Levels: startup, query, error, info');
  process.exit(1);
}

// Log the event
logEvent(level, operation, {
  description: description || '',
  pid: process.pid,
  cwd: process.cwd(),
  platform: process.platform,
  node_version: process.version
});

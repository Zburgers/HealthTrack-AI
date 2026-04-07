#!/bin/bash

# DataSourceManager Logging Integration Example
# This script shows how to integrate DSM logging with your existing launcher scripts

# Set environment variables for logging configuration
export SILENT_DATASOURCE_LOGGING="false"
export LOG_LEVEL="info"
export NODE_ENV="production"

# Function to log events with minimal CLI interruption
log_dsm_event() {
    local level="$1"
    local operation="$2"
    local description="$3"
    
    # Only log to console in development, always log to file
    if [[ "$NODE_ENV" != "production" ]]; then
        echo "[DSM-LAUNCHER] $operation: $description"
    fi
    
    # Log to structured file (non-blocking)
    node "$(dirname "$0")/cli-logger.js" "$level" "$operation" "$description" 2>/dev/null &
}

# Example integration with your electron-launcher.sh script
main() {
    log_dsm_event "startup" "launcher_start" "Electron launcher script initiated"
    
    # Your existing electron startup logic here...
    echo "🚀 Starting HealthTrack-AI..."
    
    # Log database initialization
    log_dsm_event "startup" "database_init" "Initializing database connections"
    
    # Your existing database setup here...
    
    # Log application ready
    log_dsm_event "startup" "app_ready" "Application startup complete"
    
    # Start Electron with integrated logging
    # The DataSourceManager logging will automatically activate when Electron starts
    # npm run dev:electron
    
    echo "✅ Application started with integrated DataSourceManager logging"
}

# Trap signals for graceful shutdown logging
trap 'log_dsm_event "shutdown" "launcher_stop" "Electron launcher script terminated"' EXIT
trap 'log_dsm_event "shutdown" "launcher_interrupt" "Electron launcher script interrupted"' INT TERM

# Run main function
main "$@"

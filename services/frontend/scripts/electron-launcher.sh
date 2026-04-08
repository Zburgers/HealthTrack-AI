#!/bin/bash

# HealthTrack AI - Enterprise Electron Launcher
# Advanced launcher with comprehensive error handling, logging, and monitoring
# Copyright (c) 2025 HealthTrack AI

set -euo pipefail  # Exit on any error, undefined variable, or pipe failure

# =============================================================================
# CONFIGURATION & CONSTANTS
# =============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/logs"
readonly LOG_FILE="${LOG_DIR}/electron-launcher-$(date +%Y%m%d-%H%M%S).log"
readonly PID_FILE="${PROJECT_ROOT}/.electron-launcher.pid"
readonly HEALTH_CHECK_URL="http://localhost:9002/api/health"
readonly MAX_RETRIES=3
readonly RETRY_DELAY=5
readonly STARTUP_TIMEOUT=60

# Environment variables
export NODE_ENV="${NODE_ENV:-development}"
export ELECTRON_ENV="${ELECTRON_ENV:-true}"
export GDK_BACKEND="x11"
export ELECTRON_DISABLE_WAYLAND=1
export ELECTRON_FORCE_X11=1

# =============================================================================
# LOGGING & UTILITIES
# =============================================================================

# Create log directory
mkdir -p "${LOG_DIR}"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_debug() { log "DEBUG" "$@"; }

# Progress indicator
show_progress() {
    local pid=$1
    local message="$2"
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c] %s" "$spinstr" "$message"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Error handler
handle_error() {
    local exit_code=$?
    local line_no=$1
    log_error "Script failed at line ${line_no} with exit code ${exit_code}"
    cleanup
    exit $exit_code
}

# Cleanup function
cleanup() {
    log_info "Performing cleanup..."
    if [[ -f "${PID_FILE}" ]]; then
        local pid=$(cat "${PID_FILE}")
        if ps -p "$pid" > /dev/null 2>&1; then
            log_info "Terminating Electron process (PID: ${pid})"
            kill -TERM "$pid" 2>/dev/null || true
            sleep 2
            kill -KILL "$pid" 2>/dev/null || true
        fi
        rm -f "${PID_FILE}"
    fi
}

# Set error trap
trap 'handle_error $LINENO' ERR
trap cleanup EXIT INT TERM

# =============================================================================
# SYSTEM VALIDATION
# =============================================================================

validate_system() {
    log_info "🔍 Validating system requirements..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js is not installed"
        return 1
    fi
    local node_version=$(node --version)
    log_info "Node.js version: ${node_version}"
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm is not installed"
        return 1
    fi
    local npm_version=$(npm --version)
    log_info "npm version: ${npm_version}"
    
    # Check project structure
    local required_files=("package.json" "electron/main.ts" "electron/preload.js")
    for file in "${required_files[@]}"; do
        if [[ ! -f "${PROJECT_ROOT}/${file}" ]]; then
            log_error "Required file not found: ${file}"
            return 1
        fi
    done
    
    # Check display
    if [[ -z "${DISPLAY:-}" ]]; then
        log_warn "No DISPLAY environment variable set"
        export DISPLAY=:0
    fi
    log_info "Display: ${DISPLAY}"
    
    # Check GTK libraries
    if command -v pkg-config >/dev/null 2>&1; then
        if pkg-config --exists gtk+-3.0; then
            local gtk_version=$(pkg-config --modversion gtk+-3.0)
            log_info "GTK3 version: ${gtk_version}"
        else
            log_warn "GTK3 development libraries not found"
        fi
    fi
    
    log_info "✅ System validation completed"
}

# =============================================================================
# HEALTH MONITORING
# =============================================================================

wait_for_health_check() {
    local timeout=$1
    local start_time=$(date +%s)
    
    log_info "⏳ Waiting for Next.js health check (timeout: ${timeout}s)..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -ge $timeout ]]; then
            log_error "Health check timeout after ${timeout} seconds"
            return 1
        fi
        
        if curl -sf "${HEALTH_CHECK_URL}" >/dev/null 2>&1; then
            log_info "✅ Next.js health check passed"
            return 0
        fi
        
        sleep 1
    done
}

monitor_process() {
    local pid=$1
    local name="$2"
    
    while ps -p "$pid" > /dev/null 2>&1; do
        sleep 5
        # Check memory usage
        local memory=$(ps -p "$pid" -o rss= 2>/dev/null | tr -d ' ')
        if [[ -n "$memory" && $memory -gt 1048576 ]]; then  # 1GB in KB
            log_warn "${name} using high memory: ${memory}KB"
        fi
    done
    
    log_warn "${name} process (PID: ${pid}) has stopped"
}

# =============================================================================
# LAUNCH METHODS
# =============================================================================

# Method 1: Try with minimal Electron flags
launch_electron_minimal() {
    log_info "📦 Attempting minimal Electron launch..."
    
    local cmd="npx electron . --no-sandbox --disable-gpu"
    log_debug "Command: ${cmd}"
    
    cd "${PROJECT_ROOT}"
    $cmd &
    local pid=$!
    echo $pid > "${PID_FILE}"
    
    # Wait a moment for process to stabilize
    sleep 2
    
    if ps -p "$pid" > /dev/null 2>&1; then
        log_info "✅ Electron launched successfully (minimal mode) - PID: ${pid}"
        monitor_process "$pid" "Electron" &
        return 0
    else
        log_error "❌ Minimal Electron launch failed"
        rm -f "${PID_FILE}"
        return 1
    fi
}

# Method 2: Try with extensive flags
launch_electron_full() {
    log_info "🛠️ Attempting full-featured Electron launch..."
    
    local cmd="npx electron . \
        --disable-gpu \
        --no-sandbox \
        --disable-dev-shm-usage \
        --disable-web-security \
        --disable-features=VizDisplayCompositor \
        --ignore-gpu-blacklist \
        --disable-gpu-sandbox \
        --disable-extensions \
        --disable-plugins \
        --disable-software-rasterizer \
        --disable-background-timer-throttling \
        --disable-renderer-backgrounding \
        --disable-backgrounding-occluded-windows \
        --force-color-profile=srgb"
    
    log_debug "Command: ${cmd}"
    
    cd "${PROJECT_ROOT}"
    $cmd &
    local pid=$!
    echo $pid > "${PID_FILE}"
    
    # Wait a moment for process to stabilize
    sleep 3
    
    if ps -p "$pid" > /dev/null 2>&1; then
        log_info "✅ Electron launched successfully (full mode) - PID: ${pid}"
        monitor_process "$pid" "Electron" &
        return 0
    else
        log_error "❌ Full Electron launch failed"
        rm -f "${PID_FILE}"
        return 1
    fi
}

# Method 3: Fallback to browser
launch_browser_fallback() {
    log_info "🌐 Launching browser fallback mode..."
    log_warn "Desktop features will not be available in browser mode"
    
    local browser_cmd=""
    if command -v google-chrome >/dev/null 2>&1; then
        browser_cmd="google-chrome --app=${HEALTH_CHECK_URL%/api/health}"
    elif command -v chromium-browser >/dev/null 2>&1; then
        browser_cmd="chromium-browser --app=${HEALTH_CHECK_URL%/api/health}"
    elif command -v firefox >/dev/null 2>&1; then
        browser_cmd="firefox ${HEALTH_CHECK_URL%/api/health}"
    elif command -v xdg-open >/dev/null 2>&1; then
        browser_cmd="xdg-open ${HEALTH_CHECK_URL%/api/health}"
    else
        log_error "No suitable browser found"
        log_info "Please manually open: ${HEALTH_CHECK_URL%/api/health}"
        return 1
    fi
    
    log_info "Browser command: ${browser_cmd}"
    $browser_cmd &
    local pid=$!
    
    log_info "✅ Browser launched successfully - PID: ${pid}"
    return 0
}

# =============================================================================
# MAIN EXECUTION FLOW
# =============================================================================

main() {
    cd "${PROJECT_ROOT}"
    
    # Header
    echo "==============================================="
    echo "🚀 HealthTrack AI - Enterprise Electron Launcher"
    echo "==============================================="
    echo "📅 Started: $(date)"
    echo "📁 Project: ${PROJECT_ROOT}"
    echo "📋 Log file: ${LOG_FILE}"
    echo "==============================================="
    
    log_info "🚀 Starting HealthTrack AI Electron application..."
    
    # Check for existing instance
    if [[ -f "${PID_FILE}" ]]; then
        local existing_pid=$(cat "${PID_FILE}")
        if ps -p "$existing_pid" > /dev/null 2>&1; then
            log_warn "Existing Electron instance found (PID: ${existing_pid})"
            read -p "Do you want to stop it and continue? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kill -TERM "$existing_pid" 2>/dev/null || true
                sleep 2
                kill -KILL "$existing_pid" 2>/dev/null || true
                rm -f "${PID_FILE}"
            else
                log_info "Exiting..."
                exit 0
            fi
        else
            rm -f "${PID_FILE}"
        fi
    fi
    
    # Validate system
    if ! validate_system; then
        log_error "System validation failed"
        exit 1
    fi
    
    # Wait for Next.js health check
    if ! wait_for_health_check "$STARTUP_TIMEOUT"; then
        log_error "Next.js is not responding. Please start the development server first."
        log_info "Run: npm run dev:electron:next"
        exit 1
    fi
    
    # Try different launch methods with retries
    local attempt=1
    local success=false
    
    while [[ $attempt -le $MAX_RETRIES && $success == false ]]; do
        log_info "🔄 Launch attempt ${attempt}/${MAX_RETRIES}"
        
        if launch_electron_minimal; then
            success=true
            break
        elif launch_electron_full; then
            success=true
            break
        else
            log_warn "Attempt ${attempt} failed"
            if [[ $attempt -lt $MAX_RETRIES ]]; then
                log_info "Waiting ${RETRY_DELAY} seconds before retry..."
                sleep $RETRY_DELAY
            fi
        fi
        
        ((attempt++))
    done
    
    if [[ $success == false ]]; then
        log_error "All Electron launch attempts failed"
        log_info "🔄 Offering browser fallback..."
        
        read -p "Would you like to launch in browser mode? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if launch_browser_fallback; then
                success=true
            fi
        fi
    fi
    
    if [[ $success == true ]]; then
        log_info "🎉 HealthTrack AI launched successfully!"
        log_info "📊 Monitoring application..."
        
        # Keep script running to monitor
        while [[ -f "${PID_FILE}" ]]; do
            local pid=$(cat "${PID_FILE}")
            if ! ps -p "$pid" > /dev/null 2>&1; then
                log_error "Application process died unexpectedly"
                rm -f "${PID_FILE}"
                break
            fi
            sleep 10
        done
    else
        log_error "❌ Failed to launch HealthTrack AI"
        show_troubleshooting
        exit 1
    fi
}

# =============================================================================
# TROUBLESHOOTING GUIDE
# =============================================================================

show_troubleshooting() {
    echo ""
    echo "🔧 TROUBLESHOOTING GUIDE"
    echo "========================"
    echo ""
    echo "Common solutions:"
    echo "1. Install GTK development libraries:"
    echo "   - Ubuntu/Debian: sudo apt install libgtk-3-dev libgconf-2-4"
    echo "   - Fedora/RHEL: sudo dnf install gtk3-devel"
    echo "   - Arch: sudo pacman -S gtk3"
    echo ""
    echo "2. Check Next.js server:"
    echo "   npm run dev:electron:next"
    echo ""
    echo "3. Clear cache and reinstall:"
    echo "   rm -rf node_modules package-lock.json"
    echo "   npm install"
    echo ""
    echo "4. Update system packages:"
    echo "   sudo apt update && sudo apt upgrade"
    echo ""
    echo "5. Check log file for details:"
    echo "   ${LOG_FILE}"
    echo ""
}

# =============================================================================
# SIGNAL HANDLERS
# =============================================================================

handle_interrupt() {
    log_info "Received interrupt signal"
    cleanup
    exit 130
}

trap handle_interrupt INT TERM

# Execute main function
main "$@"

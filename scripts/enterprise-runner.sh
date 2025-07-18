#!/bin/bash

# HealthTrack AI - Enterprise Script Runner
# Centralized script management with advanced monitoring and control
# Copyright (c) 2025 HealthTrack AI

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/logs"
readonly ENTERPRISE_LOG="${LOG_DIR}/enterprise-runner-$(date +%Y%m%d-%H%M%S).log"

# =============================================================================
# LOGGING
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${ENTERPRISE_LOG}"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_success() { log "SUCCESS" "$@"; }

# =============================================================================
# UTILITIES
# =============================================================================

show_header() {
    echo "================================================================"
    echo "🏢 HealthTrack AI - Enterprise Script Runner"
    echo "================================================================"
    echo "📅 Time: $(date)"
    echo "📁 Project: ${PROJECT_ROOT}"
    echo "📋 Log: ${ENTERPRISE_LOG}"
    echo "================================================================"
}

show_menu() {
    echo ""
    echo "Available Commands:"
    echo "==================="
    echo ""
    echo "Development:"
    echo "  1. dev          - Start development environment"
    echo "  2. electron     - Start Electron development mode"
    echo "  3. web          - Start web-only development mode"
    echo ""
    echo "Build & Deploy:"
    echo "  4. build        - Build for production"
    echo "  5. prebuild     - Run enterprise prebuild"
    echo "  6. test         - Run test suite"
    echo ""
    echo "Maintenance:"
    echo "  7. clean        - Clean build artifacts"
    echo "  8. reset        - Reset and reinstall dependencies"
    echo "  9. health       - System health check"
    echo ""
    echo "Monitoring:"
    echo "  10. logs        - View recent logs"
    echo "  11. status      - Show system status"
    echo "  12. monitor     - Start monitoring dashboard"
    echo ""
    echo "  0. exit         - Exit runner"
    echo ""
}

# =============================================================================
# COMMAND FUNCTIONS
# =============================================================================

cmd_dev() {
    log_info "🚀 Starting development environment..."
    npm run dev
}

cmd_electron() {
    log_info "⚡ Starting Electron development mode..."
    "${SCRIPT_DIR}/prebuild.js"
    npm run electron:dev
}

cmd_web() {
    log_info "🌐 Starting web-only development mode..."
    npm run dev
}

cmd_build() {
    log_info "🏗️ Building for production..."
    "${SCRIPT_DIR}/prebuild.js"
    npm run build
}

cmd_prebuild() {
    log_info "🔨 Running enterprise prebuild..."
    "${SCRIPT_DIR}/prebuild.js"
}

cmd_test() {
    log_info "🧪 Running test suite..."
    npm test
}

cmd_clean() {
    log_info "🧹 Cleaning build artifacts..."
    rm -rf .next out dist electron/dist node_modules/.cache
    log_success "✅ Clean completed"
}

cmd_reset() {
    log_info "🔄 Resetting project..."
    rm -rf node_modules package-lock.json .next out dist
    npm install
    log_success "✅ Reset completed"
}

cmd_health() {
    log_info "🏥 Running system health check..."
    
    echo ""
    echo "System Information:"
    echo "==================="
    echo "Node.js: $(node --version)"
    echo "npm: $(npm --version)"
    echo "Platform: $(uname -s) $(uname -m)"
    echo "Memory: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
    echo "Disk: $(df -h . | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
    
    echo ""
    echo "Project Health:"
    echo "==============="
    
    # Check required files
    local required_files=("package.json" "next.config.ts" "electron/main.ts")
    for file in "${required_files[@]}"; do
        if [[ -f "${PROJECT_ROOT}/${file}" ]]; then
            echo "✅ ${file}"
        else
            echo "❌ ${file} (missing)"
        fi
    done
    
    # Check dependencies
    if [[ -d "node_modules" ]]; then
        echo "✅ Dependencies installed"
    else
        echo "❌ Dependencies not installed"
    fi
    
    # Check ports
    if lsof -i :9002 >/dev/null 2>&1; then
        echo "⚠️  Port 9002 in use"
    else
        echo "✅ Port 9002 available"
    fi
    
    log_success "✅ Health check completed"
}

cmd_logs() {
    log_info "📋 Showing recent logs..."
    
    if [[ -d "${LOG_DIR}" ]]; then
        echo ""
        echo "Recent log files:"
        echo "=================="
        ls -la "${LOG_DIR}"/*.log | tail -10
        
        echo ""
        echo "Latest log entries:"
        echo "==================="
        tail -20 "${LOG_DIR}"/*.log | tail -20
    else
        log_warn "No log directory found"
    fi
}

cmd_status() {
    log_info "📊 System status..."
    
    echo ""
    echo "Process Status:"
    echo "==============="
    
    # Check for running processes
    if pgrep -f "next dev" >/dev/null; then
        echo "🟢 Next.js development server: RUNNING"
    else
        echo "🔴 Next.js development server: STOPPED"
    fi
    
    if pgrep -f "electron" >/dev/null; then
        echo "🟢 Electron application: RUNNING"
    else
        echo "🔴 Electron application: STOPPED"
    fi
    
    # Check ports
    echo ""
    echo "Port Status:"
    echo "============"
    
    local ports=(3000 9002)
    for port in "${ports[@]}"; do
        if lsof -i ":${port}" >/dev/null 2>&1; then
            local process=$(lsof -i ":${port}" | grep LISTEN | awk '{print $1}' | head -1)
            echo "🟢 Port ${port}: ${process}"
        else
            echo "🔴 Port ${port}: FREE"
        fi
    done
}

cmd_monitor() {
    log_info "📊 Starting monitoring dashboard..."
    
    echo ""
    echo "Monitoring Dashboard"
    echo "===================="
    echo "Press Ctrl+C to exit"
    echo ""
    
    while true; do
        clear
        show_header
        cmd_status
        
        echo ""
        echo "Real-time Metrics:"
        echo "=================="
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)"
        echo "Memory: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
        echo "Time: $(date '+%H:%M:%S')"
        
        sleep 5
    done
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    mkdir -p "${LOG_DIR}"
    
    show_header
    
    if [[ $# -eq 0 ]]; then
        # Interactive mode
        while true; do
            show_menu
            read -p "Enter command (1-12, 0 to exit): " choice
            
            case $choice in
                1) cmd_dev ;;
                2) cmd_electron ;;
                3) cmd_web ;;
                4) cmd_build ;;
                5) cmd_prebuild ;;
                6) cmd_test ;;
                7) cmd_clean ;;
                8) cmd_reset ;;
                9) cmd_health ;;
                10) cmd_logs ;;
                11) cmd_status ;;
                12) cmd_monitor ;;
                0) log_info "👋 Goodbye!"; exit 0 ;;
                *) log_error "Invalid option: $choice" ;;
            esac
            
            echo ""
            read -p "Press Enter to continue..."
        done
    else
        # Command line mode
        case $1 in
            dev) cmd_dev ;;
            electron) cmd_electron ;;
            web) cmd_web ;;
            build) cmd_build ;;
            prebuild) cmd_prebuild ;;
            test) cmd_test ;;
            clean) cmd_clean ;;
            reset) cmd_reset ;;
            health) cmd_health ;;
            logs) cmd_logs ;;
            status) cmd_status ;;
            monitor) cmd_monitor ;;
            help) show_menu ;;
            *) 
                log_error "Unknown command: $1"
                show_menu
                exit 1
                ;;
        esac
    fi
}

# Signal handlers
trap 'log_info "Received interrupt signal"; exit 130' INT TERM

# Execute main function
cd "${PROJECT_ROOT}"
main "$@"

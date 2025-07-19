#!/usr/bin/env node

/**
 * HealthTrack AI - Enterprise Prebuild Script
 * Advanced build preparation with comprehensive validation and optimization
 * Copyright (c) 2025 HealthTrack AI
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================

const CONFIG = {
    PROJECT_ROOT: path.resolve(__dirname, '..'),
    BUILD_TIMESTAMP: new Date().toISOString(),
    NODE_MIN_VERSION: '18.0.0',
    NPM_MIN_VERSION: '8.0.0',
    REQUIRED_DIRS: [
        'electron/dist',
        'electron/db', 
        'logs',
        'temp',
        '.cache'
    ],
    REQUIRED_FILES: [
        'package.json',
        'next.config.ts',
        'tsconfig.json',
        'electron/main.ts',
        'electron/preload.ts'
    ],
    TYPESCRIPT_FILES: [
        'electron/main.ts',
        'electron/preload.ts'
    ]
};

// Environment detection
const IS_ELECTRON = process.env.ELECTRON_ENV === 'true';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_CI = process.env.CI === 'true';

// =============================================================================
// LOGGING & UTILITIES
// =============================================================================

class Logger {
    static log(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}]`;
        console.log(`${prefix} ${message}`, ...args);
    }

    static info(message, ...args) { this.log('INFO', message, ...args); }
    static warn(message, ...args) { this.log('WARN', message, ...args); }
    static error(message, ...args) { this.log('ERROR', message, ...args); }
    static success(message, ...args) { this.log('SUCCESS', message, ...args); }
    static debug(message, ...args) { 
        if (process.env.DEBUG || !IS_PRODUCTION) {
            this.log('DEBUG', message, ...args);
        }
    }
}

class BuildValidator {
    static validateNodeVersion() {
        const currentVersion = process.version.substring(1); // Remove 'v' prefix
        const required = CONFIG.NODE_MIN_VERSION;
        
        if (this.compareVersions(currentVersion, required) < 0) {
            throw new Error(`Node.js ${required} or higher required. Current: ${currentVersion}`);
        }
        
        Logger.info(`✅ Node.js version: ${currentVersion}`);
        return true;
    }

    static validateNpmVersion() {
        try {
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            const required = CONFIG.NPM_MIN_VERSION;
            
            if (this.compareVersions(npmVersion, required) < 0) {
                throw new Error(`npm ${required} or higher required. Current: ${npmVersion}`);
            }
            
            Logger.info(`✅ npm version: ${npmVersion}`);
            return true;
        } catch (error) {
            throw new Error(`Failed to check npm version: ${error.message}`);
        }
    }

    static compareVersions(a, b) {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;
            
            if (aPart > bPart) return 1;
            if (aPart < bPart) return -1;
        }
        
        return 0;
    }

    static validateRequiredFiles() {
        Logger.info('🔍 Validating required files...');
        
        const missingFiles = [];
        
        for (const file of CONFIG.REQUIRED_FILES) {
            const filePath = path.join(CONFIG.PROJECT_ROOT, file);
            if (!fs.existsSync(filePath)) {
                missingFiles.push(file);
            } else {
                Logger.debug(`✓ Found: ${file}`);
            }
        }
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
        }
        
        Logger.success('✅ All required files present');
        return true;
    }

    static validatePackageJson() {
        Logger.info('📦 Validating package.json...');
        
        const packagePath = path.join(CONFIG.PROJECT_ROOT, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check required scripts
        const requiredScripts = ['dev', 'build', 'start'];
        const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
        
        if (missingScripts.length > 0) {
            Logger.warn(`Missing recommended scripts: ${missingScripts.join(', ')}`);
        }
        
        // Check dependencies
        if (!packageJson.dependencies) {
            throw new Error('No dependencies found in package.json');
        }
        
        Logger.success('✅ package.json validation passed');
        return packageJson;
    }
}

class FileManager {
    static cleanDist() {
        Logger.info('🧹 Cleaning old build artifacts...');
        const distPath = path.join(CONFIG.PROJECT_ROOT, 'electron/dist');
        if (fs.existsSync(distPath)) {
            fs.rmSync(distPath, { recursive: true, force: true });
            Logger.success('✅ Cleaned electron/dist directory');
        } else {
            Logger.info(' electron/dist directory not found, skipping cleanup.');
        }
    }

    static ensureDirectories() {
        Logger.info('📁 Creating required directories...');
        
        for (const dir of CONFIG.REQUIRED_DIRS) {
            const dirPath = path.join(CONFIG.PROJECT_ROOT, dir);
            
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                Logger.info(`📁 Created directory: ${dir}`);
            } else {
                Logger.debug(`📁 Directory exists: ${dir}`);
            }
        }
        
        Logger.success('✅ Directory structure ready');
    }

    static createBuildInfo() {
        Logger.info('📋 Creating build information...');
        
        const buildInfo = {
            timestamp: CONFIG.BUILD_TIMESTAMP,
            version: this.getProjectVersion(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            environment: {
                isElectron: IS_ELECTRON,
                isProduction: IS_PRODUCTION,
                isCI: IS_CI
            },
            git: this.getGitInfo()
        };
        
        const buildInfoPath = path.join(CONFIG.PROJECT_ROOT, '.cache', 'build-info.json');
        fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
        
        Logger.success('✅ Build information created');
        return buildInfo;
    }

    static getProjectVersion() {
        try {
            const packageJson = JSON.parse(
                fs.readFileSync(path.join(CONFIG.PROJECT_ROOT, 'package.json'), 'utf8')
            );
            return packageJson.version || '0.0.0';
        } catch {
            return '0.0.0';
        }
    }

    static getGitInfo() {
        try {
            const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
                cwd: CONFIG.PROJECT_ROOT,
                encoding: 'utf8' 
            }).trim();
            
            const commit = execSync('git rev-parse HEAD', { 
                cwd: CONFIG.PROJECT_ROOT,
                encoding: 'utf8' 
            }).trim();
            
            const shortCommit = commit.substring(0, 7);
            
            return { branch, commit, shortCommit };
        } catch {
            return { branch: 'unknown', commit: 'unknown', shortCommit: 'unknown' };
        }
    }

    static generateChecksums() {
        Logger.info('🔐 Generating file checksums...');
        
        const checksums = {};
        
        for (const file of CONFIG.REQUIRED_FILES) {
            const filePath = path.join(CONFIG.PROJECT_ROOT, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath);
                const hash = crypto.createHash('sha256').update(content).digest('hex');
                checksums[file] = hash;
            }
        }
        
        const checksumsPath = path.join(CONFIG.PROJECT_ROOT, '.cache', 'checksums.json');
        fs.writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2));
        
        Logger.success('✅ Checksums generated');
        return checksums;
    }
}

class TypeScriptManager {
    static compileTypeScript() {
        if (!IS_ELECTRON) {
            Logger.debug('Skipping TypeScript compilation (not in Electron mode)');
            return;
        }
        
        Logger.info('🔨 Compiling TypeScript files...');
        
        try {
            // Check if tsc is available
            execSync('npx tsc --version', { stdio: 'pipe' });
            
            // Compile Electron TypeScript files
            execSync('npx tsc --project electron/tsconfig.json', {
                cwd: CONFIG.PROJECT_ROOT,
                stdio: 'inherit'
            });
            
            Logger.success('✅ TypeScript compilation completed');
        } catch (error) {
            Logger.error('❌ TypeScript compilation failed:', error.message);
            throw error;
        }
    }

    static validateTypeScript() {
        Logger.info('🔍 Validating TypeScript configuration...');
        
        const tsconfigPath = path.join(CONFIG.PROJECT_ROOT, 'tsconfig.json');
        const electronTsconfigPath = path.join(CONFIG.PROJECT_ROOT, 'electron', 'tsconfig.json');
        
        if (!fs.existsSync(tsconfigPath)) {
            throw new Error('Main tsconfig.json not found');
        }
        
        if (IS_ELECTRON && !fs.existsSync(electronTsconfigPath)) {
            Logger.warn('Electron tsconfig.json not found, creating default...');
            this.createElectronTsConfig();
        }
        
        Logger.success('✅ TypeScript configuration validated');
    }

    static createElectronTsConfig() {
        const electronTsConfig = {
            "compilerOptions": {
                "target": "ES2020",
                "module": "commonjs",
                "outDir": "./dist",
                "rootDir": "./",
                "strict": true,
                "esModuleInterop": true,
                "skipLibCheck": true,
                "forceConsistentCasingInFileNames": true,
                "resolveJsonModule": true,
                "declaration": true,
                "sourceMap": true
            },
            "include": ["**/*.ts"],
            "exclude": ["node_modules", "dist"]
        };
        
        const configPath = path.join(CONFIG.PROJECT_ROOT, 'electron', 'tsconfig.json');
        fs.writeFileSync(configPath, JSON.stringify(electronTsConfig, null, 2));
        
        Logger.info('📁 Created Electron tsconfig.json');
    }
}

class EnvironmentManager {
    static validateEnvironment() {
        Logger.info('🌍 Validating environment...');
        
        const requiredEnvVars = [];
        
        if (IS_PRODUCTION) {
            requiredEnvVars.push('NODE_ENV');
        }
        
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            Logger.warn(`Missing environment variables: ${missingVars.join(', ')}`);
        }
        
        // Log environment info
        Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        Logger.info(`Platform: ${process.platform} ${process.arch}`);
        Logger.info(`Electron mode: ${IS_ELECTRON}`);
        Logger.info(`Production mode: ${IS_PRODUCTION}`);
        Logger.info(`CI mode: ${IS_CI}`);
        
        Logger.success('✅ Environment validation completed');
    }

    static setupElectronEnvironment() {
        if (!IS_ELECTRON) return;
        
        Logger.info('⚡ Setting up Electron environment...');
        
        // Set Electron-specific environment variables
        process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
        process.env.ELECTRON_ENABLE_LOGGING = 'true';
        
        if (process.platform === 'linux') {
            process.env.GDK_BACKEND = 'x11';
            process.env.ELECTRON_DISABLE_WAYLAND = '1';
        }
        
        Logger.success('✅ Electron environment configured');
    }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
    const startTime = Date.now();
    
    try {
        console.log('===============================================');
        console.log('🚀 HealthTrack AI - Enterprise Prebuild Script');
        console.log('===============================================');
        console.log(`📅 Started: ${CONFIG.BUILD_TIMESTAMP}`);
        console.log(`🏗️  Build type: ${IS_ELECTRON ? 'Electron' : 'Web'}`);
        console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('===============================================');
        
        // Phase 1: System Validation
        Logger.info('🔍 Phase 1: System Validation');
        BuildValidator.validateNodeVersion();
        BuildValidator.validateNpmVersion();
        BuildValidator.validateRequiredFiles();
        BuildValidator.validatePackageJson();
        
        // Phase 2: Environment Setup
        Logger.info('� Phase 2: Environment Setup');
        EnvironmentManager.validateEnvironment();
        EnvironmentManager.setupElectronEnvironment();
        
        // Phase 3: File Management
        Logger.info('📁 Phase 3: File Management');
        FileManager.cleanDist(); // Add this line
        FileManager.ensureDirectories();
        const buildInfo = FileManager.createBuildInfo();
        FileManager.generateChecksums();
        
        // Phase 4: TypeScript Processing
        Logger.info('🔨 Phase 4: TypeScript Processing');
        TypeScriptManager.validateTypeScript();
        TypeScriptManager.compileTypeScript();
        
        // Phase 5: Final Setup
        Logger.info('🎯 Phase 5: Final Setup');
        
        // Fix Electron entry point path
        Logger.info('🔄 Fixing Electron entry point path...');
        if (fs.existsSync('electron/dist/electron/main.js')) {
            fs.copyFileSync('electron/dist/electron/main.js', 'electron/dist/main.js');
            Logger.success('✅ Entry point file copied to correct location');
        } else {
            Logger.warn('Entry point file not found, skipping fix');
        }
        
        const duration = Date.now() - startTime;
        
        console.log('===============================================');
        Logger.success(`🎉 Prebuild completed successfully in ${duration}ms`);
        Logger.info(`📋 Build version: ${buildInfo.version}`);
        Logger.info(`🔨 Git commit: ${buildInfo.git.shortCommit}`);
        console.log('===============================================');
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        console.log('===============================================');
        Logger.error(`❌ Prebuild failed after ${duration}ms`);
        Logger.error(`Error: ${error.message}`);
        
        if (process.env.DEBUG) {
            Logger.error('Stack trace:', error.stack);
        }
        
        console.log('===============================================');
        process.exit(1);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Execute main function
main();

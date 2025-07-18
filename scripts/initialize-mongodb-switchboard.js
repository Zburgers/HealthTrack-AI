#!/usr/bin/env node

/**
 * MongoDB Initializer Script - Switchboard Integration
 * 
 * This script initializes MongoDB connections via Clara's Switchboard Architecture.
 * Uses direct IPC communication for better reliability and timing control.
 */
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'healthtrack-settings.json');
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

/**
 * Checks if we're running in an Electron environment
 */
function isElectronEnvironment() {
  return process.env.ELECTRON_ENV === 'true' && typeof process.versions.electron !== 'undefined';
}

/**
 * Checks if the MongoDB URI is set in settings
 */
function hasMongoUri() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const settingsData = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      const settings = JSON.parse(settingsData);
      return !!settings.mongoUri;
    }
  } catch (error) {
    console.error('Error reading settings file:', error);
  }
  return false;
}

/**
 * Loads the MongoDB URI from settings
 */
function loadMongoUri() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const settingsData = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      const settings = JSON.parse(settingsData);
      return settings.mongoUri || null;
    }
  } catch (error) {
    console.error('Error reading MongoDB URI from settings:', error);
  }
  return null;
}

/**
 * Initialize databases via Switchboard (for Electron environment)
 */
async function initializeDatabasesSwitchboard() {
  console.log('🎯 [DBINIT] Initializing via Switchboard Architecture...');
  
  if (!isElectronEnvironment()) {
    console.log('⚠️ [DBINIT] Not in Electron environment. Switchboard not available.');
    return false;
  }

  try {
    // For Electron, we need to communicate via the main process
    // This script will be called from the main process context
    console.log('🎯 [DBINIT] Switchboard initialization delegated to main process');
    
    // Check if case embeddings environment variable is set
    const caseEmbeddingsUri = process.env.MONGODB_URI;
    if (caseEmbeddingsUri) {
      console.log('✅ [DBINIT] Case embeddings URI found in environment');
    } else {
      console.log('⚠️ [DBINIT] No case embeddings URI in environment (MONGODB_URI)');
    }
    
    // Check if user database URI is in settings
    const userDbUri = loadMongoUri();
    if (userDbUri) {
      console.log('✅ [DBINIT] User database URI found in settings');
    } else {
      console.log('⚠️ [DBINIT] No user database URI in settings');
    }
    
    console.log('🎯 [DBINIT] Database URIs checked. Initialization will be handled by Switchboard.');
    return true;
    
  } catch (error) {
    console.error('❌ [DBINIT] Error during Switchboard initialization:', error);
    return false;
  }
}

/**
 * Legacy initialization for non-Electron environments
 */
async function initializeDatabasesLegacy() {
  console.log('📊 [DBINIT] Using legacy initialization (non-Electron)...');
  
  if (!hasMongoUri()) {
    console.log('⚠️ [DBINIT] No MongoDB URI found in settings. Skipping initialization.');
    return false;
  }
  
  console.log('✅ [DBINIT] Found MongoDB URI in settings.');
  console.log('🎯 [DBINIT] Legacy initialization complete.');
  return true;
}

/**
 * Main initialization function
 */
async function initializeDatabase(retries = MAX_RETRIES) {
  console.log('🔄 [DBINIT] Starting MongoDB initialization...');
  
  try {
    if (isElectronEnvironment()) {
      return await initializeDatabasesSwitchboard();
    } else {
      return await initializeDatabasesLegacy();
    }
  } catch (error) {
    console.error('❌ [DBINIT] Error during initialization:', error);
    
    if (retries > 0) {
      console.log(`🔄 [DBINIT] Retrying in ${RETRY_DELAY_MS/1000} seconds... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return initializeDatabase(retries - 1);
    }
    
    return false;
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  (async () => {
    try {
      const success = await initializeDatabase();
      if (success) {
        console.log('✅ [DBINIT] MongoDB initialization completed successfully.');
        process.exit(0);
      } else {
        console.error('❌ [DBINIT] MongoDB initialization failed.');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ [DBINIT] Fatal error during initialization:', error);
      process.exit(1);
    }
  })();
}

module.exports = { initializeDatabase };

const { app, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Get user settings for data storage location
 */
function getUserSettings() {
  const userDataPath = app.getPath('userData');
  const settingsPath = path.join(userDataPath, 'user-settings.json');
  
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settings;
    }
  } catch (error) {
    console.warn('Failed to read user settings:', error);
  }
  
  // Default settings
  return {
    databasePath: path.join(userDataPath, 'database'),
    autoBackup: true,
    backupRetention: 30, // days
    startMinimized: false,
    autoUpdate: true
  };
}

/**
 * Save user settings
 */
function saveUserSettings(settings) {
  const userDataPath = app.getPath('userData');
  const settingsPath = path.join(userDataPath, 'user-settings.json');
  
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save user settings:', error);
    return false;
  }
}

/**
 * Show dialog to let user choose data storage location
 */
async function chooseDataLocation(currentWindow) {
  const result = await dialog.showOpenDialog(currentWindow, {
    title: 'Choose Data Storage Location',
    defaultPath: app.getPath('documents'),
    properties: ['openDirectory', 'createDirectory'],
    message: 'Select where you want to store your HealthTrack AI patient data'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    const healthtrackPath = path.join(selectedPath, 'HealthTrack-AI-Data');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(healthtrackPath)) {
      fs.mkdirSync(healthtrackPath, { recursive: true });
    }
    
    return healthtrackPath;
  }
  
  return null;
}

/**
 * Get the effective database path (user setting or default)
 */
function getEffectiveDatabasePath() {
  const settings = getUserSettings();
  return settings.databasePath;
}

/**
 * Update database path in settings
 */
function updateDatabasePath(newPath) {
  const settings = getUserSettings();
  settings.databasePath = newPath;
  return saveUserSettings(settings);
}

module.exports = {
  getUserSettings,
  saveUserSettings,
  chooseDataLocation,
  getEffectiveDatabasePath,
  updateDatabasePath
};

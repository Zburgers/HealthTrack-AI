const { ipcMain } = require('electron');

function testSetupIpcHandlers() {
  console.log('🔌 Setting up test IPC handlers...');
  
  // Database information handler - basic test
  ipcMain.handle('db-getInfo', async () => {
    try {
      console.log('🔍 Test: Getting database info...');
      
      // Try to get database connection
      const { getDatabaseConnection, getLocalDbPath, isLocalDatabaseConnected } = require('../local-database.js');
      const { db } = getDatabaseConnection();
      
      if (!db) {
        console.warn('❌ No database connection available');
        return {
          type: 'none',
          localPath: getLocalDbPath(),
          collections: [],
          totalSize: '0 MB',
          connectionInfo: { isConnected: false },
        };
      }

      // Get collection information
      const collectionsInfo = [];
      const existingCollections = await db.listCollections().toArray();
      console.log('🔍 Found collections:', existingCollections.map(c => c.name));
      
      for (const collectionInfo of existingCollections) {
        try {
          const collection = db.collection(collectionInfo.name);
          const count = await collection.countDocuments();
          collectionsInfo.push({
            name: collectionInfo.name,
            count,
            location: 'local',
          });
        } catch (error) {
          console.warn(`⚠️ Failed to count ${collectionInfo.name}:`, error);
          collectionsInfo.push({
            name: collectionInfo.name,
            count: 0,
            location: 'local',
          });
        }
      }

      return {
        type: 'hybrid',
        localPath: getLocalDbPath(),
        collections: collectionsInfo,
        totalSize: '10 MB', // placeholder
        connectionInfo: { isConnected: isLocalDatabaseConnected() },
      };
    } catch (error) {
      console.error('❌ Failed to get database info:', error);
      throw error;
    }
  });

  // Export data handler
  ipcMain.handle('db-exportData', async () => {
    try {
      console.log('📤 Starting database export...');
      const { dialog } = require('electron');
      const fs = require('fs');
      const path = require('path');
      const { getDatabaseConnection } = require('../local-database.js');
      const { db } = getDatabaseConnection();
      
      if (!db) {
        throw new Error('Database not connected');
      }

      // Show save dialog to let user choose destination
      const timestamp = new Date().toISOString().split('T')[0];
      const defaultFileName = `healthtrack-database-export-${timestamp}.json`;
      
      const result = await dialog.showSaveDialog({
        title: 'Export Database - Choose Destination',
        defaultPath: defaultFileName,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['createDirectory']
      });
      
      if (result.canceled) {
        console.log('❌ Export cancelled by user');
        return { success: false, cancelled: true };
      }
      
      const exportPath = result.filePath;
      console.log(`📁 Export destination: ${exportPath}`);

      // Create export data structure
      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          application: 'HealthTrack-AI',
          exportDate: new Date().toLocaleDateString(),
          hostname: require('os').hostname(),
        },
        collections: {},
      };

      // Get all collections and export their data
      const existingCollections = await db.listCollections().toArray();
      console.log('📋 Found collections to export:', existingCollections.map(c => c.name));

      let totalDocuments = 0;
      for (const collectionInfo of existingCollections) {
        try {
          const collection = db.collection(collectionInfo.name);
          const documents = await collection.find({}).toArray();
          
          // Transform ObjectIds to strings for JSON serialization
          const transformedDocs = documents.map(doc => {
            const newDoc = { ...doc };
            if (newDoc._id && typeof newDoc._id === 'object') {
              newDoc._id = newDoc._id.toString();
            }
            return newDoc;
          });
          
          exportData.collections[collectionInfo.name] = transformedDocs;
          totalDocuments += transformedDocs.length;
          console.log(`✅ Exported ${transformedDocs.length} documents from ${collectionInfo.name}`);
        } catch (error) {
          console.warn(`⚠️ Failed to export collection ${collectionInfo.name}:`, error);
          exportData.collections[collectionInfo.name] = [];
        }
      }

      // Write to file
      const exportJsonString = JSON.stringify(exportData, null, 2);
      await fs.promises.writeFile(exportPath, exportJsonString, 'utf8');

      // Calculate file size
      const fileSizeBytes = Buffer.byteLength(exportJsonString, 'utf8');
      const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

      console.log(`✅ Database exported successfully: ${Object.keys(exportData.collections).length} collections, ${totalDocuments} documents, ${fileSizeMB} MB`);

      return {
        success: true,
        filePath: exportPath,
        collectionsExported: Object.keys(exportData.collections).length,
        totalDocuments,
        fileSize: `${fileSizeMB} MB`,
      };
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw new Error(`Database export failed: ${error.message}`);
    }
  });

  // Health check handler
  ipcMain.handle('db-healthCheck', async () => {
    try {
      console.log('🏥 Health check...');
      const { healthCheck } = require('../local-database.js');
      return await healthCheck();
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { healthy: false, error: error.message };
    }
  });

  // Database stats handler
  ipcMain.handle('db-getStats', async () => {
    try {
      console.log('📊 Getting database stats...');
      const { getDatabaseStats } = require('../local-database.js');
      return await getDatabaseStats();
    } catch (error) {
      console.error('❌ Stats failed:', error);
      throw error;
    }
  });

  // Storage location chooser
  ipcMain.handle('db-chooseStorageLocation', async () => {
    try {
      console.log('📂 Opening storage location chooser...');
      const { dialog } = require('electron');
      const { updateDatabasePath } = require('../user-settings.js');
      
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Choose Database Storage Location',
        message: 'Select a folder where your HealthTrack database will be stored'
      });
      
      if (result.canceled) {
        console.log('❌ Storage location selection cancelled');
        return { success: false, cancelled: true };
      }
      
      const selectedPath = result.filePaths[0];
      console.log(`📁 New database path selected: ${selectedPath}`);
      
      // Update the path in user settings
      updateDatabasePath(selectedPath);
      
      return {
        success: true,
        path: selectedPath,
        requiresRestart: true
      };
    } catch (error) {
      console.error('❌ Storage location chooser failed:', error);
      throw new Error(`Failed to choose storage location: ${error.message}`);
    }
  });

  // Storage settings handler (for advanced settings)
  ipcMain.handle('db-getStorageSettings', async () => {
    try {
      console.log('🔍 Getting storage settings...');
      const { getLocalDbPath, isLocalDatabaseConnected, getDatabaseStats } = require('../local-database.js');
      const { getUserSettings } = require('../user-settings.js');
      
      const dbPath = getLocalDbPath();
      const isConnected = isLocalDatabaseConnected();
      const userSettings = getUserSettings();
      
      // Get actual database statistics
      let statsInfo = {};
      try {
        if (isConnected) {
          const stats = await getDatabaseStats();
          statsInfo = {
            dataSize: `${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB`,
            storageSize: `${(stats.storageSize / (1024 * 1024)).toFixed(2)} MB`,
            indexSize: `${(stats.indexSize / (1024 * 1024)).toFixed(2)} MB`,
            indexes: stats.indexes,
            objects: stats.objects,
          };
        }
      } catch (statsError) {
        console.warn('⚠️ Could not get detailed stats:', statsError);
      }
      
      return {
        localPath: dbPath,
        isConnected,
        type: isConnected ? 'hybrid' : 'none',
        backupFrequency: userSettings.backupFrequency || 'weekly',
        maxBackups: userSettings.maxBackups || 5,
        autoSync: userSettings.autoSync !== false,
        compressionEnabled: userSettings.compressionEnabled !== false,
        stats: statsInfo,
        lastUpdated: new Date().toISOString(),
        settings: userSettings
      };
    } catch (error) {
      console.error('❌ Failed to get storage settings:', error);
      throw new Error(`Failed to get storage settings: ${error.message}`);
    }
  });

  console.log('✅ Test IPC handlers setup complete');
}

module.exports = {
  setupIpcHandlers: testSetupIpcHandlers
};

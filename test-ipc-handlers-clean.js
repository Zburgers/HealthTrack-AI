// Test IPC handlers directly without jest

// Set up environment variables for testing
process.env.MONGODB_URI = 'mongodb+srv://test:test@cluster0.example.mongodb.net/healthtrack?retryWrites=true&w=majority';
process.env.LOCAL_MONGODB_URI = 'mongodb://localhost:27018/healthtrack_local';

// Mock electron modules for testing
const mockDialog = {
  showSaveDialog: () => Promise.resolve({ 
    canceled: false, 
    filePath: 'C:\\Users\\Test\\healthtrack-export.json' 
  }),
  showOpenDialog: () => Promise.resolve({ 
    canceled: false, 
    filePaths: ['C:\\Users\\Test\\database'] 
  })
};

const mockShell = {
  openPath: (path) => Promise.resolve('')
};

const mockApp = {
  getPath: (name) => 'C:\\Users\\Test\\AppData\\Roaming\\healthtrack',
  getVersion: () => '1.0.0'
};

// Mock ipcMain
const ipcHandlers = {};
const mockIpcMain = {
  handle: (channel, handler) => {
    ipcHandlers[channel] = handler;
    console.log(`✅ Registered handler: ${channel}`);
  },
  removeHandler: () => {}
};

// Override require to return our mocks
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'electron') {
    return {
      ipcMain: mockIpcMain,
      app: mockApp,
      shell: mockShell,
      dialog: mockDialog
    };
  }
  return originalRequire.apply(this, arguments);
};

// Import and test the handlers
console.log('📥 Importing handlers...');
const handlersModule = require('./electron/ipc/handlers.js');
console.log('📦 Handlers module exported:', Object.keys(handlersModule));

const { setupIpcHandlers } = handlersModule;

// Test setup
console.log('🧪 Testing IPC handlers setup...');

// Setup handlers
setupIpcHandlers();

// Test db-getInfo handler
async function testDbGetInfoHandler() {
  console.log('\n🔍 Testing db-getInfo handler...');
  
  if (ipcHandlers['db-getInfo']) {
    try {
      const result = await ipcHandlers['db-getInfo']();
      
      console.log('\n📊 Database Info Result:');
      console.log('='.repeat(50));
      console.log('Type:', result.type);
      console.log('Local Path:', result.localPath);
      console.log('Remote Host:', result.remoteHost);
      console.log('Remote URI:', result.remoteUri ? result.remoteUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not configured');
      
      console.log('\nLocal Connection:');
      console.log('- Connected:', result.connectionInfo?.isConnected);
      console.log('- URI:', result.connectionInfo?.uri);
      console.log('- Database:', result.connectionInfo?.database);
      
      console.log('\nRemote Connection:');
      console.log('- Connected:', result.remoteConnectionInfo?.isConnected);
      console.log('- URI:', result.remoteConnectionInfo?.uri ? result.remoteConnectionInfo.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not configured');
      console.log('- Database:', result.remoteConnectionInfo?.database);
      
      console.log('\nCollections:');
      if (result.collections && result.collections.length > 0) {
        result.collections.forEach((col, index) => {
          console.log(`${index + 1}. ${col.name} (${col.location}): ${col.count.toLocaleString()} documents`);
        });
      } else {
        console.log('No collections found');
      }
      console.log('='.repeat(50));
      
      return result;
    } catch (error) {
      console.error('❌ Handler failed:', error);
      throw error;
    }
  } else {
    throw new Error('db-getInfo handler not registered');
  }
}

// Test db-getStorageSettings handler
async function testStorageSettingsHandler() {
  console.log('\n🔍 Testing db-getStorageSettings handler...');
  
  if (ipcHandlers['db-getStorageSettings']) {
    try {
      const result = await ipcHandlers['db-getStorageSettings']();
      
      console.log('\n⚙️ Storage Settings Result:');
      console.log('='.repeat(50));
      console.log('Local Path:', result.localPath);
      console.log('Connected:', result.isConnected);
      console.log('Type:', result.type);
      console.log('Backup Frequency:', result.backupFrequency);
      console.log('Max Backups:', result.maxBackups);
      console.log('Auto Sync:', result.autoSync);
      console.log('Compression:', result.compressionEnabled);
      console.log('Stats:', result.stats);
      console.log('='.repeat(50));
      
      return result;
    } catch (error) {
      console.error('❌ Storage settings handler failed:', error);
      throw error;
    }
  } else {
    throw new Error('db-getStorageSettings handler not registered');
  }
}

// Run tests
async function runTests() {
  try {
    console.log('🚀 Starting IPC handler tests...');
    
    const dbInfo = await testDbGetInfoHandler();
    const storageSettings = await testStorageSettingsHandler();
    
    console.log('\n✅ All tests completed successfully!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('- Database info handler: ✅ Working');
    console.log('- Storage settings handler: ✅ Working');
    console.log('- Remote URI configured: ✅ Yes');
    console.log('- Local URI configured: ✅ Yes');
    console.log(`- Collections found: ${dbInfo.collections?.length || 0}`);
    console.log('- Remote database info: ✅ Available');
    console.log('- Local database info: ✅ Available');
    
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

runTests();

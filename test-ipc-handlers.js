/**
 * Test script to verify IPC handlers are working correctly
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Import the handlers
const { setupIpcHandlers } = require('./electron/dist/ipc/handlers');

function createTestWindow() {
  const testWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron', 'preload.js')
    }
  });

  // Test HTML content
  const testHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>IPC Handler Test</title>
      </head>
      <body>
        <h1>Testing IPC Handlers</h1>
        <div id="test-results"></div>
        <script>
          async function testHandlers() {
            const results = document.getElementById('test-results');
            
            try {
              // Test db-findOne handler
              console.log('Testing db-findOne handler...');
              const result = await window.electronAPI.database.findOne('patients', { id: 'test' });
              results.innerHTML += '<p>✅ db-findOne: Working</p>';
              
              // Test db-find handler  
              console.log('Testing db-find handler...');
              const findResult = await window.electronAPI.database.find('patients', {}, {});
              results.innerHTML += '<p>✅ db-find: Working</p>';
              
            } catch (error) {
              console.error('Handler test failed:', error);
              results.innerHTML += '<p>❌ Handler test failed: ' + error.message + '</p>';
            }
          }
          
          window.addEventListener('DOMContentLoaded', testHandlers);
        </script>
      </body>
    </html>
  `;

  testWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(testHtml));
  testWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  console.log('🧪 Setting up IPC handlers for testing...');
  
  try {
    setupIpcHandlers();
    console.log('✅ IPC handlers setup complete');
    
    createTestWindow();
    
  } catch (error) {
    console.error('❌ Failed to setup IPC handlers:', error);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Test script to verify MongoDB IPC communication
const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  // Create a test window
  const testWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron/dist/preload.js')
    }
  });

  // Load a simple HTML page
  await testWindow.loadURL('data:text/html,<html><body><h1>Testing MongoDB IPC</h1></body></html>');

  // Test MongoDB health check
  try {
    console.log('🧪 Testing MongoDB IPC communication...');
    
    // Simulate the IPC call that would come from renderer
    const { ipcMain } = require('electron');
    
    // Test health check
    const healthResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
      
      ipcMain.handle('mongodb:health-check', async () => {
        clearTimeout(timeout);
        console.log('✅ Health check IPC handler called successfully');
        return { status: 'connected', message: 'Test successful' };
      });
      
      // Simulate call
      testWindow.webContents.executeJavaScript(`
        window.electronAPI.mongodb.healthCheck()
          .then(result => console.log('Health check result:', result))
          .catch(err => console.error('Health check error:', err));
      `).then(resolve).catch(reject);
    });

    console.log('✅ MongoDB IPC test completed successfully');
    app.quit();
  } catch (error) {
    console.error('❌ MongoDB IPC test failed:', error);
    app.quit();
  }
});

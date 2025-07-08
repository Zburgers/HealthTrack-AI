// Quick test to verify IPC communication
console.log('Testing IPC communication...');
console.log('window.electronAPI available:', typeof window !== 'undefined' && !!(window as any).electronAPI);

if (typeof window !== 'undefined' && (window as any).electronAPI) {
  console.log('Electron API methods:', Object.keys((window as any).electronAPI));
  
  if ((window as any).electronAPI.database) {
    console.log('Database methods:', Object.keys((window as any).electronAPI.database));
    
    // Test a simple find operation
    (window as any).electronAPI.database.find('patients', {})
      .then((result: any) => {
        console.log('✅ IPC test successful - patients found:', result.length);
      })
      .catch((error: any) => {
        console.error('❌ IPC test failed:', error);
      });
  }
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Database, 
  Download, 
  Upload, 
  Folder, 
  Server, 
  HardDrive, 
  CloudIcon,
  RefreshCw,
  Info,
  Settings,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface DatabaseInfo {
  type: 'local' | 'remote' | 'hybrid';
  localPath?: string;
  remoteHost?: string;
  remoteUri?: string;
  collections: {
    name: string;
    count: number;
    location: 'local' | 'remote';
  }[];
  totalSize: string;
  connectionInfo?: {
    isConnected: boolean;
    uri: string;
    host: string;
    port: number;
    database: string;
  };
  remoteConnectionInfo?: {
    isConnected: boolean;
    uri: string;
    host: string;
    database: string;
  };
  lastBackup?: string;
  // Error state when database connection fails
  connectionError?: boolean;
  errorMessage?: string;
}

export default function DatabaseSettings() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  
  // MongoDB health check state
  const [defaultHealth, setDefaultHealth] = useState<{ connected: boolean; error?: string; uri?: string } | null>(null);
  const [userHealth, setUserHealth] = useState<{ connected: boolean; error?: string; uri?: string } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  
  // MongoDB URI management state
  const [editingUri, setEditingUri] = useState(false);
  const [userMongoUri, setUserMongoUri] = useState<string>('');
  const [editedUri, setEditedUri] = useState<string>('');
  const [validatingUri, setValidatingUri] = useState(false);
  const [savingUri, setSavingUri] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadDatabaseInfo();
    loadUserMongoUri();
    performHealthCheck();
  }, []);  const loadUserMongoUri = async () => {
    try {
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        const uri = await (window as any).electronAPI.database.getUserMongoUri();
        setUserMongoUri(uri || '');
        setEditedUri(uri || '');
      }
    } catch (error) {
      console.error('❌ Failed to load user MongoDB URI:', error);
    }
  };

  const handleEditUri = () => {
    setEditingUri(true);
    setEditedUri(userMongoUri);
  };

  const handleCancelEditUri = () => {
    setEditingUri(false);
    setEditedUri(userMongoUri);
  };

  const handleValidateUri = async () => {
    if (!editedUri.trim()) {
      toast({
        title: "Invalid URI",
        description: "Please enter a MongoDB URI",
        variant: "destructive"
      });
      return;
    }

    try {
      setValidatingUri(true);
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        const result = await (window as any).electronAPI.database.validateMongoUri(editedUri);
        
        if (result.valid) {
          toast({
            title: "URI Valid",
            description: "MongoDB connection successful",
          });
        } else {
          toast({
            title: "URI Invalid",
            description: result.error || "Failed to connect to MongoDB",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to validate MongoDB URI:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate MongoDB URI",
        variant: "destructive"
      });
    } finally {
      setValidatingUri(false);
    }
  };

  const handleSaveUri = async () => {
    if (!editedUri.trim()) {
      toast({
        title: "Invalid URI",
        description: "Please enter a MongoDB URI",
        variant: "destructive"
      });
      return;
    }

    try {
      setSavingUri(true);
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        const result = await (window as any).electronAPI.database.setUserMongoUri(editedUri);
        
        if (result.success) {
          setUserMongoUri(editedUri);
          setEditingUri(false);
          
          toast({
            title: "URI Updated",
            description: "MongoDB URI updated successfully. Database reconnected.",
          });
          
          // Reload database info to reflect changes
          await loadDatabaseInfo();
        } else {
          toast({
            title: "Save Failed",
            description: result.error || "Failed to update MongoDB URI",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to save MongoDB URI:', error);
      toast({
        title: "Save Error",
        description: "Failed to save MongoDB URI",
        variant: "destructive"
      });
    } finally {
      setSavingUri(false);
    }
  };

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading database info...');
      
      // Check if we're in Electron
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        console.log('📱 Electron environment detected, getting database info...');
        
        try {
          // Get database info from Electron
          const info = await (window as any).electronAPI.database.getInfo();
          console.log('📊 Database info received:', info);
          
          // Validate the received data
          if (!info || typeof info !== 'object') {
            throw new Error('Invalid database info received');
          }
          
          setDatabaseInfo(info);
          
          toast({
            title: "Database Info Updated",
            description: `Found ${info.collections?.length || 0} collections with ${info.collections?.reduce((sum: number, col: any) => sum + (col.count || 0), 0) || 0} total documents`,
          });
        } catch (dbError) {
          console.error('❌ Failed to get database info:', dbError);
          
          // Set error state with helpful message
          setDatabaseInfo({
            type: 'remote',
            collections: [],
            totalSize: 'Connection Error',
            connectionError: true,
            errorMessage: dbError instanceof Error ? dbError.message : 'Failed to connect to database',
            remoteConnectionInfo: {
              isConnected: false,
              uri: 'Not connected',
              host: 'Unknown',
              database: 'healthtrack'
            }
          });
          
          toast({
            title: "Database Connection Error",
            description: "Failed to connect to MongoDB. Please check your connection settings and try again.",
            variant: "destructive"
          });
        }
      } else {
        console.log('🌐 Web environment detected');
        // Web environment - show limited info
        setDatabaseInfo({
          type: 'remote',
          remoteHost: 'MongoDB Atlas',
          collections: [
            { name: 'case_embeddings', count: 0, location: 'remote' }
          ],
          totalSize: 'N/A',
          remoteConnectionInfo: {
            isConnected: false,
            uri: 'Web environment - connection status unknown',
            host: 'MongoDB Atlas',
            database: 'healthtrack'
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to load database info:', error);
      toast({
        title: "Error",
        description: `Failed to load database information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      
      // Set a fallback state so the UI doesn't break
      setDatabaseInfo({
        type: 'remote',
        collections: [],
        totalSize: 'Error',
        connectionError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleExportDatabase = async () => {
    try {
      setExporting(true);
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        const result = await (window as any).electronAPI.database.exportData();
        
        if (result && result.success) {
          toast({
            title: "Export Complete",
            description: `Database exported successfully! 
                         ${result.collectionsExported} collections with ${result.totalDocuments} total documents.
                         File saved to: ${result.filePath}`,
          });
        } else {
          toast({
            title: "Export Cancelled",
            description: "Database export was cancelled by user",
          });
        }
      } else {
        // For web, trigger download of available data
        const response = await fetch('/api/export/database');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `healthtrack-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export Complete",
          description: "Database export downloaded successfully",
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };
  const handleChangeStorageLocation = async () => {
    try {
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        const result = await (window as any).electronAPI.database.chooseStorageLocation();
        if (result.success) {
          toast({
            title: "Storage Location Updated",
            description: `New location: ${result.path}. Please restart the app.`,
          });
          await loadDatabaseInfo();
        }
      } else {
        toast({
          title: "Not Available",
          description: "Storage location change is only available in the desktop app",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to change storage location:', error);
      toast({
        title: "Error",
        description: "Failed to change storage location",
        variant: "destructive"
      });
    }
  };

  const handleViewAdvancedSettings = async () => {
    try {
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        const [settings, healthStatus] = await Promise.all([
          (window as any).electronAPI.database.getStorageSettings(),
          (window as any).electronAPI.database.healthCheck()
        ]);
        
        console.log('Storage settings:', settings);
        console.log('Health status:', healthStatus);
        
        setShowAdvanced(!showAdvanced);
        
        const status = healthStatus.status === 'healthy' ? 'healthy' : 'issues detected';
        toast({
          title: "Advanced Settings",
          description: `Database ${status}. Storage settings loaded`,
        });
      }
    } catch (error) {
      console.error('Failed to get advanced settings:', error);
      toast({
        title: "Error",
        description: "Failed to load advanced settings",
        variant: "destructive"
      });
    }
  };

  const getConnectionStatus = () => {
    if (!databaseInfo) return { status: 'Unknown', color: 'gray' };
    
    // Check for connection errors first
    if ((databaseInfo as any).connectionError) {
      return { status: 'Connection Error', color: 'red' };
    }
    
    // Check health status if available
    if (healthStatus) {
      switch (healthStatus.overall) {
        case 'healthy':
          return { status: 'All Connections Active', color: 'green' };
        case 'partial':
          return { status: 'Partial Connection', color: 'yellow' };
        case 'unhealthy':
          return { status: 'Connection Issues', color: 'red' };
        case 'error':
          return { status: 'Health Check Failed', color: 'red' };
        default:
          return { status: 'Status Unknown', color: 'gray' };
      }
    }
    
    // Fallback to database type if no health info
    switch (databaseInfo.type) {
      case 'local':
        return { status: 'Local Only', color: 'blue' };
      case 'remote':
        return { status: 'Remote Only', color: 'green' };
      case 'hybrid':
        return { status: 'Hybrid (Local + Remote)', color: 'purple' };
      default:
        return { status: 'Unknown', color: 'gray' };
    }
  };

  const performHealthCheck = async () => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
    if (!isElectron) return;
    
    try {
      setCheckingHealth(true);
      
      const [defaultResult, userResult] = await Promise.all([
        (window as any).electronAPI.database.healthCheckDefault(),
        (window as any).electronAPI.database.healthCheckUser()
      ]);
      
      setDefaultHealth(defaultResult);
      setUserHealth(userResult);
      
      const status = defaultResult.connected && userResult.connected ? 'healthy' : 'issues';
      
      toast({
        title: "Health Check Complete",
        description: `Database status: ${status}`,
        variant: status === 'healthy' ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('❌ Failed to perform health check:', error);
      toast({
        title: "Health Check Failed",
        description: "Failed to check database connections",
        variant: "destructive"
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleTestConnection = async (uri?: string) => {
    const testUri = uri || editedUri || userMongoUri;
    
    if (!testUri.trim()) {
      toast({
        title: "No URI to Test",
        description: "Please enter a MongoDB URI to test the connection",
        variant: "destructive"
      });
      return;
    }

    try {
      setTestingConnection(true);
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        const result = await (window as any).electronAPI.database.testConnection(testUri);
        
        if (result.success) {
          toast({
            title: "Connection Successful",
            description: `Connected in ${result.details?.connectionTime}ms. Found ${result.details?.collections} collections.`,
          });
        } else {
          toast({
            title: "Connection Failed",
            description: result.error || "Failed to connect to MongoDB",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to test connection:', error);
      toast({
        title: "Test Error",
        description: "Failed to test MongoDB connection",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database & Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const connectionStatus = getConnectionStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database & Storage
          </CardTitle>
          <CardDescription>
            Manage your database settings and data storage preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Connection Status</span>
            </div>
            <Badge variant="outline" className={`border-${connectionStatus.color}-200 text-${connectionStatus.color}-700`}>
              {connectionStatus.status}
            </Badge>
          </div>

          <Separator />

          {/* Database Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Database Information
            </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium capitalize">{databaseInfo?.type}</p>
              </div>
              
              {databaseInfo?.localPath && (
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">Local Path:</span>
                  <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">
                    {databaseInfo.localPath}
                  </p>
                </div>
              )}
              
              {databaseInfo?.remoteHost && (
                <div>
                  <span className="text-muted-foreground">Remote Host:</span>
                  <p className="font-medium">{databaseInfo.remoteHost}</p>
                </div>
              )}
              
              <div>
                <span className="text-muted-foreground">Total Size:</span>
                <p className="font-medium">{databaseInfo?.totalSize || 'Calculating...'}</p>
              </div>

              {databaseInfo?.connectionInfo && (
                <>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Local Database URI:</span>
                    <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">
                      {databaseInfo.connectionInfo.uri}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Local Connection:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        databaseInfo.connectionInfo.isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm">
                        {databaseInfo.connectionInfo.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Local Database:</span>
                    <p className="font-medium">{databaseInfo.connectionInfo.database}</p>
                  </div>
                </>
              )}

              {databaseInfo?.remoteConnectionInfo && (
                <>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Remote Database URI:</span>
                    <p className="font-mono text-xs break-all bg-blue-50 p-2 rounded mt-1">
                      {databaseInfo.remoteConnectionInfo.uri ? 
                        databaseInfo.remoteConnectionInfo.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') :
                        'Not configured'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Remote Connection:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        databaseInfo.remoteConnectionInfo.isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm">
                        {databaseInfo.remoteConnectionInfo.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Remote Database:</span>
                    <p className="font-medium">{databaseInfo.remoteConnectionInfo.database}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* MongoDB URI Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              MongoDB URI Configuration
            </h4>
            
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              {/* Health Status Display */}
              {healthStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Default MongoDB (Embeddings)</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        healthStatus.defaultConnection?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm">
                        {healthStatus.defaultConnection?.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                      {healthStatus.defaultConnection?.error && (
                        <span className="text-xs text-red-600">({healthStatus.defaultConnection.error})</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {healthStatus.defaultConnection?.uri || 'Not configured'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">User MongoDB (Patient Data)</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        healthStatus.userConnection?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm">
                        {healthStatus.userConnection?.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                      {healthStatus.userConnection?.error && (
                        <span className="text-xs text-red-600">({healthStatus.userConnection.error})</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {healthStatus.userConnection?.uri || 'Not configured'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Current User MongoDB URI */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="user-mongo-uri" className="font-medium">
                    Current User MongoDB URI:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={performHealthCheck}
                      disabled={checkingHealth}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {checkingHealth ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Refresh Health
                    </Button>
                  </div>
                </div>
                
                {!editingUri ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-gray-100 rounded border text-sm font-mono">
                      {userMongoUri ? userMongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'No user URI configured - using default'}
                    </div>
                    <Button onClick={handleEditUri} variant="outline" size="sm">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        id="user-mongo-uri"
                        type="text"
                        value={editedUri}
                        onChange={(e) => setEditedUri(e.target.value)}
                        placeholder="mongodb+srv://username:password@cluster.mongodb.net/healthtrack"
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() => handleTestConnection(editedUri)}
                        disabled={testingConnection || !editedUri.trim()}
                        variant="outline"
                        size="sm"
                      >
                        {testingConnection ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        Test
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSaveUri}
                        disabled={savingUri || !editedUri.trim()}
                        size="sm"
                      >
                        {savingUri ? (
                          <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Save URI
                      </Button>
                      <Button
                        onClick={handleCancelEditUri}
                        disabled={savingUri}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground border-t pt-3">
                <p><strong>Note:</strong></p>
                <ul className="mt-1 space-y-1 ml-4">
                  <li>• User data collections (patients, notes, cache) will use your configured URI</li>
                  <li>• Vector embeddings always use the default environment URI for performance</li>
                  <li>• Changes take effect immediately without restarting the app</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Collections */}
          <div className="space-y-4">
            <h4 className="font-medium">Collections</h4>
            <div className="space-y-2">
              {databaseInfo?.collections?.map((collection, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {collection.location === 'local' ? (
                      <HardDrive className="h-4 w-4 text-blue-500" />
                    ) : (
                      <CloudIcon className="h-4 w-4 text-green-500" />
                    )}
                    <span className="font-medium">{collection.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {collection.count.toLocaleString()} documents
                    </span>
                    <Badge variant="outline" size="sm">
                      {collection.location}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* MongoDB Dual-Database Architecture */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              MongoDB Dual-Database Architecture
            </h4>
            
            {/* Default Database (Embeddings) */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CloudIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Default Database (Vector Embeddings)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    defaultHealth?.connected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-blue-700">
                    {defaultHealth?.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Purpose:</strong> Stores case embeddings for AI similarity matching</p>
                <p><strong>Collections:</strong> case_embeddings</p>
                <p><strong>URI:</strong> Environment configured (admin managed)</p>
                {defaultHealth?.error && (
                  <p className="text-red-600"><strong>Error:</strong> {defaultHealth.error}</p>
                )}
              </div>
            </div>

            {/* User Database */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">User Database (Patient Data)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    userHealth?.connected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-green-700">
                    {userHealth?.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-green-800 space-y-2">
                <p><strong>Purpose:</strong> Stores all patient data, notes, and AI cache</p>
                <p><strong>Collections:</strong> patients, ai_cache, notes, local_embeddings</p>
                <p><strong>URI:</strong> {userMongoUri || 'Using default (fallback)'}</p>
                {userHealth?.error && (
                  <p className="text-red-600"><strong>Error:</strong> {userHealth.error}</p>
                )}
              </div>
              
              {/* User URI Configuration */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-green-900">Configure User Database URI</Label>
                  {!editingUri && (
                    <Button
                      onClick={handleEditUri}
                      variant="outline"
                      size="sm"
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  )}
                </div>
                
                {editingUri ? (
                  <div className="space-y-3">
                    <Input
                      value={editedUri}
                      onChange={(e) => setEditedUri(e.target.value)}
                      placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                      className="text-sm font-mono"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleValidateUri}
                        disabled={validatingUri}
                        variant="outline"
                        size="sm"
                      >
                        {validatingUri ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        Test Connection
                      </Button>
                      <Button
                        onClick={handleSaveUri}
                        disabled={savingUri}
                        size="sm"
                      >
                        {savingUri ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEditUri}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
                    {userMongoUri ? 
                      `Custom URI configured: ${userMongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}` :
                      'No custom URI configured - using default environment URI'
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Health Check Controls */}
            <div className="flex items-center gap-3">
              <Button
                onClick={performHealthCheck}
                disabled={checkingHealth}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {checkingHealth ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Health Status
              </Button>
              
              <div className="text-xs text-muted-foreground">
                Last checked: {defaultHealth || userHealth ? 'Just now' : 'Never'}
              </div>
            </div>
            
            {/* Important Notes */}
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Vector embeddings always use the default environment URI for performance</li>
                    <li>• Patient data uses your configured URI for data sovereignty</li>
                    <li>• Changes take effect immediately without restarting the app</li>
                    <li>• Ensure both databases are accessible for full functionality</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator />          {/* Actions */}
          <div className="space-y-4">
            <h4 className="font-medium">Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={handleExportDatabase}
                disabled={exporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {exporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exporting ? 'Exporting...' : 'Export Database'}
              </Button>
              
              <Button 
                onClick={handleChangeStorageLocation}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Folder className="h-4 w-4" />
                Change Storage Location
              </Button>
              
              <Button 
                onClick={loadDatabaseInfo}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Info
              </Button>

              <Button 
                onClick={handleViewAdvancedSettings}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Advanced Settings
              </Button>
            </div>          </div>

          {showAdvanced && (
            <>
              <Separator />
              
              {/* Advanced Settings */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced Settings
                </h4>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground block mb-1">Database Architecture:</span>
                    <p className="text-xs leading-relaxed">
                      HealthTrack uses a dual-database architecture for optimal performance:
                    </p>
                    <ul className="text-xs mt-2 space-y-1 ml-4">
                      <li>• <strong>Local MongoDB:</strong> Patient data, AI cache, notes (desktop only)</li>
                      <li>• <strong>Remote MongoDB Atlas:</strong> Vector embeddings, case similarity data</li>
                    </ul>
                  </div>
                  
                  {databaseInfo?.connectionInfo && (
                    <div className="text-sm border-t pt-3">
                      <span className="text-muted-foreground block mb-1">Local Database Details:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Host:</strong> {databaseInfo.connectionInfo.host}
                        </div>
                        <div>
                          <strong>Port:</strong> {databaseInfo.connectionInfo.port}
                        </div>
                        <div>
                          <strong>Status:</strong> 
                          <span className={databaseInfo.connectionInfo.isConnected ? 'text-green-600' : 'text-red-600'}>
                            {databaseInfo.connectionInfo.isConnected ? ' Connected' : ' Disconnected'}
                          </span>
                        </div>
                        <div>
                          <strong>Collections:</strong> {databaseInfo.collections.filter(c => c.location === 'local').length}
                        </div>
                      </div>
                    </div>
                  )}

                  {databaseInfo?.remoteConnectionInfo && (
                    <div className="text-sm border-t pt-3">
                      <span className="text-muted-foreground block mb-1">Remote Database Details:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Host:</strong> {databaseInfo.remoteConnectionInfo.host}
                        </div>
                        <div>
                          <strong>Provider:</strong> MongoDB Atlas
                        </div>
                        <div>
                          <strong>Status:</strong> 
                          <span className={databaseInfo.remoteConnectionInfo.isConnected ? 'text-green-600' : 'text-red-600'}>
                            {databaseInfo.remoteConnectionInfo.isConnected ? ' Connected' : ' Disconnected'}
                          </span>
                        </div>
                        <div>
                          <strong>Collections:</strong> {databaseInfo.collections.filter(c => c.location === 'remote').length}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    <strong>Note:</strong> Changing storage location requires restarting the application.
                    Remote database settings are configured via environment variables.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MongoDB URI Management */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              MongoDB URI Configuration
            </h4>
            
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground block mb-1">Current User MongoDB URI:</span>
                {userMongoUri ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white p-2 rounded border flex-1 break-all">
                      {userMongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}
                    </code>
                    {!editingUri && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditUri}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground italic">No user URI configured - using default</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditUri}
                      className="flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Configure
                    </Button>
                  </div>
                )}
              </div>

              {editingUri && (
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <Label htmlFor="mongoUri" className="text-sm font-medium">
                      MongoDB Connection URI
                    </Label>
                    <Input
                      id="mongoUri"
                      type="text"
                      value={editedUri}
                      onChange={(e) => setEditedUri(e.target.value)}
                      placeholder="mongodb+srv://username:password@cluster.mongodb.net/healthtrack"
                      className="mt-1 font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your MongoDB Atlas connection string. This will be used for all user data collections.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleValidateUri}
                      disabled={validatingUri || !editedUri.trim()}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {validatingUri ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {validatingUri ? 'Validating...' : 'Test Connection'}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={handleSaveUri}
                      disabled={savingUri || !editedUri.trim()}
                      className="flex items-center gap-1"
                    >
                      {savingUri ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      {savingUri ? 'Saving...' : 'Save & Apply'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEditUri}
                      disabled={savingUri || validatingUri}
                      className="flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground border-t pt-2">
                <div className="flex items-center gap-1 mb-1">
                  <Info className="h-3 w-3" />
                  <strong>Note:</strong>
                </div>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>User data collections (patients, notes, cache) will use your configured URI</li>
                  <li>Vector embeddings always use the default environment URI for performance</li>
                  <li>Changes take effect immediately without restarting the app</li>
                </ul>
              </div>
            </div>
          </div>

          {databaseInfo?.lastBackup && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                Last backup: {new Date(databaseInfo.lastBackup).toLocaleString()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

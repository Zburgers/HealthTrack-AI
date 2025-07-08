'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Settings
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
}

export default function DatabaseSettings() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDatabaseInfo();
  }, []);  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading database info...');
      
      // Check if we're in Electron
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        console.log('📱 Electron environment detected, getting database info...');
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
      } else {
        console.log('🌐 Web environment detected');
        // Web environment - remote only
        setDatabaseInfo({
          type: 'remote',
          remoteHost: 'MongoDB Atlas',
          collections: [
            { name: 'patients', count: 0, location: 'remote' },
            { name: 'case_embeddings', count: 10000, location: 'remote' }
          ],
          totalSize: 'N/A'
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
        type: 'local',
        collections: [],
        totalSize: 'Error'
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
    if (!databaseInfo) return { status: 'unknown', color: 'gray' };
    
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

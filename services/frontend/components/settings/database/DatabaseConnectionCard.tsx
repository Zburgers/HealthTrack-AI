'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Cloud, 
  HardDrive, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  TestTube,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for the Switchboard API
interface DataSource {
  id: string;
  name: string;
  description?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'initializing_source' | 'validating_config' | 'authenticating' | 'connection_failed';
}

interface ActiveStatus {
  sourceId: string | null;
  status: string | null;
  error: Error | null;
}

interface ConnectionInfo {
  isConnected: boolean;
  uri?: string;
  database?: string;
  collections?: string[];
  lastConnected?: string;
  serverInfo?: any;
}

const DatabaseConnectionCard: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [activeStatus, setActiveStatus] = useState<ActiveStatus>({ sourceId: null, status: null, error: null });
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mongoUri, setMongoUri] = useState('');
  
  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

  /**
   * Load available data sources
   */
  const loadDataSources = async () => {
    if (!isElectron) return;
    
    try {
      const sources = await (window as any).electronAPI.dataSource.getAvailable();
      setDataSources(sources);
      console.log('📊 [DB_CONNECTION] Loaded data sources:', sources);
    } catch (error) {
      console.error('❌ [DB_CONNECTION] Failed to load data sources:', error);
      setError('Failed to load available data sources');
    }
  };

  /**
   * Load active connection status
   */
  const loadActiveStatus = async () => {
    if (!isElectron) return;
    
    try {
      const status = await (window as any).electronAPI.dataSource.getActiveStatus();
      setActiveStatus(status);
      
      if (status.sourceId) {
        const info = await (window as any).electronAPI.dataSource.getConnectionInfo();
        setConnectionInfo(info);
      } else {
        setConnectionInfo(null);
      }
    } catch (error) {
      console.error('❌ [DB_CONNECTION] Failed to load active status:', error);
    }
  };

  /**
   * Load user's saved MongoDB URI
   */
  const loadMongoUri = async () => {
    if (!isElectron) return;
    
    try {
      const uri = await (window as any).electronAPI.database.getUserMongoUri();
      if (uri) {
        setMongoUri(uri);
      }
    } catch (error) {
      console.error('❌ [DB_CONNECTION] Failed to load MongoDB URI:', error);
    }
  };

  /**
   * Connect to a data source
   */
  const connectToSource = async (sourceId: string, config: Record<string, any> = {}) => {
    if (!isElectron) return;
    
    setIsConnecting(sourceId);
    setError(null);
    
    try {
      console.log(`🔌 [DB_CONNECTION] Connecting to ${sourceId}...`);
      await (window as any).electronAPI.dataSource.connect(sourceId, config);
      
      // Refresh status
      await loadActiveStatus();
      await loadDataSources();
      
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${sourceId}`,
        variant: "default",
      });
      
      console.log(`✅ [DB_CONNECTION] Successfully connected to ${sourceId}`);
    } catch (error: any) {
      console.error(`❌ [DB_CONNECTION] Failed to connect to ${sourceId}:`, error);
      const errorMessage = `Failed to connect to ${sourceId}: ${error.message}`;
      setError(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(null);
    }
  };

  /**
   * Disconnect from current data source
   */
  const disconnect = async () => {
    if (!isElectron) return;
    
    setIsConnecting('disconnecting');
    setError(null);
    
    try {
      await (window as any).electronAPI.dataSource.disconnect();
      
      // Refresh status
      await loadActiveStatus();
      await loadDataSources();
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from data source",
        variant: "default",
      });
      
      console.log('✅ [DB_CONNECTION] Disconnected successfully');
    } catch (error: any) {
      console.error('❌ [DB_CONNECTION] Failed to disconnect:', error);
      const errorMessage = `Failed to disconnect: ${error.message}`;
      setError(errorMessage);
      
      toast({
        title: "Disconnect Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(null);
    }
  };

  /**
   * Test connection to MongoDB Atlas
   */
  const testConnection = async () => {
    if (!isElectron || !mongoUri) return;
    
    setIsConnecting('testing');
    setError(null);
    
    try {
      const result = await (window as any).electronAPI.database.testConnection(mongoUri);
      
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: "MongoDB Atlas connection is working",
          variant: "default",
        });
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error: any) {
      console.error('❌ [DB_CONNECTION] Connection test failed:', error);
      const errorMessage = `Connection test failed: ${error.message}`;
      setError(errorMessage);
      
      toast({
        title: "Connection Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(null);
    }
  };

  /**
   * Save MongoDB URI
   */
  const saveMongoUri = async () => {
    if (!isElectron || !mongoUri) return;
    
    try {
      await (window as any).electronAPI.database.setUserMongoUri(mongoUri);
      
      toast({
        title: "URI Saved",
        description: "MongoDB URI has been saved",
        variant: "default",
      });
    } catch (error: any) {
      console.error('❌ [DB_CONNECTION] Failed to save MongoDB URI:', error);
      toast({
        title: "Save Failed",
        description: `Failed to save MongoDB URI: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Perform health check
   */
  const performHealthCheck = async () => {
    if (!isElectron) return;
    
    setIsConnecting('health-check');
    setError(null);
    
    try {
      const health = await (window as any).electronAPI.database.health();
      
      if (health.status === 'ok') {
        toast({
          title: "Health Check Passed",
          description: "Database is healthy and responding",
          variant: "default",
        });
      } else {
        throw new Error(health.details || 'Health check failed');
      }
    } catch (error: any) {
      console.error('❌ [DB_CONNECTION] Health check failed:', error);
      const errorMessage = `Health check failed: ${error.message}`;
      setError(errorMessage);
      
      toast({
        title: "Health Check Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(null);
    }
  };

  // Load initial data
  useEffect(() => {
    if (isElectron) {
      loadDataSources();
      loadActiveStatus();
      loadMongoUri();
    }
  }, [isElectron]);

  // Status icon helper
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
      case 'initializing_source':
      case 'validating_config':
      case 'authenticating':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
      case 'connection_failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'default',
      connecting: 'secondary',
      error: 'destructive',
      disconnected: 'outline'
    } as const;
    
    const variant = variants[status as keyof typeof variants] || 'outline';
    
    return (
      <Badge variant={variant} className="ml-2">
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!isElectron) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connection
          </CardTitle>
          <CardDescription>
            Database management is only available in the Electron desktop application.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection
        </CardTitle>
        <CardDescription>
          Manage your database connections and view connection status.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Connection Status */}
        {activeStatus.sourceId && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Active Connection
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(activeStatus?.status || 'disconnected')}
                <span className="font-medium">{activeStatus?.sourceId || 'No Source'}</span>
                {getStatusBadge(activeStatus?.status || 'disconnected')}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={disconnect}
                disabled={isConnecting === 'disconnecting'}
              >
                {isConnecting === 'disconnecting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </Button>
            </div>
            
            {connectionInfo && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <div>Database: {connectionInfo.database}</div>
                {connectionInfo.uri && <div>URI: {connectionInfo.uri}</div>}
                {connectionInfo.collections && (
                  <div>Collections: {connectionInfo.collections.length}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Data Source Selection */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Available Data Sources</h3>
          <div className="grid gap-4">
            {dataSources.map((source) => (
              <Card key={source.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {source.id === 'mongodb-memory' ? (
                        <HardDrive className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Cloud className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <div className="font-medium flex items-center">
                          {source.name}
                          {getStatusBadge(source.status)}
                        </div>
                        {source.description && (
                          <div className="text-sm text-gray-500">{source.description}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusIcon(source.status)}
                      {source.status === 'disconnected' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (source.id === 'mongodb-atlas') {
                              if (!mongoUri) {
                                setError('Please enter a MongoDB URI for Atlas connection');
                                return;
                              }
                              connectToSource(source.id, { uri: mongoUri });
                            } else {
                              connectToSource(source.id);
                            }
                          }}
                          disabled={isConnecting === source.id}
                        >
                          {isConnecting === source.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Atlas-specific configuration */}
                  {source.id === 'mongodb-atlas' && source.status === 'disconnected' && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div>
                        <Label htmlFor="mongoUri" className="text-sm font-medium">
                          MongoDB Atlas URI
                        </Label>
                        <Input
                          id="mongoUri"
                          type="text"
                          placeholder="mongodb+srv://user:pass@cluster.mongodb.net/database"
                          value={mongoUri}
                          onChange={(e) => setMongoUri(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={testConnection}
                          disabled={!mongoUri || isConnecting === 'testing'}
                        >
                          {isConnecting === 'testing' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="h-4 w-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={saveMongoUri}
                          disabled={!mongoUri}
                        >
                          Save URI
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={loadDataSources}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Sources
          </Button>
          <Button variant="outline" onClick={loadActiveStatus}>
            <Activity className="h-4 w-4 mr-2" />
            Check Status
          </Button>
          <Button 
            variant="outline" 
            onClick={performHealthCheck}
            disabled={isConnecting === 'health-check'}
          >
            {isConnecting === 'health-check' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Health Check
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseConnectionCard;

/**
 * DataSourceManager UI Component
 * 
 * This component provides a user interface for Clara's Switchboard Architecture,
 * allowing users to explicitly connect to different data sources and see their status.
 * 
 * This replaces the implicit, automatic connection behavior with explicit user control.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Cloud, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Loader2 
} from 'lucide-react';

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

export default function DataSourceManager() {
  // State management
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [activeStatus, setActiveStatus] = useState<ActiveStatus>({ sourceId: null, status: null, error: null });
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mongoUri, setMongoUri] = useState('');
  
  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  /**
   * Load available data sources
   */
  const loadDataSources = async () => {
    if (!isElectron) return;
    
    try {
      const sources = await window.electronAPI.dataSource.getAvailable();
      setDataSources(sources);
      console.log('📊 [CONNECTION_MANAGER] Loaded data sources:', sources);
    } catch (error) {
      console.error('❌ [CONNECTION_MANAGER] Failed to load data sources:', error);
      setError('Failed to load available data sources');
    }
  };

  /**
   * Load active connection status
   */
  const loadActiveStatus = async () => {
    if (!isElectron) return;
    
    try {
      const status = await window.electronAPI.dataSource.getActiveStatus();
      setActiveStatus(status);
      
      if (status.sourceId) {
        const info = await window.electronAPI.dataSource.getConnectionInfo();
        setConnectionInfo(info);
      } else {
        setConnectionInfo(null);
      }
    } catch (error) {
      console.error('❌ [CONNECTION_MANAGER] Failed to load active status:', error);
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
      console.log(`🔌 [CONNECTION_MANAGER] Connecting to ${sourceId}...`);
      await window.electronAPI.dataSource.connect(sourceId, config);
      
      // Refresh status
      await loadActiveStatus();
      await loadDataSources();
      
      console.log(`✅ [CONNECTION_MANAGER] Successfully connected to ${sourceId}`);
    } catch (error: any) {
      console.error(`❌ [CONNECTION_MANAGER] Failed to connect to ${sourceId}:`, error);
      setError(`Failed to connect to ${sourceId}: ${error.message}`);
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
      await window.electronAPI.dataSource.disconnect();
      
      // Refresh status
      await loadActiveStatus();
      await loadDataSources();
      
      console.log('✅ [CONNECTION_MANAGER] Disconnected successfully');
    } catch (error: any) {
      console.error('❌ [CONNECTION_MANAGER] Failed to disconnect:', error);
      setError(`Failed to disconnect: ${error.message}`);
    } finally {
      setIsConnecting(null);
    }
  };

  // Load initial data
  useEffect(() => {
    if (isElectron) {
      loadDataSources();
      loadActiveStatus();
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
      connected: 'success',
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
      <Card>
        <CardHeader>
          <CardTitle>🎯 Clara's Switchboard</CardTitle>
          <CardDescription>
            The Switchboard is only available in the Electron desktop application.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            🎯 Clara's Switchboard Architecture
          </CardTitle>
          <CardDescription>
            Centralized data source management for HealthTrackAI. 
            Choose your data source and connect explicitly.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Connection Status */}
          {activeStatus.sourceId && (
            <div className="bg-blue-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Active Connection
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(activeStatus.status || 'disconnected')}
                  <span className="font-medium">{activeStatus.sourceId}</span>
                  {getStatusBadge(activeStatus.status || 'disconnected')}
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
                <div className="mt-3 text-sm text-gray-600">
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
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Available Data Sources */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Available Data Sources</h3>
            <div className="grid gap-4">
              {dataSources.map((source) => (
                <Card key={source.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {source.id === 'mongodb-memory' ? (
                          <Database className="h-5 w-5 text-blue-500" />
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
                                // For Atlas, we need a URI
                                if (!mongoUri) {
                                  setError('Please enter a MongoDB URI for Atlas connection');
                                  return;
                                }
                                connectToSource(source.id, { uri: mongoUri });
                              } else {
                                // For Memory Server, no config needed
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
                      <div className="mt-3 pt-3 border-t">
                        <Label htmlFor="mongoUri" className="text-sm">MongoDB Atlas URI</Label>
                        <Input
                          id="mongoUri"
                          type="text"
                          placeholder="mongodb+srv://user:pass@cluster.mongodb.net/database"
                          value={mongoUri}
                          onChange={(e) => setMongoUri(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDataSources}>
              Refresh Sources
            </Button>
            <Button variant="outline" onClick={loadActiveStatus}>
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

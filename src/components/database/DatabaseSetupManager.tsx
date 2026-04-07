'use client';

/**
 * DatabaseSetupManager - Unified Database Connection UI
 * 
 * This component consolidates functionality from:
 * - DatabaseSetup
 * - DatabaseSetupWelcome
 * - DatabaseSettings
 * 
 * It provides a consistent UI for:
 * 1. Initial database setup (welcome flow)
 * 2. Handling connection errors (error recovery)
 * 3. Configuring data sources (settings page)
 * 
 * It integrates seamlessly with Clara's Switchboard Architecture.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Cloud, 
  HardDrive, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  Sparkles,
  Clock,
  Server,
  WifiOff,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { error } from 'console';

interface DatabaseSetupManagerProps {
  mode?: 'setup' | 'error' | 'settings';
  onConnectionSuccess?: () => void;
  isRetrying?: boolean;
}

export default function DatabaseSetupManager({ 
  mode = 'setup', 
  onConnectionSuccess, 
  isRetrying = false 
}: DatabaseSetupManagerProps) {
  // Initialize router for navigation
  const router = useRouter();
  
  // State management
  const [activeTab, setActiveTab] = useState('remote');
  const [mongoUri, setMongoUri] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [activeStatus, setActiveStatus] = useState<any>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  
  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

  /**
   * Load initial data on component mount
   */
  useEffect(() => {
    const init = async () => {
      // Don't auto-navigate in settings mode
      if (mode === 'settings') {
        await checkExistingConnection();
        return;
      }
      
      try {
        // Check for existing connection
        const isConnected = await checkExistingConnection();
        
        // If already connected and not in error or settings mode, redirect to dashboard
        if (isConnected && mode !== 'error' && isElectron) {
          console.log('✅ [DB-SETUP] Already connected, navigating to dashboard...');
          // Call the onConnectionSuccess callback if provided
          if (onConnectionSuccess) {
            console.log('🔄 [DB-SETUP] Calling onConnectionSuccess callback');
            onConnectionSuccess();
          }
          
          // Longer delay to ensure all settings are properly loaded
          setTimeout(() => {
            console.log('🔄 [DB-SETUP] Auto-navigating to dashboard due to existing connection...');
            window.location.href = '/dashboard';
          }, 1000);
        }
      } catch (error) {
        console.error('❌ [DB-SETUP] Error in initialization:', error);
      }
    };
    
    init();
    
    // Load data sources and status
    if (isElectron) {
      loadDataSources();
      loadActiveStatus();
      
      // Set up listener for connection status changes
      try {
        const removeListener = (window as any).electronAPI.dataSource.onStatusUpdate(() => {
          console.log('🔔 [DB-SETUP] Connection status changed, refreshing...');
          loadDataSources();
          loadActiveStatus();
        });
        
        // Clean up listener on component unmount
        return () => {
          if (removeListener) removeListener();
        };
      } catch (error) {
        console.error('❌ [DB-SETUP] Failed to set up status listener:', error);
      }
    }
  }, [isElectron, mode, onConnectionSuccess]);

  /**
   * Check for existing connections
   * @returns {Promise<boolean>} True if connected, false otherwise
   */
  const checkExistingConnection = async (): Promise<boolean> => {
    try {
      if (!isElectron) return false;

      console.log('🎯 [DB-SETUP] Checking existing connections via Switchboard...');
      const status = await (window as any).electronAPI.dataSource.getActiveStatus();
      
      if (status && status.sourceId === 'mongodb-atlas' && status.status === 'connected') {
        console.log('✅ [DB-SETUP] Found existing Atlas connection');
        const connectionInfo = await (window as any).electronAPI.dataSource.getConnectionInfo(status.sourceId);
        if (connectionInfo && connectionInfo.uri) {
          const maskedUri = connectionInfo.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
          setMongoUri(maskedUri);
          setConnectionStatus('success');
          setConnectionInfo(connectionInfo);
          
          // Ensure the URI is also saved in user settings for consistency
          try {
            const actualUri = connectionInfo.uri;
            await (window as any).electronAPI.database.saveUserMongoUri(actualUri);
            console.log('✅ [DB-SETUP] Updated MongoDB URI in settings');
          } catch (saveError) {
            console.error('❌ [DB-SETUP] Error saving URI to settings:', saveError);
          }
        }
        return true;
      } else {
        // Try to load saved URI from both possible locations
        try {
          const savedUri = await (window as any).electronAPI.database.getUserMongoUri();
          if (savedUri) {
            setMongoUri(savedUri);
            console.log('📄 [DB-SETUP] Loaded saved MongoDB URI');
            
            // If we have a saved URI but no active connection, try to auto-connect
            if (mode !== 'settings') {
              console.log('🔌 [DB-SETUP] Attempting to auto-connect with saved URI...');
              // Don't await this to avoid blocking the UI
              (window as any).electronAPI.dataSource.connect('mongodb-atlas', { 
                uri: savedUri,
                purpose: 'user-data'
              }).catch((err: unknown) => {
                console.warn('⚠️ [DB-SETUP] Auto-connect failed:', err);
                // Don't show error to user, they can connect manually
              });
            }
          } else {
            console.log('ℹ️ [DB-SETUP] No existing MongoDB URI found');
          }
        } catch (error) {
          console.warn('⚠️ [DB-SETUP] Error loading saved URI:', error);
        }
        return false;
      }
    } catch (error) {
      console.log('ℹ️ [DB-SETUP] Error checking existing connection:', error);
      return false;
    }
  };

  /**
   * Load available data sources from Switchboard
   */
  const loadDataSources = async () => {
    if (!isElectron) return;
    
    try {
      const sources = await (window as any).electronAPI.dataSource.getAvailable();
      setDataSources(sources);
      console.log('🎯 [DB-SETUP] Loaded data sources:', sources);
    } catch (error) {
      console.error('❌ [DB-SETUP] Failed to load data sources:', error);
      setErrorMessage('Failed to load available data sources');
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
      
      if (status && status.sourceId) {
        const info = await (window as any).electronAPI.dataSource.getConnectionInfo(status.sourceId);
        setConnectionInfo(info);
      }
      
      console.log('🎯 [DB-SETUP] Active status:', status);
    } catch (error) {
      console.error('❌ [DB-SETUP] Failed to load active status:', error);
    }
  };

  /**
   * Connect to a data source
   */
  const connectToSource = async (sourceId: string, config: Record<string, any> = {}) => {
    if (!isElectron) return;
    
    setIsConnecting(sourceId);
    setConnectionStatus('testing');
    setErrorMessage('');
    
    try {
      console.log(`🔌 [DB-SETUP] Connecting to ${sourceId}...`);
      await (window as any).electronAPI.dataSource.connect(sourceId, config);
      
      // Refresh status
      await loadActiveStatus();
      await loadDataSources();
      
      setConnectionStatus('success');
      console.log(`✅ [DB-SETUP] Successfully connected to ${sourceId}`);
      
      // For MongoDB Atlas connections, save the URI to settings so it persists on reload
      if (sourceId === 'mongodb-atlas' && config.uri) {
        try {
          await (window as any).electronAPI.database.saveUserMongoUri(config.uri);
          console.log('✅ [DB-SETUP] Saved MongoDB URI to settings');
        } catch (saveError) {
          console.error('❌ [DB-SETUP] Failed to save MongoDB URI:', saveError);
        }
      }
      
      // Add a longer delay before navigation to ensure settings are saved
      console.log('🔄 [DB-SETUP] Will navigate to dashboard after successful connection...');
      
      // Set a flag in sessionStorage to prevent redirect loops
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dbSetupComplete', 'true');
      }
      
      setTimeout(() => {
        // Call onConnectionSuccess if provided (handles navigation in parent component)
        if (onConnectionSuccess) {
          console.log('🔄 [DB-SETUP] Calling onConnectionSuccess callback');
          onConnectionSuccess();
          return; // Let parent handle navigation
        }
        
        // If no callback provided, handle navigation directly
        console.log('🔄 [DB-SETUP] Navigating to dashboard now');
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error: any) {
      console.error(`❌ [DB-SETUP] Failed to connect to ${sourceId}:`, error);
      setConnectionStatus('error');
      setErrorMessage(`Failed to connect to ${sourceId}: ${error.message}`);
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
    setErrorMessage('');
    
    try {
      await (window as any).electronAPI.dataSource.disconnect();
      
      // Refresh status
      await loadActiveStatus();
      await loadDataSources();
      
      console.log('✅ [DB-SETUP] Disconnected successfully');
    } catch (error: any) {
      console.error('❌ [DB-SETUP] Failed to disconnect:', error);
      setErrorMessage(`Failed to disconnect: ${error.message}`);
    } finally {
      setIsConnecting(null);
    }
  };

  /**
   * Quick connect to MongoDB Memory Server
   */
  const quickConnect = () => {
    connectToSource('mongodb-memory', { autoStart: true });
  };

  /**
   * Test MongoDB Atlas connection with URI
   */
  const testAtlasConnection = () => {
    if (!mongoUri) {
      setErrorMessage('Please enter a MongoDB URI');
      return;
    }
    
    connectToSource('mongodb-atlas', { uri: mongoUri });
  };

  /**
   * Navigate directly to dashboard
   */
  const navigateToDashboard = () => {
    console.log('🧭 [DB-SETUP] Navigating directly to dashboard...');
    
    // Make sure we have a connection before navigating
    if (connectionStatus !== 'success') {
      console.warn('⚠️ [DB-SETUP] Attempted to navigate without successful connection');
      return;
    }
    
    // Set a flag in sessionStorage to prevent redirect loops
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dbSetupComplete', 'true');
    }
    
    // Call success callback if provided
    if (onConnectionSuccess) {
      console.log('🔄 [DB-SETUP] Calling onConnectionSuccess callback');
      onConnectionSuccess();
      return; // Let parent handle navigation
    }
    
    // Force navigation using window.location for a full page reload
    console.log('🔄 [DB-SETUP] Navigating to dashboard via window.location...');
    window.location.href = '/dashboard';
  };

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

  // Error handling helpers
  const handleRetry = () => {
    setConnectionStatus('idle');
    setErrorMessage('');
  };

  // Render according to mode
  if (mode === 'settings') {
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
            {activeStatus && activeStatus.sourceId && (
              <div className="bg-blue-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Active Connection
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(activeStatus.status || 'disconnected')}
                    <span className="font-medium">{activeStatus.sourceId}</span>
                    <Badge variant={activeStatus.status === 'connected' ? 'success' : 'outline'} className="ml-2">
                      {(activeStatus.status || 'disconnected').toUpperCase()}
                    </Badge>
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
                    {connectionInfo.uri && <div>URI: {connectionInfo.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}</div>}
                    {connectionInfo.collections && (
                      <div>Collections: {connectionInfo.collections.length}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
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
                              <Badge variant={source.status === 'connected' ? 'success' : 'outline'} className="ml-2">
                                {source.status.toUpperCase()}
                              </Badge>
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
                                    setErrorMessage('Please enter a MongoDB URI for Atlas connection');
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
                        <div className="mt-3 pt-3 border-t">
                          <Label htmlFor="mongoUri" className="text-sm">MongoDB Atlas URI</Label>
                          <div className="flex mt-1">
                            <Input
                              id="mongoUri"
                              type={showPassword ? "text" : "password"}
                              placeholder="mongodb+srv://user:pass@cluster.mongodb.net/database"
                              value={mongoUri}
                              onChange={(e) => setMongoUri(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              type="button"
                              variant="outline"
                              size="icon"
                              className="ml-2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
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

  // Welcome or Error mode (similar UI, different context)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
            <Database className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-slate-900">
              {mode === 'error' ? 'Database Connection Required' : 'Welcome to HealthTrack AI'}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {mode === 'error' 
                ? 'We couldn\'t connect to your database. Please set up a connection to continue.'
                : 'Let\'s get you connected to your database so you can start managing patient data securely and efficiently'}
            </p>
          </div>
        </div>
        
        {/* Connection Options */}
        <div className="grid gap-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="local" className="text-base py-3">
                <HardDrive className="h-4 w-4 mr-2" />
                Quick Start
              </TabsTrigger>
              <TabsTrigger value="remote" className="text-base py-3">
                <Cloud className="h-4 w-4 mr-2" />
                MongoDB Atlas
              </TabsTrigger>
            </TabsList>
            
            {/* Local MongoDB Option */}
            <TabsContent value="local">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <HardDrive className="h-6 w-6 mr-2 text-blue-600" />
                    Quick Start Database
                  </CardTitle>
                  <CardDescription className="text-base">
                    Start with an in-memory database that's ready to use immediately.
                    Perfect for testing the application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                        Benefits of In-Memory Database
                      </h3>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-start">
                          <Zap className="h-4 w-4 mr-2 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>Instant setup with no configuration needed</span>
                        </li>
                        <li className="flex items-start">
                          <Shield className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>All data stays on your local machine</span>
                        </li>
                        <li className="flex items-start">
                          <Clock className="h-4 w-4 mr-2 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Data persists between application restarts</span>
                        </li>
                      </ul>
                    </div>
                    
                    <Button 
                      className="w-full py-6 text-lg" 
                      onClick={quickConnect}
                      disabled={isConnecting === 'mongodb-memory'}
                    >
                      {isConnecting === 'mongodb-memory' ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Setting Up Database...
                        </>
                      ) : (
                        <>Quick Start</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Remote MongoDB Option */}
            <TabsContent value="remote">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Cloud className="h-6 w-6 mr-2 text-green-600" />
                    MongoDB Atlas Connection
                  </CardTitle>
                  <CardDescription className="text-base">
                    Connect to your MongoDB Atlas database for production use.
                    Requires an existing MongoDB Atlas account and connection string.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {connectionStatus === 'error' ? (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  ) : connectionStatus === 'success' ? (
                    <Alert className="bg-green-50 border-green-200 mb-6">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Successfully connected to MongoDB Atlas!
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  
                  {connectionStatus !== 'success' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mongoUri" className="text-md">MongoDB Connection String</Label>
                        <div className="flex">
                          <Input
                            id="mongoUri"
                            type={showPassword ? "text" : "password"}
                            placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                            className="flex-1"
                            value={mongoUri}
                            onChange={(e) => setMongoUri(e.target.value)}
                          />
                          <Button 
                            type="button"
                            variant="outline"
                            size="icon"
                            className="ml-2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Your connection string from MongoDB Atlas dashboard
                        </p>
                      </div>
                      
                      <Button 
                        className="w-full py-6 text-lg"
                        onClick={testAtlasConnection}
                        disabled={connectionStatus === 'testing' || !mongoUri.trim()}
                      >
                        {connectionStatus === 'testing' ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Testing Connection...
                          </>
                        ) : (
                          <>Connect to Atlas</>
                        )}
                      </Button>
                      
                      <div className="text-center">
                        <a 
                          href="https://www.mongodb.com/cloud/atlas/register"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          Don't have a MongoDB Atlas account?
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {connectionStatus === 'success' && (
                    <div className="text-center">
                      <Button 
                        onClick={navigateToDashboard}
                        size="lg"
                        className="mt-4"
                      >
                        Continue to Dashboard
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Help Text */}
        <div className="text-center text-sm text-slate-500">
          Need help with database setup? Check our 
          <a href="https://healthtrack.ai/docs" className="text-blue-600 hover:text-blue-800 mx-1">
            documentation
          </a>
          or contact support.
        </div>
      </div>
    </div>
  );
}

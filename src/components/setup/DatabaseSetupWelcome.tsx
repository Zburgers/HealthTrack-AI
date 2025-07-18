'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Wifi, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  Sparkles,
  Clock,
  Server,
  Cloud,
  HardDrive
} from 'lucide-react';

interface DatabaseSetupWelcomeProps {
  onRetryConnection: () => void;
  isRetrying?: boolean;
}

export default function DatabaseSetupWelcome({ onRetryConnection, isRetrying = false }: DatabaseSetupWelcomeProps) {
  // 🎯 Switchboard Integration State
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [activeStatus, setActiveStatus] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [mongoUri, setMongoUri] = useState('');
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  /**
   * Load available data sources from Switchboard
   */
  const loadDataSources = async () => {
    if (!isElectron) return;
    
    try {
      const sources = await window.electronAPI.dataSource.getAvailable();
      setDataSources(sources);
      
      const status = await window.electronAPI.dataSource.getActiveStatus();
      setActiveStatus(status);
      
      console.log('🎯 [ONBOARDING] Loaded data sources:', sources);
      console.log('🎯 [ONBOARDING] Active status:', status);
    } catch (error) {
      console.error('❌ [ONBOARDING] Failed to load data sources:', error);
      setConnectionError('Failed to load database options');
    }
  };

  /**
   * Connect to a data source via Switchboard
   */
  const connectToDataSource = async (sourceId: string, config: Record<string, any> = {}) => {
    if (!isElectron) return;
    
    setIsConnecting(sourceId);
    setConnectionError(null);
    
    try {
      console.log(`🔌 [ONBOARDING] Connecting to ${sourceId}...`);
      await window.electronAPI.dataSource.connect(sourceId, config);
      
      // Refresh status
      await loadDataSources();
      
      console.log(`✅ [ONBOARDING] Successfully connected to ${sourceId}`);
      
      // Call the original retry callback to update parent component
      onRetryConnection();
      
    } catch (error: any) {
      console.error(`❌ [ONBOARDING] Failed to connect to ${sourceId}:`, error);
      setConnectionError(`Failed to connect: ${error.message}`);
    } finally {
      setIsConnecting(null);
    }
  };

  /**
   * Auto-connect to Memory Server (simplest option)
   */
  const quickConnect = () => {
    connectToDataSource('mongodb-memory', { autoStart: true });
  };

  /**
   * Connect to Atlas with provided URI
   */
  const connectToAtlas = () => {
    if (!mongoUri.trim()) {
      setConnectionError('Please enter a MongoDB Atlas URI');
      return;
    }
    connectToDataSource('mongodb-atlas', { uri: mongoUri, purpose: 'user-data' });
  };

  /**
   * Check if case embeddings database is connected
   */
  const isCaseEmbeddingsConnected = () => {
    return dataSources.some(source => 
      source.id === 'mongodb-atlas' && 
      source.status === 'connected' && 
      source.config?.purpose === 'case-embeddings'
    );
  };

  /**
   * Check if user database is connected
   */
  const isUserDatabaseConnected = () => {
    return dataSources.some(source => 
      source.status === 'connected' && 
      source.config?.purpose !== 'case-embeddings'
    );
  };

  // Load data sources on component mount
  useEffect(() => {
    if (isElectron) {
      loadDataSources();
      
      // Set up status update listener
      const removeListener = window.electronAPI.dataSource.onStatusUpdate((event: any) => {
        console.log('🎯 [ONBOARDING] Status update:', event);
        loadDataSources(); // Refresh on any status change
      });
      
      return removeListener;
    }
  }, [isElectron]);

  // If user database connected but show both database status
  const userDbConnected = isUserDatabaseConnected();
  const caseEmbeddingsConnected = isCaseEmbeddingsConnected();
  
  if (userDbConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">Database Connected!</h1>
              <p className="text-slate-600 max-w-md mx-auto">
                HealthTrack AI is ready to use. Your data is secure and accessible.
              </p>
            </div>
          </div>
          
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              {/* Database Status Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 text-center">Database Status</h3>
                
                {/* User Database Status */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Patient Database</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                
                {/* Case Embeddings Status */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  caseEmbeddingsConnected 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <Sparkles className={`h-5 w-5 ${
                      caseEmbeddingsConnected ? 'text-green-600' : 'text-amber-600'
                    }`} />
                    <span className={`font-medium ${
                      caseEmbeddingsConnected ? 'text-green-900' : 'text-amber-900'
                    }`}>
                      AI Case Analysis
                    </span>
                  </div>
                  <Badge className={
                    caseEmbeddingsConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }>
                    {caseEmbeddingsConnected ? 'Connected' : 'Optional'}
                  </Badge>
                </div>
              </div>
              
              <div className="text-center pt-2">
                <Button onClick={() => window.location.reload()} className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue to Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Database className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Welcome to HealthTrack AI</h1>
            <p className="text-slate-600 max-w-md mx-auto">
              Setting up your secure, local database for fast and private patient management
            </p>
          </div>
        </div>

        {/* Main Setup Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Secure Local</span>
              </div>
            </div>
            <CardTitle className="text-xl text-slate-900">Database Initialization</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            
            {/* Database Status Overview */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Database Status</h3>
              
              {/* Case Embeddings Status */}
              <div className={`p-4 rounded-xl border ${
                caseEmbeddingsConnected 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <Sparkles className={`h-5 w-5 ${
                    caseEmbeddingsConnected ? 'text-green-600' : 'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">AI Case Analysis Database</h4>
                    <p className="text-sm text-slate-600">Vector search for similar patient cases</p>
                  </div>
                  <Badge className={
                    caseEmbeddingsConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }>
                    {caseEmbeddingsConnected ? 'Connected' : 'Auto-Setup'}
                  </Badge>
                </div>
                {!caseEmbeddingsConnected && (
                  <p className="text-xs text-blue-700">
                    Will auto-connect when environment variable MONGODB_URI is configured
                  </p>
                )}
              </div>
              
              {/* User Database Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">Patient Data Storage</h4>
                    <p className="text-sm text-slate-600">Choose how to store your patient records</p>
                  </div>
                </div>
                
                {/* Quick Setup Options */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button 
                    onClick={quickConnect}
                    disabled={isConnecting === 'mongodb-memory'}
                    className="h-auto p-4 bg-white border-2 border-blue-200 text-blue-900 hover:bg-blue-50 hover:border-blue-300"
                    variant="outline"
                  >
                    {isConnecting === 'mongodb-memory' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <HardDrive className="h-4 w-4 mr-2" />
                    )}
                    <div className="text-left">
                      <div className="font-medium">Local Storage</div>
                      <div className="text-xs">Fastest setup</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="h-auto p-4 bg-white border-2 border-blue-200 text-blue-900 hover:bg-blue-50 hover:border-blue-300"
                    variant="outline"
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Cloud Database</div>
                      <div className="text-xs">MongoDB Atlas</div>
                    </div>
                  </Button>
                </div>
                
                {/* Advanced Setup */}
                {showAdvanced && (
                  <div className="space-y-3 pt-4 border-t border-blue-200">
                    <Label htmlFor="mongoUri" className="text-sm font-medium text-slate-900">
                      MongoDB Atlas Connection String
                    </Label>
                    <Input
                      id="mongoUri"
                      type="password"
                      placeholder="mongodb+srv://username:password@cluster.mongodb.net/"
                      value={mongoUri}
                      onChange={(e) => setMongoUri(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <Button 
                      onClick={connectToAtlas}
                      disabled={isConnecting === 'mongodb-atlas'}
                      className="w-full"
                    >
                      {isConnecting === 'mongodb-atlas' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wifi className="h-4 w-4 mr-2" />
                          Connect to Atlas
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Error Display */}
            {connectionError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {connectionError}
                </AlertDescription>
              </Alert>
            )}

            {/* Legacy Retry Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="font-medium text-amber-900 mb-1">Need to retry connection?</h3>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      If you're experiencing connection issues, you can retry the legacy initialization process.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={onRetryConnection}
                      disabled={isRetrying}
                      variant="outline"
                      className="border-amber-300 text-amber-800 hover:bg-amber-100 px-4 py-2 h-auto"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Legacy Retry
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 h-auto"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Features Ready */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-slate-900">Ready When You Are</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: CheckCircle, text: 'AI Analysis', color: 'text-green-600' },
                  { icon: CheckCircle, text: 'Secure Storage', color: 'text-green-600' },
                  { icon: CheckCircle, text: 'Real-time Dashboard', color: 'text-green-600' },
                  { icon: CheckCircle, text: 'Patient Records', color: 'text-green-600' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <feature.icon className={`h-4 w-4 ${feature.color}`} />
                    <span className="text-sm font-medium text-slate-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-500">
            HealthTrack AI • Secure • Private • Intelligent
          </p>
        </div>
      </div>
    </div>
  );
}

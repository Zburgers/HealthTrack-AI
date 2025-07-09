'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  Mail,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Lock
} from 'lucide-react';

interface DatabaseSetupProps {
  onConnectionSuccess: () => void;
}

export default function DatabaseSetup({ onConnectionSuccess }: DatabaseSetupProps) {
  const [activeTab, setActiveTab] = useState('remote');
  const [mongoUri, setMongoUri] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);

  // Check if there's an existing connection on load
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      if (!isElectron) return;

      // Check if we have a saved URI
      const savedUri = await (window as any).electronAPI.database.getUserMongoUri();
      if (savedUri) {
        setMongoUri(savedUri);
        // Test the connection
        await testConnection(savedUri, false);
      }
    } catch (error) {
      console.log('No existing connection found');
    }
  };

  const testConnection = async (uri?: string, showLoader = true) => {
    const testUri = uri || mongoUri;
    if (!testUri.trim()) return;

    if (showLoader) {
      setIsConnecting(true);
      setConnectionStatus('testing');
    }
    setErrorMessage('');

    try {
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      if (!isElectron) {
        throw new Error('This feature is only available in the desktop app');
      }

      // Save and test the URI
      await (window as any).electronAPI.database.setUserMongoUri(testUri);
      
      // Test the connection
      const health = await (window as any).electronAPI.database.health();
      
      if (health.status === 'ok') {
        setConnectionStatus('success');
        setConnectionDetails(health);
        
        // Small delay to show success, then proceed
        setTimeout(() => {
          onConnectionSuccess();
        }, 1500);
      } else {
        throw new Error(health.error || 'Connection failed');
      }
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Failed to connect to database');
    } finally {
      if (showLoader) {
        setIsConnecting(false);
      }
    }
  };

  const handleConnect = () => {
    testConnection();
  };

  const handleRetry = () => {
    setConnectionStatus('idle');
    setErrorMessage('');
  };

  const copyErrorToClipboard = async () => {
    const errorReport = `
HealthTrack AI Database Connection Error

Error: ${errorMessage}
MongoDB URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}
Timestamp: ${new Date().toISOString()}
Platform: ${navigator.platform}
User Agent: ${navigator.userAgent}

Please review the connection string and ensure:
1. The MongoDB cluster is accessible
2. The IP address is whitelisted
3. The credentials are correct
4. The database name exists
    `.trim();

    await navigator.clipboard.writeText(errorReport);
  };

  const openMailClient = () => {
    const subject = encodeURIComponent('HealthTrack AI - Database Connection Issue');
    const body = encodeURIComponent(`
Hi HealthTrack Support,

I'm experiencing issues connecting to my MongoDB database. Here are the details:

Error: ${errorMessage}
MongoDB URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}
Timestamp: ${new Date().toISOString()}

Could you please help me resolve this issue? I suspect it might be an IP whitelisting issue.

Thanks!
    `.trim());

    window.open(`mailto:support@healthtrack.ai?subject=${subject}&body=${body}`);
  };

  const maskUri = (uri: string) => {
    return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Database className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Database Setup</h1>
            <p className="text-slate-600 max-w-md mx-auto">
              Connect your MongoDB database to start managing patient data securely
            </p>
          </div>
        </div>

        {/* Main Setup Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-slate-900 text-center">Choose Your Database</CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="remote" className="flex items-center space-x-2">
                  <Cloud className="h-4 w-4" />
                  <span>Remote (MongoDB)</span>
                </TabsTrigger>
                <TabsTrigger value="local" className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span>Local Storage</span>
                </TabsTrigger>
              </TabsList>

              {/* Remote Database Tab */}
              <TabsContent value="remote" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Cloud Database</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">High Performance</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="mongoUri" className="text-sm font-medium text-slate-700">
                      MongoDB Connection String
                    </Label>
                    <div className="relative">
                      <Input
                        id="mongoUri"
                        type={showPassword ? 'text' : 'password'}
                        value={mongoUri}
                        onChange={(e) => setMongoUri(e.target.value)}
                        placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                        className="pr-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isConnecting || connectionStatus === 'success'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Get this from your MongoDB Atlas dashboard or your database administrator
                    </p>
                  </div>

                  {/* Connection Status */}
                  {connectionStatus === 'testing' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        <div>
                          <h3 className="font-medium text-blue-900">Testing Connection</h3>
                          <p className="text-sm text-blue-700">Verifying your database credentials...</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {connectionStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-medium text-green-900">Connection Successful!</h3>
                          <p className="text-sm text-green-700">Your database is connected and ready</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {connectionStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-medium text-red-900">Connection Failed</h3>
                          <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                          
                          {errorMessage.includes('IP') || errorMessage.includes('network') || errorMessage.includes('timeout') ? (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-800">
                                <strong>Possible IP Whitelisting Issue:</strong> Your IP address might not be authorized to access the database.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Button 
                          onClick={handleRetry}
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                        <Button 
                          onClick={copyErrorToClipboard}
                          variant="outline" 
                          size="sm"
                          className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Error
                        </Button>
                        <Button 
                          onClick={openMailClient}
                          variant="outline" 
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Contact Admin
                        </Button>
                      </div>
                    </div>
                  )}

                  {connectionStatus === 'idle' && (
                    <Button 
                      onClick={handleConnect}
                      disabled={!mongoUri.trim() || isConnecting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing Connection...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4 mr-2" />
                          Connect to Database
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* Local Storage Tab */}
              <TabsContent value="local" className="space-y-6">
                <div className="text-center space-y-6 py-8">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center">
                    <HardDrive className="h-10 w-10 text-slate-500" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-slate-900">Local Storage</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Store your data locally on your device for maximum privacy and offline access.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Coming Soon</span>
                    </div>
                    <p className="text-sm text-purple-700 mb-4">
                      We're working on local storage capabilities that will give you complete control over your data.
                    </p>
                    <div className="space-y-2 text-xs text-purple-600">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3" />
                        <span>Offline-first architecture</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3" />
                        <span>Zero network dependencies</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3" />
                        <span>Enhanced privacy & security</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setActiveTab('remote')}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    Use Remote Database Instead
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
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

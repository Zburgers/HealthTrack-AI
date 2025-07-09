'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Server
} from 'lucide-react';

interface DatabaseSetupWelcomeProps {
  onRetryConnection: () => void;
  isRetrying?: boolean;
}

export default function DatabaseSetupWelcome({ onRetryConnection, isRetrying = false }: DatabaseSetupWelcomeProps) {
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
            
            {/* Current Status */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  {isRetrying ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Server className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {isRetrying ? 'Connecting to Database...' : 'Database Starting'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {isRetrying ? 'Attempting to establish connection' : 'Initializing secure local storage'}
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Issue Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="font-medium text-amber-900 mb-1">Taking a bit longer than usual</h3>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      The database is initializing. This can take 10-30 seconds on first launch or when your system is under load.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={onRetryConnection}
                      disabled={isRetrying}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-auto"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
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

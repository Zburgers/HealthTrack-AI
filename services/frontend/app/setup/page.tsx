'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import DatabaseSetupManager from '@/components/database/DatabaseSetupManager';

/**
 * Dedicated Database Setup Page
 * 
 * This page is responsible for handling the initial database setup flow.
 * Users are redirected here when:
 * 1. No database credentials are found
 * 2. The existing credentials are invalid
 * 
 * After successful setup, users are redirected to the dashboard.
 */
export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasExistingConnection, setHasExistingConnection] = useState(false);
  
  // Check if database is already configured on mount
  useEffect(() => {
    const checkConnection = async () => {
      setLoading(true);
      
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      if (!isElectron) {
        // For web version, assume API is available and redirect to dashboard
        setLoading(false);
        router.push('/dashboard');
        return;
      }
      
      try {
        // Check if URI exists in settings
        const uri = await (window as any).electronAPI.database.getUserMongoUri();
        if (uri) {
          console.log('📝 [SETUP] Found existing MongoDB URI, checking connection...');
          
          // Check if there's an active connection
          try {
            const status = await (window as any).electronAPI.dataSource.getActiveStatus();
            
            if (status && status.sourceId === 'mongodb-atlas' && status.status === 'connected') {
              console.log('✅ [SETUP] Active connection exists, redirecting to dashboard...');
              setHasExistingConnection(true);
              
              // Short delay to avoid flickering
              setTimeout(() => {
                router.push('/dashboard');
              }, 500);
              return;
            } else {
              // Has URI but not connected, try to connect
              console.log('🔄 [SETUP] Has URI but no active connection, attempting to connect...');
              try {
                await (window as any).electronAPI.dataSource.connect('mongodb-atlas', {
                  uri: uri,
                  purpose: 'user-data'
                });
                
                // Check if connection was successful
                const updatedStatus = await (window as any).electronAPI.dataSource.getActiveStatus();
                if (updatedStatus && updatedStatus.sourceId === 'mongodb-atlas' && updatedStatus.status === 'connected') {
                  console.log('✅ [SETUP] Auto-connection successful, redirecting to dashboard...');
                  setHasExistingConnection(true);
                  
                  setTimeout(() => {
                    router.push('/dashboard');
                  }, 500);
                  return;
                }
              } catch (connectError) {
                console.error('❌ [SETUP] Auto-connection failed:', connectError);
                // Continue to setup page
              }
            }
          } catch (statusError) {
            console.error('❌ [SETUP] Failed to check connection status:', statusError);
            // Continue to setup page
          }
        }
        
        // If we reach here, either no URI or failed to connect
        console.log('📝 [SETUP] No valid connection, showing setup page...');
        setLoading(false);
      } catch (error) {
        console.error('❌ [SETUP] Error checking database configuration:', error);
        setLoading(false);
      }
    };
    
    checkConnection();
  }, [router]);

  // Handle successful connection
  const handleConnectionSuccess = () => {
    console.log('✅ [SETUP] Database connected successfully, redirecting to dashboard...');
    
    // Navigate to dashboard after successful connection
    router.push('/dashboard');
  };
  
  if (loading || hasExistingConnection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="bg-primary/10 p-6 rounded-full mx-auto w-24 h-24 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {hasExistingConnection ? 'Database Connected' : 'Checking Database Status'}
            </h1>
            <p className="text-muted-foreground">
              {hasExistingConnection ? 'Redirecting to dashboard...' : 'Validating your database configuration...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DatabaseSetupManager 
      mode="setup" 
      onConnectionSuccess={handleConnectionSuccess} 
    />
  );
}

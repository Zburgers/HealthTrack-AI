'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  Trash2,
  HardDrive,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DataManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

  /**
   * Export database - now with real implementation
   */
  const exportDatabase = async () => {
    if (!isElectron) return;

    setIsExporting(true);

    try {
      console.log('📦 [DATA_MANAGEMENT] Starting database export...');

      // Get all collections data
      const [patients, encounters, observations, practitioners, medications, appointments, soapNotes, tasks] = await Promise.all([
        (window as any).electronAPI.database.find('patients', {}),
        (window as any).electronAPI.database.find('encounters', {}),
        (window as any).electronAPI.database.find('observations', {}),
        (window as any).electronAPI.database.find('practitioners', {}),
        (window as any).electronAPI.database.find('medications', {}),
        (window as any).electronAPI.database.find('appointments', {}),
        (window as any).electronAPI.database.find('soapNotes', {}),
        (window as any).electronAPI.database.find('tasks', {}),
      ]);

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          source: 'HealthTrack AI',
          totalRecords: patients.length + encounters.length + observations.length + practitioners.length + medications.length + appointments.length + soapNotes.length + tasks.length
        },
        collections: {
          patients,
          encounters,
          observations,
          practitioners,
          medications,
          appointments,
          soapNotes,
          tasks
        }
      };

      // Create downloadable file
      const exportJson = JSON.stringify(exportData, null, 2);
      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `healthtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ [DATA_MANAGEMENT] Database export completed successfully');
      
      toast({
        title: "Export Successful",
        description: `Database exported with ${exportData.metadata.totalRecords} records`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('❌ [DATA_MANAGEMENT] Export failed:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export database: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Clear local cache - now with real implementation
   */
  const clearCache = async () => {
    if (!isElectron) return;
    
    setIsClearing(true);
    
    try {
      console.log('🧹 [DATA_MANAGEMENT] Clearing local cache...');
      
      // Get cache info first
      const cacheQuery = await (window as any).electronAPI.database.find('ai_cache', {});
      const cacheCount = cacheQuery.length;
      
      // Clear AI cache collection
      await (window as any).electronAPI.database.deleteMany('ai_cache', {});
      
      console.log(`✅ [DATA_MANAGEMENT] Cleared ${cacheCount} cache entries`);
      
      toast({
        title: "Cache Cleared",
        description: `Successfully cleared ${cacheCount} cached items`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('❌ [DATA_MANAGEMENT] Cache clearing failed:', error);
      toast({
        title: "Clear Failed",
        description: `Failed to clear cache: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Data Management
        </CardTitle>
        <CardDescription>
          Export data, manage local storage, and perform maintenance operations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!isElectron ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Data management tools are only available in the Electron desktop application.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Export Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Data Export</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={exportDatabase}
                  disabled={isExporting}
                  className="flex-1"
                >
                  {isExporting ? (
                    <>
                      <Download className="mr-2 h-4 w-4 animate-pulse" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Database
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  disabled
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data (Coming Soon)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Export your database to a backup file or import data from external sources.
              </p>
            </div>

            {/* Maintenance Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Maintenance</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={clearCache}
                  disabled={isClearing}
                  className="flex-1"
                >
                  {isClearing ? (
                    <>
                      <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Local Cache
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  disabled
                  className="flex-1"
                >
                  <HardDrive className="mr-2 h-4 w-4" />
                  Optimize Database (Coming Soon)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Clear temporary files and optimize database performance.
              </p>
            </div>

            {/* Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Always backup your data before performing maintenance operations. 
                Some operations cannot be undone.
              </AlertDescription>
            </Alert>

            {/* Future Features */}
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
              <strong>Coming Soon:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Database backup and restore</li>
                <li>Data import from CSV/JSON files</li>
                <li>Database optimization tools</li>
                <li>Storage usage analytics</li>
                <li>Automated backup scheduling</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DataManagementPanel;

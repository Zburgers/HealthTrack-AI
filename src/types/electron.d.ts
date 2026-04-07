/**
 * Global TypeScript declarations for Clara's Switchboard Architecture
 * 
 * This extends the Window interface to include our new Switchboard API
 * exposed through the Electron preload script.
 */

export {};

declare global {
  interface Window {
    electronAPI: {
      // 🎯 Clara's Switchboard Architecture - Unified Data Access
      dataSource: {
        // Central query method - all data operations flow through here
        query: (query: { type: string; params: Record<string, any>; rawQuery?: any }) => Promise<any>;
        
        // Data source management
        getAvailable: () => Promise<Array<{
          id: string;
          name: string;
          description?: string;
          status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'initializing_source' | 'validating_config' | 'authenticating' | 'connection_failed';
        }>>;
        connect: (sourceId: string, config: Record<string, any>) => Promise<void>;
        disconnect: () => Promise<void>;
        getActiveStatus: () => Promise<{
          sourceId: string | null;
          status: string | null;
          error: Error | null;
        }>;
        getConnectionInfo: () => Promise<{
          isConnected: boolean;
          uri?: string;
          database?: string;
          collections?: string[];
          lastConnected?: string;
          serverInfo?: any;
        } | null>;
        
        // Status update events
        onStatusUpdate: (callback: (event: any) => void) => () => void;
      };

      // Legacy database API (preserved for backward compatibility)
      database: {
        // Generic database operations
        findOne: (collection: string, query: any) => Promise<any>;
        find: (collection: string, query: any, options?: any) => Promise<any[]>;
        insertOne: (collection: string, document: any) => Promise<any>;
        updateOne: (collection: string, filter: any, update: any, options?: any) => Promise<any>;
        deleteOne: (collection: string, filter: any) => Promise<any>;
        deleteMany: (collection: string, filter: any) => Promise<any>;
        
        // Patient operations
        getPatients: (query?: any) => Promise<any[]>;
        getPatient: (idOrQuery: string | any) => Promise<any>;
        createPatient: (patient: any) => Promise<any>;
        updatePatient: (idOrQuery: string | any, update?: any) => Promise<any>;
        deletePatient: (idOrObj: string | { id: string; reason: string; deletedBy: string }) => Promise<any>;
        
        // Encounter operations
        getEncounters: (query?: any) => Promise<any[]>;
        addEncounter: (encounter: any) => Promise<any>;
        
        // Observation operations
        getObservations: (query?: any) => Promise<any[]>;
        addObservation: (observation: any) => Promise<any>;
        
        // AI Cache operations
        getAICache: (key: string) => Promise<any>;
        setAICache: (key: string, workflow: string, input: any, output: any, expiryMs?: number) => Promise<boolean>;
        
        // Database management
        getInfo: () => Promise<any>;
        exportData: () => Promise<any>;
        getStorageSettings: () => Promise<any>;
        getStats: () => Promise<any>;
        
        // Status and health checks
        ready: () => Promise<boolean>;
        checkStatus: () => Promise<any>;
        health: () => Promise<any>;
        
        // MongoDB URI management
        getUserMongoUri: () => Promise<string>;
        setUserMongoUri: (uri: string) => Promise<void>;
        testConnection: (uri: string) => Promise<{ success: boolean; error?: string }>;
      };
    };

    electronDev?: {
      openDevTools: () => Promise<void>;
      reload: () => Promise<void>;
    };
  }
}

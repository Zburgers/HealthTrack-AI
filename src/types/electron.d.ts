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
        findOne: (collection: string, query: any) => Promise<any>;
        find: (collection: string, query: any, options?: any) => Promise<any[]>;
        insertOne: (collection: string, document: any) => Promise<any>;
        updateOne: (collection: string, filter: any, update: any, options?: any) => Promise<any>;
        deleteOne: (collection: string, filter: any) => Promise<any>;
        
        getPatients: () => Promise<any[]>;
        getPatient: (id: string) => Promise<any>;
        createPatient: (patient: any) => Promise<any>;
        updatePatient: (id: string, update: any) => Promise<any>;
        deletePatient: (id: string) => Promise<any>;

        checkStatus: () => Promise<any>;
        health: () => Promise<any>;
        getUserMongoUri: () => Promise<string>;
        setUserMongoUri: (uri: string) => Promise<void>;
      };
    };

    electronDev?: {
      openDevTools: () => Promise<void>;
      reload: () => Promise<void>;
    };
  }
}

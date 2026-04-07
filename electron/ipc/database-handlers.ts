/**
 * Electron Main Process - Database IPC Handlers
 * 
 * This module registers IPC handlers for all database operations requested by the renderer process.
 * It uses the centralized local database connection from 'local-db.ts'.
 */
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { getDataSourceManager } from '../lib/DataSourceManager'; // Import the Switchboard
import { IQuery } from '../lib/datasources/IDataSource'; // Import IQuery
import {
  Patient,
  Encounter,
  Observation,
  Practitioner,
  Medication,
  MedicationRequest,
  Appointment,
  SOAPNote,
  Task,
  CodeMapping,
  Setting,
  LogEntry,
} from '../types/database'; // Import types from the new location
import { Document } from 'mongodb';

import { mapDbPatientToFrontendPatient } from '../lib/shared/data-mappers';

const executeQuery = async <T>(query: IQuery): Promise<T> => {
  const dataSourceManager = getDataSourceManager();
  return dataSourceManager.executeActiveSourceQuery<T>(query);
};

export function setupDatabaseIPCHandlers() {
  console.log('🔌 [DB-IPC] Registering database handlers with Switchboard...');

  // Health check
  ipcMain.handle('db:ready', async () => {
    const dataSourceManager = getDataSourceManager();
    const status = dataSourceManager.getActiveSourceStatus();
    return status && status.status === 'connected';
  });

  // Status check --------------------------------------------------------------
  ipcMain.handle('db:checkStatus', () => {
    const dsm = getDataSourceManager();
    return dsm.getActiveStatus();
  });

  // Generic database operations - These are used by the legacy API
  ipcMain.handle('db:findOne', async (_event: IpcMainInvokeEvent, collection: string, query: any) => {
    return executeQuery({ 
      type: `${collection}.findOne`, 
      params: { filter: query } 
    });
  });

  ipcMain.handle('db:find', async (_event: IpcMainInvokeEvent, collection: string, query: any, options: any = {}) => {
    return executeQuery({ 
      type: `${collection}.find`, 
      params: { filter: query, options } 
    });
  });

  ipcMain.handle('db:insertOne', async (_event: IpcMainInvokeEvent, collection: string, document: any) => {
    return executeQuery({ 
      type: `${collection}.insertOne`, 
      params: { document } 
    });
  });

  ipcMain.handle('db:updateOne', async (_event: IpcMainInvokeEvent, collection: string, filter: any, update: any, options: any = {}) => {
    return executeQuery({ 
      type: `${collection}.updateOne`, 
      params: { filter, update: { $set: update }, options } 
    });
  });

  ipcMain.handle('db:deleteOne', async (_event: IpcMainInvokeEvent, collection: string, filter: any) => {
    return executeQuery({ 
      type: `${collection}.deleteOne`, 
      params: { filter } 
    });
  });

  ipcMain.handle('db:deleteMany', async (_event: IpcMainInvokeEvent, collection: string, filter: any) => {
    return executeQuery({ 
      type: `${collection}.deleteMany`, 
      params: { filter } 
    });
  });

  // MongoDB specific health check and connection management
  ipcMain.handle('db:health', async () => {
    try {
      const dsm = getDataSourceManager();
      const status = dsm.getActiveStatus();
      const connectionInfo = await dsm.getActiveSourceConnectionInfo();
      
      // Fix: Properly check status object and handle null cases
      if (status && status.status === 'connected' && connectionInfo) {
        console.log('✅ [DB-IPC] MongoDB health via Switchboard: ok');
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          type: 'mongodb',
          details: 'MongoDB is responding to queries via Switchboard',
          connectionInfo: {
            uri: connectionInfo.uri || 'Not configured',
            database: connectionInfo.database || 'healthtrack',
            source: status.sourceId,
            sourceName: status.name
          }
        };
      }
      
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        type: 'mongodb',
        error: 'No active connection',
        details: 'No active database connection available'
      };
    } catch (error) {
      console.error('❌ [DB-IPC] Health check failed:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        type: 'mongodb',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to connect to MongoDB. Please check your connection string and ensure your IP is whitelisted.'
      };
    }
  });

  // Database info handler
  ipcMain.handle('db:getInfo', async () => {
    try {
      console.log('🔍 [DB-IPC] Getting database info via Switchboard...');
      
      const dsm = getDataSourceManager();
      const connectionInfo = dsm.getConnectionInfo();
      const activeSourceInfo = await dsm.getActiveSourceConnectionInfo();
      
      if (connectionInfo.length > 0) {
        try {
          const activeStatus = dsm.getActiveStatus();
          
          // Fix: Check if activeStatus exists and has required properties
          if (!activeStatus || !activeStatus.status) {
            throw new Error('No active data source available');
          }
          
          // Execute query through Switchboard for collections info
          const collectionsInfo = await dsm.executeActiveSourceQuery<any[]>({
            type: 'raw',
            params: {},
            rawQuery: async (db: any) => {
              const collections = await db.listCollections().toArray();
              const result = [];
              
              for (const collection of collections) {
                try {
                  const count = await db.collection(collection.name).estimatedDocumentCount();
                  result.push({
                    name: collection.name,
                    count: count,
                    location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
                  });
                } catch (countError) {
                  console.warn(`Failed to get count for collection ${collection.name}:`, countError);
                  result.push({
                    name: collection.name,
                    count: 0,
                    location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
                  });
                }
              }
              return result;
            }
          });
          
          return {
            type: 'remote',
            remoteHost: 'MongoDB Atlas (via Switchboard)',
            collections: collectionsInfo || [],
            totalSize: 'N/A',
            connectionInfo: {
              isConnected: activeSourceInfo?.isConnected || false,
              uri: activeSourceInfo?.uri || 'Not configured via Switchboard',
              host: `${activeStatus.name || 'MongoDB Atlas'} (${activeStatus.purpose || 'default'})`,
              database: activeSourceInfo?.database || 'healthtrack'
            },
            dataSources: connectionInfo.map(src => ({
              id: src.id,
              name: src.name,
              status: src.status,
              purpose: src.purpose,
              isActive: src.isActive
            })),
            lastBackup: null
          };
        } catch (switchboardError) {
          console.warn('⚠️ [DB-IPC] Switchboard query failed:', switchboardError);
        }
      }
      
      return {
        type: 'remote',
        remoteHost: 'MongoDB Atlas',
        collections: [],
        totalSize: 'N/A',
        connectionInfo: {
          isConnected: false,
          uri: 'Not configured',
          host: 'MongoDB Atlas',
          database: 'healthtrack'
        },
        lastBackup: null
      };
    } catch (error) {
      console.error('❌ [DB-IPC] Failed to get database info:', error);
      throw error;
    }
  });

  // User MongoDB URI management
  ipcMain.handle('db:getUserMongoUri', async () => {
    try {
      const dsm = getDataSourceManager();
      const connectionInfo = await dsm.getActiveSourceConnectionInfo();
      return connectionInfo?.uri || null;
    } catch (error) {
      console.error('❌ [DB-IPC] Get URI failed:', error);
      return null;
    }
  });

  ipcMain.handle('db:setUserMongoUri', async (_event: IpcMainInvokeEvent, uri: string) => {
    try {
      const dsm = getDataSourceManager();
      await dsm.connectDataSource('mongodb-atlas', { uri });
      return true;
    } catch (error) {
      console.error('❌ [DB-IPC] Set URI failed:', error);
      throw error;
    }
  });

  ipcMain.handle('db:testConnection', async (_event: IpcMainInvokeEvent, uri: string) => {
    try {
      const dsm = getDataSourceManager();
      // Test connection without switching active source
      await dsm.connectDataSource('mongodb-atlas', { uri, purpose: 'test', autoConnect: true });
      return { success: true };
    } catch (error) {
      console.error('❌ [DB-IPC] Test connection failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Refactored handlers
  ipcMain.handle('db:getPatients', async (_event: IpcMainInvokeEvent, query: any = {}) => {
    const patients = await executeQuery<Document[]>({ type: 'patients.find', params: { filter: query } });
    return patients.map(mapDbPatientToFrontendPatient).filter(Boolean);
  });
  ipcMain.handle('db:getPatient', async (_event: IpcMainInvokeEvent, query: any) => {
    const patient = await executeQuery<Document | null>({ type: 'patients.findOne', params: { filter: query } });
    return mapDbPatientToFrontendPatient(patient);
  });
  ipcMain.handle('db:getArchivedPatients', async () => {
    const patients = await executeQuery<Document[]>({ type: 'patients.find', params: { filter: { isDeleted: true } } });
    return patients.map(mapDbPatientToFrontendPatient).filter(Boolean);
  });
  ipcMain.handle('db:createPatient', async (_event: IpcMainInvokeEvent, patient: Patient) => {
    const result = await executeQuery<{ _id: string }>({ type: 'patients.insertOne', params: { document: patient } });
    return { patientId: result._id.toString() };
  });
  ipcMain.handle('db:addPatient', async (_event: IpcMainInvokeEvent, patient: Patient) => {
    const result = await executeQuery<{ _id: string }>({ type: 'patients.insertOne', params: { document: patient } });
    return { patientId: result._id.toString() };
  });
  ipcMain.handle('db:updatePatient', async (_event: IpcMainInvokeEvent, query: any, patient: Partial<Patient>) => executeQuery({ type: 'patients.updateOne', params: { filter: query, update: { $set: patient } } }));
  
  ipcMain.handle('db:deletePatient', async (_event: IpcMainInvokeEvent, { id, reason, deletedBy }: { id: string, reason: string, deletedBy: string }) => {
    return executeQuery({
      type: 'patients.updateOne',
      params: {
        filter: { _id: id },
        update: {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletionReason: reason,
            deletedBy: deletedBy,
          },
        },
      },
    });
  });

  ipcMain.handle('db:getEncounters', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'encounters.find', params: { filter: query } }));
  ipcMain.handle('db:addEncounter', async (_event: IpcMainInvokeEvent, encounter: Encounter) => executeQuery({ type: 'encounters.insertOne', params: { document: encounter } }));

  ipcMain.handle('db:getObservations', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'observations.find', params: { filter: query } }));
  ipcMain.handle('db:addObservation', async (_event: IpcMainInvokeEvent, observation: Observation) => executeQuery({ type: 'observations.insertOne', params: { document: observation } }));

  ipcMain.handle('db:getPractitioners', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'practitioners.find', params: { filter: query } }));
  ipcMain.handle('db:addPractitioner', async (_event: IpcMainInvokeEvent, practitioner: Practitioner) => executeQuery({ type: 'practitioners.insertOne', params: { document: practitioner } }));

  ipcMain.handle('db:getMedications', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'medications.find', params: { filter: query } }));
  ipcMain.handle('db:addMedication', async (_event: IpcMainInvokeEvent, medication: Medication) => executeQuery({ type: 'medications.insertOne', params: { document: medication } }));

  ipcMain.handle('db:getMedicationRequests', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'medicationRequests.find', params: { filter: query } }));
  ipcMain.handle('db:addMedicationRequest', async (_event: IpcMainInvokeEvent, request: MedicationRequest) => executeQuery({ type: 'medicationRequests.insertOne', params: { document: request } }));

  ipcMain.handle('db:getAppointments', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'appointments.find', params: { filter: query } }));
  ipcMain.handle('db:addAppointment', async (_event: IpcMainInvokeEvent, appointment: Appointment) => executeQuery({ type: 'appointments.insertOne', params: { document: appointment } }));
  ipcMain.handle('db:updateAppointment', async (_event: IpcMainInvokeEvent, query: any, appointment: Partial<Appointment>) => executeQuery({ type: 'appointments.updateOne', params: { filter: query, update: { $set: appointment } } }));
  ipcMain.handle('db:deleteAppointment', async (_event: IpcMainInvokeEvent, query: any) => executeQuery({ type: 'appointments.deleteOne', params: { filter: query } }));

  ipcMain.handle('db:getSOAPNotes', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'soapNotes.find', params: { filter: query } }));
  ipcMain.handle('db:addSOAPNote', async (_event: IpcMainInvokeEvent, note: SOAPNote) => executeQuery({ type: 'soapNotes.insertOne', params: { document: note } }));
  ipcMain.handle('db:updateSOAPNote', async (_event: IpcMainInvokeEvent, query: any, note: Partial<SOAPNote>) => executeQuery({ type: 'soapNotes.updateOne', params: { filter: query, update: { $set: note } } }));

  ipcMain.handle('db:getTasks', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'tasks.find', params: { filter: query } }));
  ipcMain.handle('db:addTask', async (_event: IpcMainInvokeEvent, task: Task) => executeQuery({ type: 'tasks.insertOne', params: { document: task } }));
  ipcMain.handle('db:updateTask', async (_event: IpcMainInvokeEvent, query: any, task: Partial<Task>) => executeQuery({ type: 'tasks.updateOne', params: { filter: query, update: { $set: task } } }));
  ipcMain.handle('db:deleteTask', async (_event: IpcMainInvokeEvent, query: any) => executeQuery({ type: 'tasks.deleteOne', params: { filter: query } }));

  ipcMain.handle('db:getCodeMappings', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'codeMappings.find', params: { filter: query } }));
  ipcMain.handle('db:addCodeMapping', async (_event: IpcMainInvokeEvent, mapping: CodeMapping) => executeQuery({ type: 'codeMappings.insertOne', params: { document: mapping } }));

  ipcMain.handle('db:getSettings', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'settings.find', params: { filter: query } }));
  ipcMain.handle('db:updateSetting', async (_event: IpcMainInvokeEvent, key: string, value: any) => {
    return executeQuery({ type: 'settings.updateOne', params: { filter: { key }, update: { $set: { value } }, options: { upsert: true } } });
  });

  ipcMain.handle('db:getLogs', async (_event: IpcMainInvokeEvent, query: any = {}) => executeQuery({ type: 'logs.find', params: { filter: query } }));
  ipcMain.handle('db:addLog', async (_event: IpcMainInvokeEvent, log: LogEntry) => executeQuery({ type: 'logs.insertOne', params: { document: log } }));

  // AI Cache operations
  ipcMain.handle('db:getAICache', async (_event: IpcMainInvokeEvent, key: string) => {
    try {
      const cache = await executeQuery<Document | null>({ 
        type: 'ai_cache.findOne', 
        params: { filter: { key } } 
      });
      
      if (!cache) return null;
      
      // Check if cache is expired
      const expiryTime = cache.expiryTime || 0;
      if (expiryTime && expiryTime < Date.now()) {
        // Cache expired, delete it
        await executeQuery({ type: 'ai_cache.deleteOne', params: { filter: { key } } });
        return null;
      }
      
      return cache;
    } catch (error) {
      console.error('❌ [DB-IPC] Get AI cache failed:', error);
      return null;
    }
  });

  ipcMain.handle('db:setAICache', async (_event: IpcMainInvokeEvent, key: string, workflow: string, input: any, output: any, expiryMs: number = 86400000) => {
    try {
      const expiryTime = Date.now() + expiryMs;
      await executeQuery({
        type: 'ai_cache.updateOne',
        params: {
          filter: { key },
          update: {
            $set: {
              key,
              workflow,
              input,
              output,
              expiryTime,
              createdAt: Date.now()
            }
          },
          options: { upsert: true }
        }
      });
      return true;
    } catch (error) {
      console.error('❌ [DB-IPC] Set AI cache failed:', error);
      return false;
    }
  });

  // Additional database operations
  ipcMain.handle('db:countDocuments', async (_event: IpcMainInvokeEvent, collection: string, filter: any = {}) => {
    try {
      console.log(`📊 [DB-IPC] Counting documents in ${collection}:`, filter);
      const result = await executeQuery<number>({
        type: `${collection}.count`,
        params: { filter }
      });
      console.log(`✅ [DB-IPC] countDocuments result for ${collection}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [DB-IPC] Failed to countDocuments in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db:aggregate', async (_event: IpcMainInvokeEvent, collection: string, pipeline: any[]) => {
    try {
      console.log(`🔍 [DB-IPC] Aggregating in ${collection} with pipeline:`, pipeline);
      const result = await executeQuery<any[]>({
        type: `${collection}.aggregate`,
        params: { pipeline }
      });
      console.log(`✅ [DB-IPC] aggregate result for ${collection}: ${result.length} documents`);
      return result;
    } catch (error) {
      console.error(`❌ [DB-IPC] Failed to aggregate in ${collection}:`, error);
      throw error;
    }
  });

  console.log('✅ [DB-IPC] Database handlers registered successfully');
}
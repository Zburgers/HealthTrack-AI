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
    return status.status === 'connected';
  });

  // Generic find operation
  const find = async (collectionName: string, query: any = {}) => {
    return executeQuery({ type: 'find', params: { collection: collectionName, query } });
  };

  // Generic findOne operation
  const findOne = async (collectionName:string, query: any) => {
    return executeQuery({ type: 'findOne', params: { collection: collectionName, query } });
  };

  // Generic insertOne operation
  const insertOne = async (collectionName: string, doc: any) => {
    return executeQuery({ type: 'insertOne', params: { collection: collectionName, payload: doc } });
  };

  // Status check --------------------------------------------------------------
  ipcMain.handle('db:checkStatus', () => {
    const dsm = getDataSourceManager();
    return dsm.getActiveStatus();
  });

  // Generic updateOne operation
  const updateOne = async (collectionName: string, query: any, update: any, options?: any) => {
    return executeQuery({ type: 'updateOne', params: { collection: collectionName, query, payload: update, options } });
  };

  // Generic deleteOne operation
  const deleteOne = async (collectionName: string, query: any) => {
    return executeQuery({ type: 'deleteOne', params: { collection: collectionName, query } });
  };

  // Refactored handlers
  ipcMain.handle('db:getPatients', async (_event: IpcMainInvokeEvent, query: any = {}) => find('patients', query));
  ipcMain.handle('db:getPatient', async (_event: IpcMainInvokeEvent, query: any) => findOne('patients', query));
  ipcMain.handle('db:addPatient', async (_event: IpcMainInvokeEvent, patient: Patient) => insertOne('patients', patient));
  ipcMain.handle('db:updatePatient', async (_event: IpcMainInvokeEvent, query: any, patient: Partial<Patient>) => updateOne('patients', query, { $set: patient }));
  
  ipcMain.handle('db:getEncounters', async (_event: IpcMainInvokeEvent, query: any = {}) => find('encounters', query));
  ipcMain.handle('db:addEncounter', async (_event: IpcMainInvokeEvent, encounter: Encounter) => insertOne('encounters', encounter));

  ipcMain.handle('db:getObservations', async (_event: IpcMainInvokeEvent, query: any = {}) => find('observations', query));
  ipcMain.handle('db:addObservation', async (_event: IpcMainInvokeEvent, observation: Observation) => insertOne('observations', observation));

  ipcMain.handle('db:getPractitioners', async (_event: IpcMainInvokeEvent, query: any = {}) => find('practitioners', query));
  ipcMain.handle('db:addPractitioner', async (_event: IpcMainInvokeEvent, practitioner: Practitioner) => insertOne('practitioners', practitioner));

  ipcMain.handle('db:getMedications', async (_event: IpcMainInvokeEvent, query: any = {}) => find('medications', query));
  ipcMain.handle('db:addMedication', async (_event: IpcMainInvokeEvent, medication: Medication) => insertOne('medications', medication));

  ipcMain.handle('db:getMedicationRequests', async (_event: IpcMainInvokeEvent, query: any = {}) => find('medicationRequests', query));
  ipcMain.handle('db:addMedicationRequest', async (_event: IpcMainInvokeEvent, request: MedicationRequest) => insertOne('medicationRequests', request));

  ipcMain.handle('db:getAppointments', async (_event: IpcMainInvokeEvent, query: any = {}) => find('appointments', query));
  ipcMain.handle('db:addAppointment', async (_event: IpcMainInvokeEvent, appointment: Appointment) => insertOne('appointments', appointment));
  ipcMain.handle('db:updateAppointment', async (_event: IpcMainInvokeEvent, query: any, appointment: Partial<Appointment>) => updateOne('appointments', query, { $set: appointment }));
  ipcMain.handle('db:deleteAppointment', async (_event: IpcMainInvokeEvent, query: any) => deleteOne('appointments', query));

  ipcMain.handle('db:getSOAPNotes', async (_event: IpcMainInvokeEvent, query: any = {}) => find('soapNotes', query));
  ipcMain.handle('db:addSOAPNote', async (_event: IpcMainInvokeEvent, note: SOAPNote) => insertOne('soapNotes', note));
  ipcMain.handle('db:updateSOAPNote', async (_event: IpcMainInvokeEvent, query: any, note: Partial<SOAPNote>) => updateOne('soapNotes', query, { $set: note }));

  ipcMain.handle('db:getTasks', async (_event: IpcMainInvokeEvent, query: any = {}) => find('tasks', query));
  ipcMain.handle('db:addTask', async (_event: IpcMainInvokeEvent, task: Task) => insertOne('tasks', task));
  ipcMain.handle('db:updateTask', async (_event: IpcMainInvokeEvent, query: any, task: Partial<Task>) => updateOne('tasks', query, { $set: task }));
  ipcMain.handle('db:deleteTask', async (_event: IpcMainInvokeEvent, query: any) => deleteOne('tasks', query));

  ipcMain.handle('db:getCodeMappings', async (_event: IpcMainInvokeEvent, query: any = {}) => find('codeMappings', query));
  ipcMain.handle('db:addCodeMapping', async (_event: IpcMainInvokeEvent, mapping: CodeMapping) => insertOne('codeMappings', mapping));

  ipcMain.handle('db:getSettings', async (_event: IpcMainInvokeEvent, query: any = {}) => find('settings', query));
  ipcMain.handle('db:updateSetting', async (_event: IpcMainInvokeEvent, key: string, value: any) => {
    return updateOne('settings', { key }, { $set: { value } }, { upsert: true });
  });

  ipcMain.handle('db:getLogs', async (_event: IpcMainInvokeEvent, query: any = {}) => find('logs', query));
  ipcMain.handle('db:addLog', async (_event: IpcMainInvokeEvent, log: LogEntry) => insertOne('logs', log));

  console.log('✅ [DB-IPC] Database handlers registered successfully');
}

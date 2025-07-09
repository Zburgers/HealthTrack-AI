/**
 * Electron IPC Database Access Layer
 * 
 * This module provides database access for the renderer process in Electron
 * via IPC communication with the main process
 */

import { isElectronEnvironment } from './config';

export function isElectronIPCAvailable(): boolean {
    return isElectronEnvironment() && typeof window !== 'undefined' && (window as any).electronAPI;
}

const getApi = () => {
  if (!isElectronIPCAvailable()) {
    throw new Error('Electron IPC is not available.');
  }
  return (window as any).electronAPI.database;
}

export const findOneViaIPC = (c: string, q: any) => getApi().findOne(c, q);
export const findViaIPC = (c: string, q: any, o?: any) => getApi().find(c, q, o);
export const insertOneViaIPC = (c: string, d: any) => getApi().insertOne(c, d);
export const updateOneViaIPC = (c: string, f: any, u: any, o?: any) => getApi().updateOne(c, f, u, o);
export const deleteOneViaIPC = (c: string, f: any) => getApi().deleteOne(c, f);

// High-level operations
export const getPatientsViaIPC = () => getApi().getPatients();
export const getPatientViaIPC = (id: string) => getApi().getPatient(id);
export const createPatientViaIPC = (p: any) => getApi().createPatient(p);
export const updatePatientViaIPC = (id: string, u: any) => getApi().updatePatient(id, u);
export const deletePatientViaIPC = (id: string) => getApi().deletePatient(id);

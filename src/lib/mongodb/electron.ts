/**
 * Electron IPC Database Access Layer
 * 
 * This module provides database access for the renderer process in Electron
 * via IPC communication with the main process
 */

import { isElectronEnvironment } from './config';
import { Filter, FindOptions, UpdateFilter, UpdateOptions, Document } from 'mongodb';

export function isElectronIPCAvailable(): boolean {
    return isElectronEnvironment() && typeof window !== 'undefined' && (window as any).electronAPI;
}

const getApi = () => {
  if (!isElectronIPCAvailable()) {
    throw new Error('Electron IPC is not available.');
  }
  return (window as any).electronAPI.database;
}

export const findOneViaIPC = <T extends Document>(c: string, q: Filter<T>) => getApi().findOne(c, q);
export const findViaIPC = <T extends Document>(c: string, q: Filter<T>, o?: FindOptions<T>) => getApi().find(c, q, o);
export const insertOneViaIPC = <T extends Document>(c: string, d: T) => getApi().insertOne(c, d);
export const updateOneViaIPC = <T extends Document>(c: string, f: Filter<T>, u: UpdateFilter<T>, o?: UpdateOptions) => getApi().updateOne(c, f, u, o);
export const deleteOneViaIPC = <T extends Document>(c: string, f: Filter<T>) => getApi().deleteOne(c, f);

// High-level operations
export const getPatientsViaIPC = () => getApi().getPatients();
export const getPatientViaIPC = (id: string) => getApi().getPatient(id);
export const createPatientViaIPC = (p: Document) => getApi().createPatient(p);
export const updatePatientViaIPC = (id: string, u: Document) => getApi().updatePatient(id, u);
export const deletePatientViaIPC = (id: string) => getApi().deletePatient(id);
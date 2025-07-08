import { serverIPCClient } from '../server-ipc-client';
import { connectToDatabase as connectToMongoDB } from '../mongodb';

export function isElectronEnvironment() {
  return process.env.IS_ELECTRON === 'true' || process.env.ELECTRON_ENV === 'true';
}

export async function getDb(collectionName?: string) {
  if (isElectronEnvironment()) {
    return serverIPCClient;
  }
  return connectToMongoDB();
}

/**
 * Electron utilities for database operations
 * 
 * These utilities help determine if the app is running in Electron
 * and provide consistent interfaces for database operations.
 */

/**
 * Check if the app is running in an Electron environment
 */
export function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
}

/**
 * Get a patient by ID using the appropriate method for the environment
 */
export async function getPatient(patientId: string): Promise<any> {
  if (isElectronEnvironment()) {
    console.log(`[Electron] Getting patient ${patientId} via IPC`);
    return (window as any).electronAPI.database.getPatient({ id: patientId });
  } else {
    console.log(`[Web] Getting patient ${patientId} via API`);
    const response = await fetch(`/api/patients/${patientId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch patient: ${response.statusText}`);
    }
    return response.json();
  }
}

/**
 * Get all patients using the appropriate method for the environment
 */
export async function getPatients(query: any = {}): Promise<any[]> {
  if (isElectronEnvironment()) {
    console.log('[Electron] Getting patients via IPC');
    return (window as any).electronAPI.database.getPatients(query);
  } else {
    console.log('[Web] Getting patients via API');
    const queryParams = new URLSearchParams();
    
    // Add query params if any
    if (query.isDeleted) {
      queryParams.set('archivedOnly', 'true');
    }
    
    const response = await fetch(`/api/patients?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch patients: ${response.statusText}`);
    }
    return response.json();
  }
}

/**
 * Create a new patient using the appropriate method for the environment
 */
export async function createPatient(patient: any): Promise<any> {
  if (isElectronEnvironment()) {
    console.log('[Electron] Creating patient via IPC');
    return (window as any).electronAPI.database.createPatient(patient);
  } else {
    console.log('[Web] Creating patient via API');
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patient),
    });
    
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || `Failed to create patient: ${response.statusText}`);
    }
    
    return response.json();
  }
}

/**
 * Update a patient using the appropriate method for the environment
 */
export async function updatePatient(patientId: string, updates: any): Promise<any> {
  if (isElectronEnvironment()) {
    console.log(`[Electron] Updating patient ${patientId} via IPC`);
    return (window as any).electronAPI.database.updatePatient({ id: patientId }, updates);
  } else {
    console.log(`[Web] Updating patient ${patientId} via API`);
    const response = await fetch(`/api/patients/${patientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || `Failed to update patient: ${response.statusText}`);
    }
    
    return response.json();
  }
}

/**
 * Delete a patient using the appropriate method for the environment
 */
export async function deletePatient(patientId: string, reason: string = 'User deleted', deletedBy: string = 'System'): Promise<any> {
  if (isElectronEnvironment()) {
    console.log(`[Electron] Deleting patient ${patientId} via IPC`);
    return (window as any).electronAPI.database.deletePatient({
      id: patientId,
      reason,
      deletedBy,
    });
  } else {
    console.log(`[Web] Deleting patient ${patientId} via API`);
    const response = await fetch(`/api/patients/${patientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, deletedBy }),
    });
    
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || `Failed to delete patient: ${response.statusText}`);
    }
    
    return response.json();
  }
}

/**
 * Get AI cache using the appropriate method for the environment
 */
export async function getAICache(key: string): Promise<any> {
  if (isElectronEnvironment()) {
    console.log(`[Electron] Getting AI cache for ${key} via IPC`);
    return (window as any).electronAPI.database.getAICache(key);
  } else {
    console.log(`[Web] Getting AI cache for ${key} via API`);
    const response = await fetch(`/api/ai-cache/${key}`);
    if (!response.ok) {
      // Not found is expected for cache misses
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch AI cache: ${response.statusText}`);
    }
    return response.json();
  }
}

/**
 * Set AI cache using the appropriate method for the environment
 */
export async function setAICache(key: string, workflow: string, input: any, output: any, expiryMs?: number): Promise<boolean> {
  if (isElectronEnvironment()) {
    console.log(`[Electron] Setting AI cache for ${key} via IPC`);
    return (window as any).electronAPI.database.setAICache(key, workflow, input, output, expiryMs);
  } else {
    console.log(`[Web] Setting AI cache for ${key} via API`);
    const response = await fetch('/api/ai-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, workflow, input, output, expiryMs }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to set AI cache: ${response.statusText}`);
    }
    
    return true;
  }
}
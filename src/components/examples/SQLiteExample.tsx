'use client';

import { useState, useEffect, FormEvent } from 'react';

/**
 * Example client component that properly interacts with SQLite database
 * using IPC in an Electron desktop app.
 * 
 * This is the CORRECT pattern for database access:
 * 1. SQLite database lives ONLY in Electron main process
 * 2. Client components use window.ipcRenderer to interact with database
 * 3. No direct database access from Next.js server/API routes
 * 
 * This example demonstrates CRUD operations via IPC:
 * - CREATE: Add a new patient
 * - READ: Fetch patients and database health
 * - UPDATE: Update patient information
 * - DELETE: Remove a patient
 */
export function SQLiteExample() {
  const [isElectron, setIsElectron] = useState(false);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state for creating new patient
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    sex: 'male',
    primary_complaint: ''
  });
  
  // State for tracking the patient being edited
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    age: '',
    sex: '',
    primary_complaint: ''
  });

  // Load patients data
  const loadPatients = async () => {
    try {
      const result = await (window as any).ipcRenderer.invoke('sqlite-operation', {
        operation: 'find',
        collection: 'patients',
        payload: {
          filter: {},
          options: { sort: { last_updated: -1 } }
        }
      });
      
      setPatients(result || []);
      return true;
    } catch (err) {
      setError(`Failed to load patients: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  };

  useEffect(() => {
    // Check if we're in Electron environment and initialize
    const checkElectron = async () => {
      const isElectronEnv = !!(window as any).ipcRenderer;
      setIsElectron(isElectronEnv);
      
      if (!isElectronEnv) {
        setError('This component requires Electron environment with IPC');
        setLoading(false);
        return;
      }
      
      try {
        // Check database health via IPC
        const health = await (window as any).ipcRenderer.invoke('db-health');
        setDbHealth(health);
        
        // Load patients via IPC
        await loadPatients();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to interact with database');
      } finally {
        setLoading(false);
      }
    };
    
    checkElectron();
  }, []);

  // Handle creating a new patient
  const handleCreatePatient = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newPatient.name || !newPatient.age) {
      setError('Name and age are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const patientToCreate = {
        ...newPatient,
        age: parseInt(newPatient.age, 10),
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      // Insert the new patient via IPC
      const result = await (window as any).ipcRenderer.invoke('sqlite-operation', {
        operation: 'insertOne',
        collection: 'patients',
        payload: {
          document: patientToCreate
        }
      });
      
      if (result.acknowledged) {
        setSuccessMessage('Patient created successfully!');
        
        // Reset form
        setNewPatient({
          name: '',
          age: '',
          sex: 'male',
          primary_complaint: ''
        });
        
        // Reload patients list
        await loadPatients();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to create patient: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Start editing a patient
  const startEditPatient = (patient: any) => {
    setEditPatientId(patient.id);
    setEditForm({
      name: patient.name,
      age: patient.age.toString(),
      sex: patient.sex,
      primary_complaint: patient.primary_complaint || ''
    });
  };

  // Handle updating a patient
  const handleUpdatePatient = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!editPatientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const patientUpdate = {
        $set: {
          name: editForm.name,
          age: parseInt(editForm.age, 10),
          sex: editForm.sex,
          primary_complaint: editForm.primary_complaint,
          last_updated: new Date().toISOString()
        }
      };
      
      // Update the patient via IPC
      const result = await (window as any).ipcRenderer.invoke('sqlite-operation', {
        operation: 'updateOne',
        collection: 'patients',
        payload: {
          filter: { id: editPatientId },
          update: patientUpdate
        }
      });
      
      if (result.acknowledged) {
        setSuccessMessage('Patient updated successfully!');
        setEditPatientId(null);
        
        // Reload patients list
        await loadPatients();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to update patient: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a patient
  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Delete the patient via IPC
      const result = await (window as any).ipcRenderer.invoke('sqlite-operation', {
        operation: 'deleteOne',
        collection: 'patients',
        payload: {
          filter: { id: patientId }
        }
      });
      
      if (result.acknowledged) {
        setSuccessMessage('Patient deleted successfully!');
        
        // Reload patients list
        await loadPatients();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to delete patient: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && patients.length === 0) {
    return <div className="p-4">Loading database information...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  
  if (!isElectron) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">Not in Electron Environment</h2>
        <p>This component requires the Electron environment to function properly.</p>
        <p>In web environments, use server-side data fetching or API routes.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">SQLite Database Example</h2>
      
      {successMessage && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          {successMessage}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Database Health</h3>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(dbHealth, null, 2)}
        </pre>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create new patient form */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Create New Patient</h3>
          <form onSubmit={handleCreatePatient}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={newPatient.name}
                onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Age</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded"
                value={newPatient.age}
                onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Sex</label>
              <select 
                className="w-full p-2 border rounded"
                value={newPatient.sex}
                onChange={(e) => setNewPatient({...newPatient, sex: e.target.value})}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Primary Complaint</label>
              <textarea 
                className="w-full p-2 border rounded"
                value={newPatient.primary_complaint}
                onChange={(e) => setNewPatient({...newPatient, primary_complaint: e.target.value})}
              />
            </div>
            
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Patient'}
            </button>
          </form>
        </div>
        
        {/* Patient list */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Patients ({patients.length})</h3>
          {patients.length === 0 ? (
            <p>No patients found in database.</p>
          ) : (
            <div className="space-y-2">
              {patients.map((patient) => (
                <div key={patient.id} className="bg-gray-100 p-2 rounded">
                  {editPatientId === patient.id ? (
                    <form onSubmit={handleUpdatePatient} className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded" 
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Age</label>
                        <input 
                          type="number" 
                          className="w-full p-2 border rounded"
                          value={editForm.age}
                          onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Sex</label>
                        <select 
                          className="w-full p-2 border rounded"
                          value={editForm.sex}
                          onChange={(e) => setEditForm({...editForm, sex: e.target.value})}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Primary Complaint</label>
                        <textarea 
                          className="w-full p-2 border rounded"
                          value={editForm.primary_complaint}
                          onChange={(e) => setEditForm({...editForm, primary_complaint: e.target.value})}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          type="submit" 
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button 
                          type="button"
                          className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                          onClick={() => setEditPatientId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <strong>{patient.name}</strong>
                        <div className="space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            onClick={() => startEditPatient(patient)}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800 text-sm"
                            onClick={() => handleDeletePatient(patient.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="text-sm">Age: {patient.age}, Sex: {patient.sex}</div>
                      <p className="text-sm mt-1">{patient.primary_complaint || 'No complaint recorded'}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

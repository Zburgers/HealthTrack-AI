// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

import { SQLiteAdapter } from '../../../src/lib/sqlite/sqlite-adapter';
import { v4 as uuidv4 } from 'uuid';

// Mock the global window.ipcRenderer object
const mockIpcRenderer = {
  invoke: jest.fn(),
};

// Ensure global.window is defined
if (typeof global.window === 'undefined') {
  (global as any).window = {};
}
global.window.ipcRenderer = mockIpcRenderer;

describe('SQLiteAdapter IPC Proxy', () => {
  let adapter: SQLiteAdapter;

  beforeEach(() => {
    // Reset the mock before each test
    mockIpcRenderer.invoke.mockReset();
    adapter = new SQLiteAdapter();
  });

  // Test for findOne
  it('should call ipcRenderer.invoke with "findOne" for findOne operation', async () => {
    const filter = { id: '123' };
    const expectedResult = { id: '123', name: 'Test' };
    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    const result = await adapter.findOne('patients', filter);

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('db-operation', 'findOne', 'patients', filter);
    expect(result).toEqual(expectedResult);
  });

  // Test for insertOne
  it('should call ipcRenderer.invoke with "insertOne" for insertOne operation', async () => {
    const doc = { name: 'New Patient' };
    const expectedResult = { acknowledged: true, insertedId: uuidv4() };
    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    const result = await adapter.insertOne('patients', doc);

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('db-operation', 'insertOne', 'patients', doc);
    expect(result).toEqual(expectedResult);
  });

  // Test for updateOne
  it('should call ipcRenderer.invoke with "updateOne" for updateOne operation', async () => {
    const filter = { id: '456' };
    const update = { $set: { name: 'Updated Patient' } };
    const expectedResult = { acknowledged: true, modifiedCount: 1, upsertedId: null, upsertedCount: 0, matchedCount: 1 };
    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    const result = await adapter.updateOne('patients', filter, update);

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('db-operation', 'updateOne', 'patients', filter, update);
    expect(result).toEqual(expectedResult);
  });

  // Test for deleteOne
  it('should call ipcRenderer.invoke with "deleteOne" for deleteOne operation', async () => {
    const filter = { id: '789' };
    const expectedResult = { acknowledged: true, deletedCount: 1 };
    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    const result = await adapter.deleteOne('patients', filter);

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('db-operation', 'deleteOne', 'patients', filter);
    expect(result).toEqual(expectedResult);
  });

  // Test for find
  it('should call ipcRenderer.invoke with "find" for find operation', async () => {
    const filter = { status: 'active' };
    const expectedResult = [{ id: '1', name: 'Patient A' }, { id: '2', name: 'Patient B' }];
    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    const result = await adapter.find('patients', filter);

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('db-operation', 'find', 'patients', filter, undefined);
    expect(result).toEqual(expectedResult);
  });

  // Test for countDocuments
  it('should call ipcRenderer.invoke with "countDocuments" for countDocuments operation', async () => {
    const filter = { status: 'active' };
    const expectedResult = 5;
    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    const result = await adapter.countDocuments('patients', filter);

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('db-operation', 'countDocuments', 'patients', filter);
    expect(result).toEqual(expectedResult);
  });

  // Test for aggregate
  it('should call ipcRenderer.invoke with "aggregate" for aggregate operation', async () => {
    const pipeline = [{ $group: { _id: '$status', count: { $sum: 1 } } }];
    const expectedResult = [{ _id: 'active', count: 5 }, { _id: 'inactive', count: 2 }];
    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    const result = await adapter.aggregate('patients', pipeline);

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('db-operation', 'aggregate', 'patients', pipeline);
    expect(result).toEqual(expectedResult);
  });

  // Test error handling
  it('should propagate errors from ipcRenderer.invoke', async () => {
    const errorMessage = 'IPC Error';
    mockIpcRenderer.invoke.mockRejectedValue(new Error(errorMessage));

    await expect(adapter.findOne('patients', { id: 'error' })).rejects.toThrow(errorMessage);
  });
});

# Dual-Database Architecture for HealthTrack-AI

This document outlines the dual-database architecture implemented in HealthTrack-AI to support both web and desktop (Electron) environments.

## Overview

HealthTrack-AI uses a dual-database approach to optimize for different environments:

1. **Remote MongoDB (Atlas)**: Used for the web application and vector search operations against MIMIC-IV data
2. **Local MongoDB (Bundled)**: Used for the Electron desktop application to store all patient data, notes, and AI cache locally

## Architecture Design

### Collection Distribution Strategy

Collections are categorized into three types:

| Category | Description | Storage Location | Examples |
|----------|-------------|------------------|----------|
| **Local-only** | Data that is only used locally | Electron local DB | `local_embeddings`, `db_metadata` |
| **Remote-only** | Data that is only stored remotely | MongoDB Atlas | `case_embeddings` (MIMIC-IV data) |
| **Local-primary** | Data stored in both locations | Both, primary is local in Electron | `patients`, `notes`, `ai_cache` |

### Implementation Components

The implementation consists of several key components:

1. **MongoDB Module** (`src/lib/mongodb/`)
   - `config.ts` - Configuration constants and collection distribution
   - `index.ts` - Main entry point with unified interface
   - `remote.ts` - Remote MongoDB connection and operations
   - `local.ts` - Local MongoDB memory server for development
   - `electron.ts` - Electron-specific MongoDB access via IPC
   - `schemas/` - Zod schema definitions for collections
   - `utils/` - Database initialization and utilities

2. **Electron Implementation** (`electron/db/`)
   - `local-db.ts` - Local MongoDB management for Electron
   - `init.ts` - Database initialization and migrations
   - `paths.ts` - File path utilities for database storage

3. **IPC Communication**
   - `electron/preload.ts` - Exposed API for renderer process
   - `electron/main.ts` - IPC handlers for database operations

## How It Works

### In Web Application

1. All database operations go through the MongoDB module
2. Remote MongoDB (Atlas) is used for all collections
3. Vector search operations use the Atlas vector search capability

### In Electron Application

1. All database operations still go through the MongoDB module
2. The module automatically routes to the appropriate database:
   - Local database for `patients`, `notes`, `ai_cache`, and local collections
   - Remote database for `case_embeddings` and other remote-only collections
3. Database operations are performed via IPC calls to the main process
4. Synchronization between local and remote is available

## Vector Search Implementation

The vector search functionality is implemented using the following approach:

1. **Remote Vector Search**: The `case_embeddings` collection in MongoDB Atlas contains the MIMIC-IV patient data with vector embeddings for similarity search
2. **Local Embedding Cache**: The `local_embeddings` collection stores embeddings for the user's own patients to avoid redundant AI calls
3. **Search Flow**:
   - For similar case search, the application queries the remote `case_embeddings` collection using MongoDB Atlas vector search capability
   - The search results are then combined with any relevant local matches
   - Results are returned to the user, prioritizing the most similar cases

This approach ensures:
- Efficient use of AI resources by caching embeddings locally
- Access to the comprehensive MIMIC-IV dataset for case comparison
- Privacy for patient data by keeping it local when possible

## Database Synchronization

Synchronization is implemented in two directions:

1. **Remote to Local**
   - Used to populate the local database with remote data
   - Excludes remote-only collections like `case_embeddings`
   - Can be triggered manually or automatically on a schedule

2. **Local to Remote**
   - Used to backup local changes to the remote database
   - Implemented for local-primary collections only
   - Can be configured for automatic synchronization

## Configuration

The database configuration is centralized in:

- `src/lib/mongodb/config.ts` - Collection distribution and general settings
- `electron/config.ts` - Electron-specific database settings

## Usage Guidelines

### Accessing the Appropriate Database

Always use the main `getDatabase()` function from the MongoDB module, which automatically routes to the appropriate database:

```typescript
import { getDatabase, COLLECTIONS } from '@/lib/mongodb';

async function getPatientData(patientId) {
  // This will automatically use the local database in Electron
  // and the remote database in the web app
  const db = await getDatabase(COLLECTIONS.PATIENTS);
  const collection = db.collection(COLLECTIONS.PATIENTS);
  return collection.findOne({ patientId });
}
```

### Synchronization

To synchronize data between databases in Electron:

```typescript
import { syncRemoteToLocal } from '@/lib/mongodb/electron';

// Sync specific collections
await syncRemoteToLocal(['patients', 'notes']);

// Or sync all local-primary collections (default)
await syncRemoteToLocal();
```

## Future Considerations

1. **Local Vector Embeddings**: The `local_embeddings` collection caches vector embeddings locally to reduce AI calls for embeddings generation
2. **Embedding Management**: Implement a management system for keeping latest embeddings in sync with patient changes
3. **Repository Pattern**: Consider implementing a repository pattern to abstract database access further
4. **Conflict Resolution**: Implement robust conflict resolution for bi-directional sync
5. **Offline Mode Improvements**: Enhanced offline capabilities with queued operations
6. **Performance Optimization**: Local caching strategies for frequently accessed data

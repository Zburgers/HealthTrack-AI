---

## 🗓️ UPDATE: 2025-06-23

### 🔧 Changes Made
- [refactored] MongoDB code structure into dedicated folder for better organization
- [added] Folder structure with mongodb/schemas, mongodb/utils, and main connection files
- [added] MongoDB configuration file with constants for collections and settings
- [added] README.md with documentation for MongoDB folder structure
- [updated] Import paths across codebase to use new MongoDB module structure

### 📌 Notes for Future Reference
- All MongoDB operations should now import from '@/lib/mongodb' instead of direct file references
- The MongoDB folder is now self-contained with its own schemas, utilities, and configuration
- Consider implementing a data access layer (repository pattern) in the future for better abstraction

---

## 🗓️ UPDATE: 2025-06-24

### 🔧 Changes Made
- [completed] Dual-database architecture implementation for Electron app
- [added] IPC handlers and API endpoints for MongoDB operations in Electron
- [enhanced] MongoDB configuration with clear separation of local and remote collections
- [updated] MongoDB connection logic to support both local-only and remote-only collections
- [implemented] Electron-specific database initialization and management
- [added] Database synchronization between local and remote (excluding remote-only collections)
- [documented] Complete dual-database architecture in MongoDB module README and dedicated doc
- [implemented] Local embeddings caching to reduce AI calls for vector embeddings

### 📌 Notes for Future Reference
- Electron app uses local MongoDB for patients, notes, and AI cache data
- Remote MongoDB (Atlas) is only used for vector search against MIMIC-IV data in case_embeddings collection
- Local vector embeddings are cached in local_embeddings collection to reduce remote AI calls
- Use `syncRemoteToLocal()` to pull data from remote to local database when needed
- Database synchronization can be configured with auto-sync interval in electron/config.ts
- Local storage ensures patient data remains private and secure within the clinic's environment

---

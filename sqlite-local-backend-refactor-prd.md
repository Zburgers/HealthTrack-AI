# 🩺 PRD: HealthTrack-AI – SQLite Local Backend Refactor (v1)

---

## 🧠 Overview

This document defines the Product Requirements for finalizing the migration of the local backend for the **Electron version of HealthTrack-AI** from **MongoDB Memory Server** to a **production-ready SQLite engine (Better-SQLite3)**. This SQLite backend is designed to persist across sessions, be fully offline-compatible, and act as the authoritative local data source for doctors using the desktop app.

**Key Characteristics:**
- ✅ Clean slate – No prior patient data to migrate
- 🔄 Remote MongoDB Atlas still in use for `case_embeddings` (vector search)
- 🔄 Gemini and Hugging Face APIs for AI inferences remain cloud-based
- 🎯 This is a backend engine switch, not a data migration

---

## 🎯 Goals

1. Replace all local database logic with a robust, persistent SQLite backend
2. Ensure all `patients`, `notes`, `ai_cache`, and `local_embeddings` collections are stored locally via SQLite
3. Retain MongoDB Atlas usage exclusively for remote collections like `case_embeddings`
4. Make API/database usage environment-aware (Electron vs Web)
5. Decommission legacy MongoDB memory server code
6. Maintain seamless AI pipeline and vector search functionality

---

## ✅ What Has Already Been Completed

| Component | Status | Notes |
|----------|--------|-------|
| `sqlite-db.ts` | ✅ Implemented | Initializes SQLite DB with schema and indexes |
| `sqlite-adapter.ts` | ✅ Complete | MongoDB-style adapter interface for SQLite |
| `initializeSqliteDatabase()` | ✅ Wired | Called in `electron/main.ts` |
| `sql.md` schema dump | ✅ Complete | Defines local table mappings, indexes, and JSON storage strategy |
| `ipc/handlers.ts` | ✅ Uses SQLite adapter | IPC routes are functional and SQLite-aware |

---

## 🔍 What Remains

### 🚧 Critical Gaps

| Area | Issue | Location | Impact |
|------|-------|----------|--------|
| API Routes | Still reference MongoDB | `src/app/api/**` | Electron workflows bypass them |
| Env Routing | No unified DB router | N/A | Prevents dual-mode portability |
| Legacy Code | MongoDB memory server remains | `electron/db/local-db.ts` | Causes confusion, risk of reuse |
| Test Coverage | SQLite adapter not tested for MongoDB compatibility | `tests/` | Risk of silent query mismatch bugs |

---

## 🏗️ Functional Requirements

### 1. Database Routing
- Implement `database-router.ts` to abstract DB selection
- Route based on:
  - **Electron + local collection** → SQLite
  - **Web app or remote collection** → MongoDB Atlas

### 2. API Route Refactor
- All API routes must use the database router
- No `@/lib/mongodb` references should remain
- Must support both environments seamlessly

### 3. End-to-End Electron Support
- Full patient → AI → SOAP → export workflow must run via SQLite
- All IPC handlers must use the updated adapter

### 4. Cleanup & Removal
- Remove `local-db.ts` and any `mongodb-memory-server` references
- Update `CHANGELOG.md` and documentation to reflect switch

---

## 📁 Schema Requirements (From sql.md)

| Table | JSON Fields | Indexes | Notes |
|-------|-------------|---------|-------|
| `patients` | `vitals`, `history` | `owner_uid`, `createdAt` | Core entity |
| `notes` | `content`, `tags` | `patient_id`, `createdAt` | Linked to patient |
| `ai_cache` | `result`, `meta`, `workflow` | `key`, `expires_at` | Replaces AI TTL cache |
| `local_embeddings` | `vector`, `meta` | `patient_id`, `createdAt` | Optional search accel |
| `db_metadata` | Simple KV | `key (unique)` | DB version, migration logs |

---

## 🧪 Non-Functional Requirements

- Must maintain <100ms read/write latency on common operations
- Must support full offline usage on all platforms (Win/macOS/Linux)
- IPC interface must be secured against injection/malformed inputs
- JSON fields must be queryable via adapter (e.g. WHERE meta->'$.label' = 'ICD10')

---

## 🚦 Acceptance Criteria

| Milestone | Description |
|----------|-------------|
| ✅ SQLite adapter live in Electron | IPC returns persisted data |
| ✅ All API routes refactored | No MongoDB references in local-only data paths |
| ✅ Schema created automatically | On app install/startup |
| ✅ Full patient workflow works offline | Data persists across relaunch |
| ✅ MongoDB Memory code removed | `local-db.ts` no longer exists |

---

## 🧭 Suggested Phases for Agent Parsing

### Phase 1 – Adapter & Schema Lock-in
- Validate SQLite adapter against test suite
- Lock in schema from `sql.md`
- Write unit tests for query compatibility

### Phase 2 – API Integration
- Implement `database-router.ts`
- Refactor API routes to use router
- Test dual-mode environment switching

### Phase 3 – Cleanup & Stabilization
- Remove legacy MongoDB code
- Update documentation, changelog, developer onboarding

### Phase 4 – E2E QA & Release Readiness
- Offline test run on clean machine
- Measure startup time, bundle size, query latency

---

## 🧠 Agent Notes for Parsing

- Break all subtasks by file and function if possible
- Group atomic actions under the same file/route/module
- Include test writing, validation hooks, and fallback logic where needed
- Include doc update + changelog update tasks per phase

---

## 📌 Tags

`#electron` `#sqlite` `#offline` `#ai` `#database-refactor` `#better-sqlite3` `#ipc` `#mongodb-remote` `#schema-design` `#api-refactor`

---

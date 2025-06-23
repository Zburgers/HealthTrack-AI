# 🩺 PRD: HealthTrack-AI Desktop Application (Electron Build)

## 🧠 Overview

This PRD defines the core requirements for building the **HealthTrack-AI desktop application** using **ElectronJS**, with a focus on **offline-first patient data storage** and seamless integration of existing cloud-based AI services.

---

## 🎯 Goal

To convert the existing HealthTrack-AI web application into a downloadable **Electron desktop app** that:
- Keeps **patient and clinic-specific data fully local** (privacy-first)
- Continues to use **Vertex AI APIs and Hugging Face APIs** for AI inference
- Uses **MongoDB Atlas for case embedding search (MIMIC-IV)** only
- Supports **offline workflows**, with optional syncing
- Maintains the same user experience (UI/UX) as the web application

---

## 🧩 Architecture Summary

| Component | Implementation |
|----------|----------------|
| **Frontend** | Electron wrapper around the existing web frontend (Next.js/React) |
| **Backend** | Node.js backend inside Electron (main process) |
| **Local Database** | Embedded MongoDB instance (via `mongodb-memory-server` or pre-bundled binaries) |
| **Remote Database** | MongoDB Atlas – used **only** for `case_embeddings` |
| **Vector Search** | Remote via MongoDB Atlas ($vectorSearch on MIMIC-IV embeddings) |
| **AI Inference** | Gemini (Vertex AI) and Hugging Face APIs via HTTP |
| **IPC** | Electron IPC bridges frontend (renderer) ↔ backend (main process) for DB access |
| **Sync (optional)** | Sync mechanism from local patient DB to remote MongoDB (manual/automatic) |

---

## 📁 Data Classification

| Collection       | Mode           | Notes                                           |
|------------------|----------------|-------------------------------------------------|
| `patients`       | Local-Primary  | Stored locally on doctor’s system              |
| `notes`          | Local-Primary  | Offline clinical documentation                 |
| `ai_cache`       | Local-Primary  | Caches AI inferences to avoid repeated calls   |
| `local_embeddings` | Local-Only   | Embeddings for clinic-generated patients       |
| `case_embeddings` | Remote-Only   | Static MIMIC-IV dataset for vector search      |

---

## 🔐 Security & Privacy

- Patient data is stored locally — encrypted at rest (optional phase 2)
- No PII leaves the doctor’s system unless explicitly synced or exported
- No data sync is enabled by default

---

## 💡 Features (Phase 1)

- [x] Unified `getDatabase()` API to route to local DB for Electron
- [x] Local-first collections for `patients`, `notes`, `ai_cache`
- [x] Remote-only vector search for `case_embeddings`
- [x] AI inference through cloud APIs (as is)
- [ ] Fully working Electron build with embedded MongoDB
- [ ] IPC layer to safely access MongoDB from the renderer
- [ ] Local UI with real-time response and offline behavior

---

## 🛠 Future Enhancements

- Auto-sync support (local to cloud backups)
- Local conflict resolution during sync
- Encrypted DB and audit logging
- Auto-updater for Electron app
- Smart embedding updates upon note/patient modification

---

## 📦 Deliverables

- `electron/` directory with:
  - `main.ts` (main process, db init, IPC)
  - `preload.ts` (bridge to expose DB functions)
  - `local-db.ts` (Mongo connection logic)
  - `paths.ts` (pathing utils)
- Bundled installer: `.dmg`, `.exe`, `.AppImage`
- Updated `CHANGELOG.md` and `docs/architecture-electron.md`


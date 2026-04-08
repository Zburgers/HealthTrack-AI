# Track Specification: AI Clinical Intelligence & Code Reorganization

## Overview

This track accomplishes three objectives:

1. **Code Reorganization** — Restructure the repository into a clean monorepo layout (`services/frontend/`, `services/backend/`, `services/workers/`)
2. **Vector Search Infrastructure** — Set up pgvector case embeddings table, MIMIC-IV case storage, BioBERT embedding pipeline, and similar case search API
3. **API Route Consolidation** — Re-enable the 6 disabled Next.js API routes as proper NestJS endpoints, replacing the old Electron IPC pattern
4. **Mastra Workflow Migration** — Migrate business logic from deprecated Genkit flows into Mastra agents/workflows

## Functional Requirements

### FR-1: Monorepo Structure
- All services live under `services/` directory at repo root
- `services/frontend/` — Next.js application (migrated from `src/`)
- `services/backend/` — NestJS API (migrated from `backend/`)
- `services/workers/` — Background job processor for embedding generation (new, independent codebase)
- Shared types/configs in `packages/shared/` (Zod schemas, TypeScript interfaces, SimilarCaseOutput type)
- Docker Compose at root orchestrates all services with updated build contexts pointing to `services/<name>/`
- Old `src/`, `backend/`, `workers/` directories at root removed after migration

### FR-2: Case Embeddings Infrastructure
- PostgreSQL table `mimic_cases` stores MIMIC-IV case records with the following fields:
  - `id` (UUID, primary key)
  - `subject_id` (MIMIC-IV patient identifier)
  - `hadm_id` (MIMIC-IV admission identifier)
  - `age` (integer)
  - `sex` (string)
  - `admit_time` (timestamp)
  - `discharge_time` (timestamp)
  - `diagnoses` (TEXT[] — ICD codes)
  - `diagnosis_labels` (TEXT[] — ICD descriptions)
  - `vitals` (JSONB — HR, BP, RR, SpO2, Temp as flexible key-value)
  - `diagnostics` (JSONB — lab results, flexible key-value)
  - `medications` (TEXT[])
  - `procedures` (TEXT[])
  - `clinical_note` (TEXT — full clinical narrative)
  - `length_of_stay` (integer, days)
  - `discharge_status` (string)
  - `outcome_class` (string)
  - `complexity_score` (integer)
  - `organization_id` (UUID — multi-tenant isolation, nullable for MIMIC reference data)
  - `created_at`, `updated_at` (timestamps)
- PostgreSQL table `case_embeddings` stores vector embeddings:
  - `id` (UUID, primary key)
  - `case_id` (UUID, foreign key to `mimic_cases.id`)
  - `embedding` (vector[768] — BioBERT default, configurable)
  - `model` (string — embedding model identifier for future swaps)
  - `created_at` (timestamp)
- pgvector extension enabled on the database (already configured in `pgvector/pgvector:pg16` image)
- Schema fields are designed to match the existing `SimilarCaseOutput` type used by the frontend panel

### FR-3: BioBERT Embedding Pipeline
- Workers service (`services/workers/`) runs batch embedding job via BioBERT model through Mastra
- Reads unembedded cases from `mimic_cases` (where no matching `case_embeddings` row exists)
- Generates embeddings from clinical narrative (`clinical_note` field) via Mastra tool
- Stores embeddings in `case_embeddings` with model identifier for future swaps
- Supports incremental processing (only embeds cases without existing embeddings)
- Embedding model is swappable via Mastra model router — BioBERT is the default, changeable via environment variable
- Batch size is configurable via environment variable

### FR-4: Similar Case Search API
- `POST /cases/similar` endpoint in NestJS backend
- Accepts patient case data (demographics, symptoms, vitals, diagnoses, clinical note)
- Generates embedding for input via Mastra + BioBERT
- Runs pgvector cosine similarity search against `case_embeddings` table
- Returns ranked results with similarity score, case metadata, vitals, treatments, outcomes, diagnostics, and clinical notes
- Response format matches existing `SimilarCaseOutput` type to minimize frontend changes
- All queries scoped to authenticated user's organization

### FR-5: API Route Migration (Electron IPC → NestJS)
- The following disabled Next.js API routes are re-enabled as proper NestJS endpoints:
  - `GET /api/patients` → `GET /patients` (patient list with pagination)
  - `GET /api/patients/:id` → `GET /patients/:id` (patient detail)
  - `GET /api/case-details/:id` → `GET /cases/:id` (case detail)
  - `POST /api/similar-cases` → `POST /cases/similar` (similar case search)
  - `GET /api/export/database` → `GET /export/database` (database export)
  - `POST /api/local-embeddings` → `POST /embeddings` (manual embedding trigger)
- Old IPC call patterns (`window.electronAPI.*`) in frontend replaced with standard `fetch()` calls to backend via `BACKEND_URL` env var
- All old IPC reference comments cleaned up from codebase
- Frontend communicates with backend through service-to-service HTTP within Docker network (`http://backend:3000`) and via reverse proxy/external URL for browser

### FR-6: Mastra Workflow Migration
- Migrate business logic from 4 deprecated Genkit flows (`src/ai/flows/`) into Mastra workflows:
  - `analyze-patient-symptoms` → Mastra agent with symptom analysis tool (ICD-10 suggestions)
  - `enhance-notes` → Mastra workflow for SOAP note enhancement
  - `analyze-and-summarize` → Mastra workflow for patient condition summarization
  - `summarize-patient-condition` → Extended into existing `patient-analysis-agent`
- Existing Mastra agents (`patient-analysis-agent`, `soap-notes-agent`) extended with migrated logic
- Existing Mastra tools (`patient-search-tool`, `enhance-notes-tool`) retained and updated
- Delete `src/ai/` directory (Genkit) after migration is complete and tested
- AI provider remains swappable via Mastra model router (Google Gemini is default)

### FR-7: Frontend Integration
- Existing `SimilarCasesPanel.tsx` component adapted to call new NestJS API (`POST /cases/similar`) instead of Electron IPC
- Remove Electron IPC fallback code from frontend pages:
  - `dashboard/page.tsx` — replace `window.electronAPI.dataSource.getActiveStatus()` with backend fetch
  - `dashboard/patient/[id]/page.tsx` — replace `window.electronAPI.database.getPatient()` with backend fetch
  - `dashboard/archived/page.tsx` — replace `window.electronAPI.database.getArchivedPatients()` with backend fetch
- Frontend communicates with backend via `BACKEND_URL` environment variable
- All existing UI patterns, components, and styling preserved — only data source changes

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Embedding dimension | 768 (BioBERT default), configurable via `EMBEDDING_MODEL_DIMENSION` |
| Vector search latency | < 500ms for 10K case records |
| Embedding batch throughput | Process 10K cases in < 2 hours (configurable batch size) |
| Similar case API response | < 2s (includes on-demand embedding generation) |
| Monorepo build | Each service builds independently via Docker Compose |
| No data loss | All existing patient data, configurations, and UI patterns preserved |
| Database flexibility | `vitals` and `diagnostics` stored as JSONB for schema evolution without migrations |

## Acceptance Criteria

1. `docker compose up` starts all 5 services (frontend, backend, database, cache, workers) from `services/` directories
2. Frontend is accessible at `localhost:8080`, backend at `localhost:3000`
3. All 6 migrated API routes respond correctly with organization-scoped data
4. Similar case search returns ranked results from MIMIC-IV data matching `SimilarCaseOutput` format
5. No `window.electronAPI` references remain in frontend code
6. `src/ai/` (Genkit) directory deleted, all flows migrated to Mastra
7. Old `src/`, `backend/`, `workers/` directories at root removed — only `services/` structure remains
8. Workers service successfully generates embeddings for MIMIC-IV cases
9. Embedding model is swappable via Mastra model router (config-driven)
10. Existing `SimilarCasesPanel.tsx` renders results without modification to its visual design
11. Test coverage meets 80% threshold across new and modified code

## Out of Scope

- **Actual MIMIC-IV data loading** — The data import script and MIMIC-IV dataset loading is handled manually by the project owner. We provide the schema, seed script, and tooling.
- **Advanced AI workflow orchestration** — Complex multi-step AI workflows (multi-agent collaboration, RAG pipelines) are deferred to a future track.
- **Production deployment pipeline** — CI/CD, monitoring, and deployment automation are tracked in Track 4 (Production Hardening).
- **Advanced patient analytics** — Dashboard analytics, risk scoring, and trend visualization are deferred to a future track.
- **Schema evolution** — The MIMIC-IV column/field mapping may be adjusted as the project owner determines what data to ingest. The JSONB fields (`vitals`, `diagnostics`) support this flexibility without migrations.

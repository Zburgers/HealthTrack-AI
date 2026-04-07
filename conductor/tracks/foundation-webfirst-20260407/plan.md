# Track Plan: Foundation & Web-First Migration

## Phase 1: Immediate Cleanup & Housekeeping

- [ ] Task: Create comprehensive `.gitignore` covering build artifacts, compiled output, IDE files, OS files, env files, node_modules
- [ ] Task: Create `.env.example` template documenting all required environment variables
- [ ] Task: Move hardcoded Firebase credentials to `.env` references in `src/config/index.ts` and `src/vertex-ai/client/`
- [ ] Task: Delete all `.new`, `.backup`, `.old` files — compare and merge where needed
- [ ] Task: Remove compiled `electron/dist/` from git tracking (`git rm -r --cached electron/dist/`)
- [ ] Task: Delete deprecated test scripts at project root (`test-ipc-handlers*.js`, `test-mongodb-ipc.js`, `test-sqlite-db.js`, `test-soap-migration.mjs`)
- [ ] Task: Delete deprecated API routes (`src/app/api/patients/route.ts`, `src/app/api/test-db/`, `src/app/api/test-direct-db/`, `src/app/api/test-ipc-db/`)
- [ ] Task: Remove unused dependencies from `package.json` (`huggingface`, `task-master-ai`, `patch-package`, `@types/electron`, `@tailwindcss/line-clamp`, `axios`, `better-sqlite3`, `jest`, `genkit` packages)
- [ ] Task: Delete entire deprecated SQLite system (`src/lib/sqlite/`, `src/lib/db/sqlite-service.ts`, `src/lib/db/sqlite-utils.ts`, `src/components/examples/SQLiteExample.tsx`)
- [ ] Task: Delete duplicate files (`src/hooks/use-patients-ipc.ts` vs `src/hooks/use-patients.ts` — keep one), merge duplicate `isElectronEnvironment()` implementations
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Immediate Cleanup & Housekeeping' (Protocol in workflow.md)

---

## Phase 2: Electron Removal

- [ ] Task: Write Tests — Verify no frontend code depends on Electron IPC or `window.electronAPI`
- [ ] Task: Delete entire `electron/` directory (main process, preload, IPC handlers, DataSourceManager, compiled output)
- [ ] Task: Remove Electron-related npm scripts from `package.json` (`dev:electron`, `electron:dev`, `electron:pack`, `electron:build`)
- [ ] Task: Remove Electron-related dependencies from `package.json` (`electron`, `electron-builder`, `electron-rebuild`)
- [ ] Task: Clean up `next.config.ts` — remove Electron-specific settings (`output: 'standalone'` if only used for Electron)
- [ ] Task: Remove `src/lib/electron-utils.ts` and any remaining Electron references in frontend code
- [ ] Task: Update Dockerfile — remove Electron build stages if present
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Electron Removal' (Protocol in workflow.md)

---

## Phase 3: Docker Compose Infrastructure

- [ ] Task: Write Tests — Verify `docker compose config` validates successfully, health checks pass for all services
- [ ] Task: Create `Dockerfile` for frontend (Next.js) — multi-stage build with production optimization
- [ ] Task: Create `Dockerfile` for backend (NestJS) — multi-stage build with production optimization
- [ ] Task: Create `Dockerfile` for workers — background job processor
- [ ] Task: Create `docker-compose.yml` with all services: `frontend`, `backend`, `database` (PostgreSQL + pgvector), `cache` (Redis), `workers`
- [ ] Task: Create `docker-compose.override.yml` for local development (hot reload, debug ports, seed data)
- [ ] Task: Configure health checks for all services in compose file
- [ ] Task: Configure restart policies, resource limits, and network isolation
- [ ] Task: Create initialization scripts (`docker compose up` workflow, database migration runner, seed data runner)
- [ ] Task: Test full `docker compose up` — all services start, communicate, and health checks pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Docker Compose Infrastructure' (Protocol in workflow.md)

---

## Phase 4: Database Schema & NestJS Backend Setup

- [ ] Task: Write Tests — Verify database connection, migration runner, and basic CRUD operations
- [ ] Task: Initialize NestJS project structure in `backend/` directory
- [ ] Task: Configure Drizzle ORM with PostgreSQL — schema definitions, migration setup
- [ ] Task: Define database schema: `organizations`, `users`, `patients` tables with organization-scoped row-level isolation
- [ ] Task: Create Drizzle migration files for schema creation
- [ ] Task: Implement NestJS modules: `AuthModule`, `UsersModule`, `PatientsModule`, `DatabaseModule`
- [ ] Task: Implement NestJS guards: organization-scoped request validation
- [ ] Task: Create seed script with sample organizations, users, and patients for development
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Database Schema & NestJS Backend Setup' (Protocol in workflow.md)

---

## Phase 5: Authentication & Organization Setup

- [ ] Task: Write Tests — Verify Firebase OAuth flow, organization auto-creation, session management, protected routes
- [ ] Task: Configure Firebase Google OAuth in backend — verify ID tokens, extract user info
- [ ] Task: Implement auto-organization creation on first user login
- [ ] Task: Implement session management with Redis-backed sessions
- [ ] Task: Create NestJS auth endpoints: `/auth/login`, `/auth/callback`, `/auth/logout`, `/auth/me`
- [ ] Task: Create NestJS organization endpoints (scoped to authenticated user's org)
- [ ] Task: Implement RBAC guard — role-based access control for routes
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Authentication & Organization Setup' (Protocol in workflow.md)

---

## Phase 6: Patient Management API

- [ ] Task: Write Tests — Verify patient CRUD operations, organization scoping, fuzzy search, pagination
- [ ] Task: Implement patient list endpoint with pagination and organization scoping
- [ ] Task: Implement patient detail endpoint (GET /patients/:id)
- [ ] Task: Implement patient create/update/delete endpoints with organization validation
- [ ] Task: Implement fuzzy patient search endpoint (search by name)
- [ ] Task: Add Zod validation to all patient API request/response bodies
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Patient Management API' (Protocol in workflow.md)

---

## Phase 7: Frontend Pages & Auth Integration

- [ ] Task: Write Tests — Verify login flow, dashboard renders patient list, search works, mobile responsive
- [ ] Task: Create login page with Google OAuth button and redirect handling
- [ ] Task: Create auth context/provider — track authentication state and organization
- [ ] Task: Create layout with auth guard — redirects to login if unauthenticated
- [ ] Task: Create dashboard page — patient list with search, organization-scoped data
- [ ] Task: Create patient detail page — display patient information
- [ ] Task: Ensure mobile-responsive design across all pages
- [ ] Task: Replace all `console.log` with proper logging in frontend
- [ ] Task: Conductor - User Manual Verification 'Phase 7: Frontend Pages & Auth Integration' (Protocol in workflow.md)

---

## Phase 8: Mastra Integration Scaffolding & Testing

- [ ] Task: Install and configure Mastra framework in backend
- [ ] Task: Create Mastra project structure — agents, workflows, tools directories
- [ ] Task: Configure Mastra model router with abstracted AI provider configuration
- [ ] Task: Set up Mastra Studio access for development testing
- [ ] Task: **DEFERRED**: Actual AI workflow implementation (requires manual MIMIC-IV setup by project owner)
- [ ] Task: Configure Vitest for unit and component tests across frontend and backend
- [ ] Task: Configure Supertest for NestJS API integration tests
- [ ] Task: Write initial test suite — aim for 80% coverage threshold
- [ ] Task: Verify all tests pass, coverage meets threshold, build succeeds
- [ ] Task: Conductor - User Manual Verification 'Phase 8: Mastra Integration Scaffolding & Testing' (Protocol in workflow.md)

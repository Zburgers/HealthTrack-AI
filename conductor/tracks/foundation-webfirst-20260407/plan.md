# Track Plan: Foundation & Web-First Migration

## Phase 1: Immediate Cleanup & Housekeeping

- [x] Task: Create comprehensive `.gitignore` covering build artifacts, compiled output, IDE files, OS files, env files, node_modules
- [x] Task: Create `.env.example` template documenting all required environment variables
- [x] Task: Move hardcoded Firebase credentials to `.env` references in `src/config/index.ts` and `src/vertex-ai/client/`
- [x] Task: Delete all `.new`, `.backup`, `.old` files — compare and merge where needed
- [x] Task: Remove compiled `electron/dist/` from git tracking (`git rm -r --cached electron/dist/`)
- [x] Task: Delete deprecated test scripts at project root (`test-ipc-handlers*.js`, `test-mongodb-ipc.js`, `test-sqlite-db.js`, `test-soap-migration.mjs`)
- [x] Task: Delete deprecated API routes (`src/app/api/patients/route.ts`, `src/app/api/test-db/`, `src/app/api/test-direct-db/`, `src/app/api/test-ipc-db/`)
- [x] Task: Remove unused dependencies from `package.json` (`huggingface`, `task-master-ai`, `patch-package`, `@types/electron`, `@tailwindcss/line-clamp`, `axios`, `better-sqlite3`, `jest`, `genkit` packages)
- [x] Task: Delete entire deprecated SQLite system (`src/lib/sqlite/`, `src/lib/db/sqlite-service.ts`, `src/lib/db/sqlite-utils.ts`, `src/components/examples/SQLiteExample.tsx`)
- [x] Task: Delete duplicate files (`src/hooks/use-patients-ipc.ts` vs `src/hooks/use-patients.ts` — keep one), merge duplicate `isElectronEnvironment()` implementations
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Immediate Cleanup & Housekeeping' (Protocol in workflow.md)

---

## Phase 2: Electron Removal

- [x] Task: Write Tests — Verify no frontend code depends on Electron IPC or `window.electronAPI`
- [x] Task: Delete entire `electron/` directory (main process, preload, IPC handlers, DataSourceManager, compiled output)
- [x] Task: Remove Electron-related npm scripts from `package.json` (`dev:electron`, `electron:dev`, `electron:pack`, `electron:build`)
- [x] Task: Remove Electron-related dependencies from `package.json` (`electron`, `electron-builder`, `electron-rebuild`)
- [x] Task: Clean up `next.config.ts` — remove Electron-specific settings (`output: 'standalone'` if only used for Electron)
- [x] Task: Remove `src/lib/electron-utils.ts` and any remaining Electron references in frontend code
- [x] Task: Update Dockerfile — remove Electron build stages if present
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Electron Removal' (Protocol in workflow.md)

---

## Phase 3: Docker Compose Infrastructure

- [ ] Task: Write Tests — Verify `docker compose config` validates successfully, health checks pass for all services
- [x] Task: Create `Dockerfile` for frontend (Next.js) — multi-stage build with production optimization
- [x] Task: Create `Dockerfile` for backend (NestJS) — multi-stage build with production optimization
- [x] Task: Create `Dockerfile` for workers — background job processor (uses same backend image with worker flag)
- [x] Task: Create `docker-compose.yml` with all services: `frontend`, `backend`, `database` (PostgreSQL + pgvector), `cache` (Redis), `workers`
- [x] Task: Create `docker-compose.override.yml` for local development (hot reload, debug ports, seed data)
- [x] Task: Configure health checks for all services in compose file
- [x] Task: Configure restart policies, resource limits, and network isolation
- [x] Task: Create initialization scripts (`docker compose up` workflow, database migration runner, seed data runner)
- [ ] Task: Test full `docker compose up` — all services start, communicate, and health checks pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Docker Compose Infrastructure' (Protocol in workflow.md)

---

## Phase 4: Database Schema & NestJS Backend Setup

- [ ] Task: Write Tests — Verify database connection, migration runner, and basic CRUD operations
- [x] Task: Initialize NestJS project structure in `backend/` directory
- [x] Task: Configure Drizzle ORM with PostgreSQL — schema definitions, migration setup
- [x] Task: Define database schema: `organizations`, `users`, `patients` tables with organization-scoped row-level isolation
- [x] Task: Create Drizzle migration files for schema creation (drizzle.config.ts + schema.ts ready for `drizzle-kit generate`)
- [x] Task: Implement NestJS modules: `AuthModule`, `UsersModule`, `PatientsModule`, `DatabaseModule`
- [x] Task: Implement NestJS guards: organization-scoped request validation (JwtAuthGuard, OrgScopedGuard stubs)
- [x] Task: Create seed script with sample organizations, users, and patients for development
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Database Schema & NestJS Backend Setup' (Protocol in workflow.md)

---

## Phase 5: Authentication & Organization Setup (Clerk)

- [ ] Task: Write Tests — Verify Clerk OAuth flow, org membership, protected routes, token verification
- [ ] Task: Install Clerk skills — `npx skills add clerk/skills --all` (DONE — 18 skills installed)
- [ ] Task: Install `@clerk/nextjs` in frontend — wrap root layout with `<ClerkProvider>`
- [ ] Task: Configure Clerk environment variables — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- [ ] Task: Replace login page with Clerk SignIn component (Google OAuth via Clerk social connections)
- [ ] Task: Rewrite `use-auth.ts` hook — use Clerk's `useUser()` internally, keep `{ user, loading, error }` interface
- [ ] Task: Update `AuthListener.tsx` — use Clerk auth state for route guarding
- [ ] Task: Add `<OrganizationSwitcher>` to Header for org switching
- [ ] Task: Install `@clerk/backend` in NestJS backend — server-side token verification via JWKS
- [ ] Task: Remove Firebase deps from backend — `firebase-admin`, `passport`, `passport-jwt`
- [ ] Task: Create `ClerkStrategy` — Passport-style strategy using Clerk JWKS verification
- [ ] Task: Implement real `JwtAuthGuard` — verify Clerk session tokens
- [ ] Task: Implement real `OrgScopedGuard` — extract `org_id` from Clerk token claims, enforce org scoping
- [ ] Task: Rewrite `auth.service.ts` — `verifyClerkToken()` replacing stub Firebase verification
- [ ] Task: Update auth controller endpoints (`/auth/verify`, `/auth/me`) for Clerk user model
- [ ] Task: Implement RBAC guard using Clerk org roles (admin, member, guest)
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Authentication & Organization Setup (Clerk)' (Protocol in workflow.md)

---

## Phase 6: Patient Management API & Database Migration

- [ ] Task: Write Tests — Verify patient CRUD operations, org scoping via Clerk tokens, fuzzy search, pagination
- [ ] Task: Create Drizzle migration — rename `firebase_uid` → `clerk_user_id` in users table
- [ ] Task: Create Drizzle migration — drop `users.organization_id` column and FK constraint
- [ ] Task: Create Drizzle migration — drop `organizations` table entirely
- [ ] Task: Create Drizzle migration — change `patients.organization_id` from UUID FK to TEXT (Clerk org ID)
- [ ] Task: Update indexes — rename `firebaseUidUniqueIdx` → `clerkUserIdUniqueIdx`, drop obsolete org indexes
- [ ] Task: Update seed script — remove org creation, use Clerk test org ID placeholder for patient data
- [ ] Task: Run migrations against PostgreSQL database
- [x] Task: Patient list endpoint with pagination (DONE — placeholder org ID, needs Clerk wiring)
- [x] Task: Patient detail endpoint (DONE — placeholder org ID, needs Clerk wiring)
- [x] Task: Patient CRUD endpoints (DONE — placeholder org ID, needs Clerk wiring)
- [x] Task: Fuzzy search endpoint (DONE — uses `ilike`, needs Clerk wiring)
- [ ] Task: Wire all patient endpoints to extract `organizationId` from Clerk token instead of placeholder
- [ ] Task: Add Zod validation to all patient API request/response bodies
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Patient Management API & Database Migration' (Protocol in workflow.md)

---

## Phase 7: Frontend Pages & Clerk Auth Integration

- [ ] Task: Write Tests — Verify login flow, dashboard renders patient list, search works, mobile responsive
- [ ] Task: Delete `src/lib/firebase.ts` — remove Firebase initialization entirely
- [ ] Task: Update `src/config/index.ts` — remove Firebase config block, keep Clerk publishable key
- [ ] Task: Update `src/app/layout.tsx` — wrap with `<ClerkProvider>`
- [ ] Task: Ensure login page uses Clerk SignIn with Google OAuth (social connection configured in Clerk dashboard)
- [ ] Task: Update auth context/provider — Clerk-based auth state tracking
- [ ] Task: Update layout with auth guard — Clerk route protection, redirect to login if unauthenticated
- [ ] Task: Update dashboard page — patient list with search, Clerk org-scoped data
- [ ] Task: Update patient detail page — display patient information
- [ ] Task: Ensure mobile-responsive design across all pages
- [ ] Task: Replace all `console.log` with proper logging in frontend
- [ ] Task: Update API hooks (`use-patients.ts`) to send Clerk JWT in Authorization header on all requests
- [ ] Task: Remove remaining `window.electronAPI` guards (dead code, harmless but clean up)
- [ ] Task: Conductor - User Manual Verification 'Phase 7: Frontend Pages & Clerk Auth Integration' (Protocol in workflow.md)

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

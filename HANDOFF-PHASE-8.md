# Handoff: Phase 8 — Mastra Integration & Testing

## Context
**Track:** Foundation & Web-First Migration  
**Branch:** `dev/cleanup-2026`  
**Last Commit:** `a9d8192` — docs(phase7): update track plan — mark Phase 7 core tasks complete  
**Previous Handoff:** `HANDOFF-20260407.md`

---

## Current State

### What's Done (Phases 5-7)
| Component | Status | Details |
|-----------|--------|---------|
| Clerk Auth (Backend) | ✅ Complete | `ClerkAuthGuard`, `OrgScopedGuard`, `RoleGuard`, `verifyToken()` from `@clerk/backend` |
| Clerk Auth (Frontend) | ✅ Complete | `<ClerkProvider>`, `clerkMiddleware`, `useAuth()` hook, `<SignInButton>`, `<OrganizationSwitcher>` |
| Database Migration | ✅ Complete | Dropped `organizations` table, `users.organization_id` FK removed, `patients.organization_id` → VARCHAR(255) for Clerk org IDs |
| Patient API | ✅ Complete | CRUD endpoints wired to Clerk org-scoped guards, Zod/class-validator DTOs |
| Frontend Firebase Removal | ✅ Complete | `firebase.ts` deleted, `config/index.ts` Clerk-only, `use-patients.ts` fetches from NestJS with Clerk JWT |
| Backend Tests | ✅ 19 tests passing | 7 auth service tests + 12 patient service tests (TDD) |
| Backend Build | ✅ Succeeds | `npm run build` passes cleanly |

### What Still Exists (To Be Addressed in Phase 8)
| Component | Location | Status |
|-----------|----------|--------|
| `src/ai/flows/*` | Frontend | Genkit AI flows — working but using hardcoded risk scores. **Will be replaced by Mastra in Phase 8.** |
| `src/vertex-ai/*` | Frontend | Vertex AI client — working. **Will be replaced by Mastra model routing in Phase 8.** |
| `src/app/api/v2/*` | Frontend | AI API routes — working. **Will be migrated to NestJS backend in Phase 8.** |
| Genkit packages | Frontend `package.json` | Still installed. **Will be replaced by Mastra packages in Phase 8.** |
| `window.electronAPI` guards | Various components | Dead code, evaluates to `false`. **Cleanup deferred — low priority.** |
| `console.log` statements | Frontend | Scattered throughout components. **Cleanup deferred — low priority.** |

---

## Phase 8: Mastra Integration Scaffolding & Testing

### Tasks

#### 8.1 Mastra Setup (Backend)
- [ ] Install `mastra` and related packages in `backend/`
- [ ] Create `backend/src/mastra/` directory structure:
  - `agents/` — clinical analysis agents
  - `workflows/` — symptom analysis, SOAP notes, similar cases
  - `tools/` — reusable AI tools (ICD-10 lookup, patient search, etc.)
  - `models/` — model router configuration
- [ ] Configure Mastra model router with Google Gemini provider
- [ ] Set up Mastra Studio for development
- [ ] Wire Mastra into NestJS module system

#### 8.2 AI Workflow Migration
- [ ] Port existing Genkit flows (`analyze-patient-symptoms`, `summarize-patient-condition`, `enhance-notes`) to Mastra workflows
- [ ] Update frontend AI API routes (`/api/v2/*`) to call NestJS backend Mastra endpoints instead of Genkit
- [ ] Remove Genkit packages from frontend `package.json`
- [ ] Remove `src/ai/` directory after migration
- [ ] Remove `src/vertex-ai/` directory after migration

#### 8.3 Testing Infrastructure
- [ ] Configure Vitest for frontend unit/component tests
- [ ] Configure Supertest for NestJS API integration tests
- [ ] Write integration tests for patient CRUD endpoints (Supertest)
- [ ] Write integration tests for auth endpoints (Supertest)
- [ ] Write component tests for Clerk auth flows (Testing Library)
- [ ] Achieve 80% test coverage threshold

#### 8.4 Verification
- [ ] All tests pass (frontend + backend)
- [ ] Test coverage meets 80% threshold
- [ ] Backend build succeeds
- [ ] Frontend build succeeds
- [ ] End-to-end flow: login → dashboard → patient CRUD works

---

## How to Continue

### Prerequisites
```bash
# Ensure PostgreSQL is running
docker compose up -d database

# Backend dependencies installed
cd backend && npm install

# Frontend dependencies installed
npm install
```

### Start Development
```bash
# Start backend
cd backend && npm run start:dev

# Start frontend (in separate terminal)
npm run dev
```

### Priority Order for Phase 8
1. **Testing infrastructure first** — Supertest + Vitest config, write integration tests for existing endpoints
2. **Mastra scaffolding** — install, create structure, configure model router
3. **AI workflow migration** — port Genkit → Mastra (deferred actual AI implementation)
4. **Frontend cleanup** — remove Genkit/Vertex AI packages, remove dead code
5. **Coverage verification** — ensure 80% threshold met

---

## Known Issues

1. **Genkit packages still in frontend** — `@genkit-ai/*` packages installed, imported in `src/ai/flows/*`. These work but are technical debt. Will be removed in Phase 8.
2. **Frontend AI routes still use Genkit** — `/api/v2/analyze-and-summarize`, `/api/v2/enhance-notes` call Genkit directly. Will be migrated to call NestJS Mastra endpoints.
3. **`window.electronAPI` guards** — ~30 references across settings/setup components. Harmless (always `false`), but should be cleaned up eventually. Low priority.
4. **`console.log` statements** — scattered in frontend components. Should use proper logger. Low priority.
5. **No frontend tests yet** — Vitest not configured for frontend components. Phase 8 will set this up.
6. **Clerk org creation** — user must create an org in Clerk dashboard before first login, or use the `<OrganizationSwitcher>` to create one on first sign-in.

---

## Key Files

### Backend
- `backend/src/auth/guards/clerk-auth.guard.ts` — Clerk JWT verification
- `backend/src/auth/guards/org-scoped.guard.ts` — org scoping from token
- `backend/src/patients/patients.controller.ts` — Clerk-scoped patient CRUD
- `backend/src/patients/dto/patient.dto.ts` — Zod validation DTOs
- `backend/drizzle/schema.ts` — Clerk org schema (no orgs table)
- `backend/drizzle/migrations/0001_clerk_orgs_migration.sql` — migration from custom orgs → Clerk

### Frontend
- `src/middleware.ts` — Clerk route protection
- `src/app/layout.tsx` — `<ClerkProvider>` wrapper
- `src/hooks/use-auth.ts` — Clerk `useUser()` / `useAuth()` wrapper
- `src/hooks/use-patients.ts` — fetch from NestJS with Clerk JWT
- `src/app/login/page.tsx` — `<SignInButton>` with Google OAuth
- `src/components/layout/Header.tsx` — `<OrganizationSwitcher>`

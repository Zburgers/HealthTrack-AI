# Track Spec: Foundation & Web-First Migration

## Overview

Establish the foundational infrastructure for HealthTrack AI as a web-first, self-hosted SaaS application. This track removes Electron technical debt, establishes clean Docker Compose infrastructure, implements authentication with organization-scoped access, and delivers basic patient management with PostgreSQL.

## Acceptance Criteria

### 1. Immediate Cleanup
- [ ] `.gitignore` covers all build artifacts, compiled output, IDE files, OS files, env files
- [ ] All hardcoded Firebase credentials moved to `.env` with `.env.example` template
- [ ] All hardcoded secrets removed from source code
- [ ] `.new`, `.backup`, `.old` files eliminated — originals updated or deleted
- [ ] Compiled `electron/dist/` removed from git tracking
- [ ] Deprecated test scripts at project root moved to `tests/` or deleted
- [ ] Unused dependencies removed from `package.json`

### 2. Electron Removal
- [ ] `electron/` directory and all Electron-related files deleted
- [ ] `electron-builder`, `electron-rebuild`, `@types/electron` removed from dependencies
- [ ] All Electron-related npm scripts removed from `package.json`
- [ ] Next.js config updated — no Electron-specific settings
- [ ] `isElectronEnvironment()` implementations removed from frontend code

### 3. Docker Compose Infrastructure
- [ ] `docker-compose.yml` defines all services: `frontend`, `backend`, `database`, `cache`, `workers`
- [ ] `Dockerfile` for frontend (Next.js) — production-optimized multi-stage build
- [ ] `Dockerfile` for backend (NestJS) — production-optimized multi-stage build
- [ ] `Dockerfile` for workers — background job processor
- [ ] `docker-compose.yml` includes health checks, restart policies, resource limits
- [ ] `docker-compose.override.yml` for local development overrides
- [ ] `docker compose up` starts all services and they communicate correctly
- [ ] `.env` file template documents all required environment variables

### 4. Authentication & Organization Setup (Clerk)
- [ ] Clerk Google OAuth configured via social connections in Clerk dashboard (no hardcoded credentials)
- [ ] User signs in with Google via Clerk → Clerk handles org membership and roles
- [ ] Clerk Organizations — org membership, roles (admin, member, guest), org switching via `<OrganizationSwitcher>`
- [ ] Protected routes — unauthenticated users redirected to `/login` via Clerk auth guards
- [ ] Clerk organization ID (`org_id`) extracted from JWT token and attached to every backend request
- [ ] Backend token verification via `@clerk/backend` JWKS verification (not stub)
- [ ] `users` table: `firebase_uid` renamed to `clerk_user_id` (varchar 255, unique index)
- [ ] `organizations` table dropped — Clerk owns org metadata
- [ ] `users.organization_id` FK dropped — org scoping via Clerk token's `org_id` claim
- [ ] All data-scoped tables (`patients`, etc.) use `organization_id` as TEXT (populated from Clerk org ID)

### 5. Database & Patient Management
- [ ] PostgreSQL schema defined with Drizzle ORM
- [ ] `users` table — id, email, clerk_user_id (unique), name, role, created_at
- [ ] `patients` table — id, organization_id (TEXT, from Clerk org), name, dob, gender, created_at, updated_at
- [ ] All tables include `organization_id` for row-level multi-tenant isolation (populated from Clerk token)
- [ ] Database migration system configured (Drizzle Kit) — migration from Firebase → Clerk schema
- [ ] Patient CRUD API endpoints (NestJS) — all scoped to authenticated user's Clerk organization
- [ ] Patient search (fuzzy search by name)
- [ ] Patient list endpoint with pagination
- [ ] Patient detail endpoint
- [ ] Seed script with sample data for development (Clerk test org ID)

### 6. Frontend (Next.js)
- [ ] Next.js App Router with Server Components by default
- [ ] `<ClerkProvider>` wraps root layout
- [ ] Login page with Clerk SignIn component (Google OAuth via Clerk social connection)
- [ ] Dashboard page — shows patient list with search, Clerk org-scoped data
- [ ] Patient detail page — shows patient information
- [ ] Layout with Clerk auth guard (redirects to login if unauthenticated)
- [ ] `<OrganizationSwitcher>` in header for org switching
- [ ] `useAuth()` hook — Clerk-based, returns `{ user, loading, error }` interface
- [ ] All API requests to NestJS backend include Clerk JWT in Authorization header
- [ ] Clean, minimalist, modern design maintained
- [ ] Mobile-responsive design
- [ ] No Firebase imports remaining in frontend code

### 7. Mastra Integration (Scaffolding Only)
- [ ] Mastra package installed and configured
- [ ] Basic Mastra project structure created
- [ ] AI provider configuration abstracted (swappable via Mastra model router)
- [ ] AI workflow directory structure ready
- [ ] **Deferred**: Actual AI workflows (symptom analysis, SOAP notes, similar cases) — requires manual database setup and MIMIC-IV data loading by the project owner

### 8. Testing
- [ ] Vitest configured for unit and component tests
- [ ] Testing Library configured for React component tests
- [ ] Supertest configured for NestJS API integration tests
- [ ] Test coverage meets 80% threshold
- [ ] CI pipeline runs tests on every commit

## Out of Scope (Deferred to Future Tracks)
- AI-powered clinical analysis workflows (symptom analysis, SOAP note generation, ICD-10 suggestions)
- Similar cases intelligence (pgvector setup, MIMIC-IV embedding)
- Advanced patient analytics and dashboards
- Email notifications, audit logging, advanced RBAC
- E2E testing with Playwright
- Production deployment pipeline

## Constraints
- All data must be organization-scoped (multi-tenant isolation)
- No hardcoded secrets — all configuration via environment variables
- TypeScript strict mode — no `any` types
- Test coverage minimum 80%
- Follow TypeScript and React style guides in `conductor/code_styleguides/`
- Follow product guidelines in `conductor/product-guidelines.md`

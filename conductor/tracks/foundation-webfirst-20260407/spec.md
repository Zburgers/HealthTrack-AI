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

### 4. Authentication & Organization Setup
- [ ] Firebase Google OAuth configured via environment variables (no hardcoded credentials)
- [ ] User signs in with Google → organization auto-created on first login
- [ ] Role-based access control (RBAC) — roles: `org_admin`, `doctor`, `nurse`
- [ ] Session management with Redis-backed sessions
- [ ] Protected routes — unauthenticated users redirected to login
- [ ] Organization ID attached to every authenticated request

### 5. Database & Patient Management
- [ ] PostgreSQL schema defined with Drizzle ORM
- [ ] `organizations` table — id, name, created_at, updated_at
- [ ] `users` table — id, email, firebase_uid, role, organization_id, created_at
- [ ] `patients` table — id, organization_id, name, dob, gender, created_at, updated_at
- [ ] All tables include `organization_id` for row-level multi-tenant isolation
- [ ] Database migration system configured (Drizzle Kit)
- [ ] Patient CRUD API endpoints (NestJS) — all scoped to authenticated user's organization
- [ ] Patient search (fuzzy search by name)
- [ ] Patient list endpoint with pagination
- [ ] Patient detail endpoint
- [ ] Seed script with sample data for development

### 6. Frontend (Next.js)
- [ ] Next.js App Router with Server Components by default
- [ ] Login page with Google OAuth button
- [ ] Dashboard page — shows patient list with search
- [ ] Patient detail page — shows patient information
- [ ] Layout with auth guard (redirects to login if unauthenticated)
- [ ] Clean, minimalist, modern design maintained
- [ ] Mobile-responsive design

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

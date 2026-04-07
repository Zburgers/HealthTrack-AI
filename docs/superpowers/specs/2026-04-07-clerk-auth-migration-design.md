# Design: Firebase → Clerk Authentication Migration

**Date:** 2026-04-07
**Track:** Foundation & Web-First Migration
**Status:** Approved

---

## Overview

Migrate authentication from Firebase Auth to Clerk (Full Organizations model). This replaces all Firebase auth SDK usage, custom organization management, and stub JWT verification with Clerk's managed auth solution including built-in organization membership, roles, and switching.

**Approach:** Full Clerk Organizations (Approach A) — Clerk owns org metadata, membership, and roles. Database drops custom `organizations` table; all data-scoped tables (`patients`, etc.) reference Clerk org IDs directly.

---

## Architecture

### Frontend (Next.js)

| Component | Current (Firebase) | After (Clerk) |
|-----------|-------------------|---------------|
| Auth Provider | `firebase/app` + `firebase/auth` | `@clerk/nextjs` `<ClerkProvider>` |
| Auth Hook | `src/hooks/use-auth.ts` — `onAuthStateChanged` | Same interface, internals use Clerk's `useUser()` |
| Login Page | `src/app/login/page.tsx` — `signInWithPopup` | Clerk `<SignInButton>` with Google OAuth |
| Auth Guard | `src/components/auth/AuthListener.tsx` | Clerk `useAuth()` + redirect logic |
| Org Switching | None (custom org selection) | Clerk `<OrganizationSwitcher>` |
| Config | `src/config/index.ts` — Firebase config | Clerk publishable key only |

**Preserved interfaces:** The `useAuth()` hook returns `{ user, loading, error }` — same shape. Downstream components (Header, MainLayout, settings) require minimal changes.

### Backend (NestJS)

| Component | Current (Firebase) | After (Clerk) |
|-----------|-------------------|---------------|
| Token Verification | Stub base64 decode (no real verification) | `@clerk/backend` `verifyToken()` via JWKS |
| Passport Strategy | `FirebaseStrategy` (passport-jwt, shared secret) | `ClerkStrategy` (Clerk JWKS verification) |
| JWT Guard | `JwtAuthGuard` — stub (checks header exists) | Real verification of Clerk session JWT |
| Org Guard | `OrgScopedGuard` — stub (checks `user?.organizationId`) | Extracts `org_id` from Clerk token claims |
| Auth Service | `verifyFirebaseToken()` | `verifyClerkToken()` |
| User Lookup | `firebaseUid` column | `clerkUserId` column |

### Database Schema Changes

**Current schema:**
```
organizations (id, name, timestamps)
users (id, email, firebase_uid, name, role, organization_id FK→organizations, timestamps)
patients (id, organization_id FK, ...data fields, timestamps)
```

**New schema:**
```
users (id, email, clerk_user_id, name, role, timestamps)
patients (id, organization_id TEXT, ...data fields, timestamps)
```

**Changes:**
- `users.firebase_uid` → `users.clerk_user_id` (rename column, keep unique index)
- `users.organization_id` → dropped (FK removed)
- `organizations` table → dropped entirely (Clerk owns org metadata)
- `patients.organization_id` → changed from UUID FK to TEXT (stores Clerk org ID)
- All other data-scoped tables keep `organization_id` as TEXT (populated from Clerk token's `org_id` claim)

### Environment Variables

**Removed:**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
GCLOUD_PROJECT
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
JWT_SECRET
```

**Added:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_SIGN_IN_URL=/login
CLERK_SIGN_UP_URL=/signup
```

---

## Data Flow

1. **Login:** User clicks "Sign in with Google" → Clerk handles OAuth → Clerk sets session cookies → redirects to `/dashboard`
2. **Frontend API calls:** `useUser().getToken()` retrieves Clerk JWT → attached to `Authorization: Bearer <clerk_jwt>` header on all requests to NestJS backend
3. **Backend verification:** `JwtAuthGuard` → `ClerkStrategy.validate()` → verifies JWT signature via Clerk JWKS endpoint → extracts `userId`, `orgId`, `email`, `role`
4. **Org scoping:** `OrgScopedGuard` reads `request.user.orgId` → controller uses it in all queries: `where(organization_id: orgId)`
5. **Patient CRUD:** Same endpoints, same Drizzle queries. `organizationId` comes from Clerk token instead of placeholder UUID
6. **AI flows:** Unchanged — receive patient data from API, no auth coupling

**Key invariant:** All existing AI flows, prompts, patient analysis logic, and Vertex AI calls remain untouched. Only the auth layer and org ID sourcing change.

---

## Implementation Phases

### Phase 1: Frontend Clerk Setup
- Install `@clerk/nextjs` package
- Add Clerk environment variables to `.env` and `.env.example`
- Wrap root layout with `<ClerkProvider>`
- Replace `src/app/login/page.tsx` with Clerk SignIn component (preserve UI wrapper)
- Rewrite `src/hooks/use-auth.ts` to use Clerk's `useUser()` internally
- Update `src/components/auth/AuthListener.tsx` to use Clerk auth state
- Add `<OrganizationSwitcher>` to Header component
- Remove `src/lib/firebase.ts` entirely

### Phase 2: Backend Clerk Integration
- Install `@clerk/backend` package
- Remove `firebase-admin`, `passport`, `passport-jwt` from `backend/package.json`
- Rewrite `backend/src/auth/auth.service.ts` — `verifyClerkToken()` using Clerk JWKS verification
- Create `ClerkStrategy` in `backend/src/auth/strategies/clerk.strategy.ts`
- Implement real `JwtAuthGuard` — verifies Clerk session tokens
- Implement real `OrgScopedGuard` — extracts `org_id` from token, enforces org scoping
- Update `backend/src/auth/auth.module.ts` — replace Firebase providers with Clerk providers
- Update auth controller endpoints (`/auth/verify`, `/auth/me`) to use Clerk user model

### Phase 3: Database Migration
- Create Drizzle migration: rename `firebase_uid` → `clerk_user_id`
- Create Drizzle migration: drop `users.organization_id` column and FK
- Create Drizzle migration: drop `organizations` table
- Create Drizzle migration: change `patients.organization_id` from UUID FK to TEXT
- Update indexes: rename `firebaseUidUniqueIdx` → `clerkUserIdUniqueIdx`, drop `orgRoleUniqueIdx`
- Update seed script: remove org creation, use Clerk test org ID placeholder for patient data
- Generate and run migrations against PostgreSQL

### Phase 4: Frontend-Backend Wiring
- Update API hooks (`use-patients.ts`) to send Clerk JWT in Authorization header
- Ensure all API calls to NestJS backend include `Bearer <token>`
- Replace remaining `AuthListener` logic with Clerk-based route guards
- Verify Header component shows Clerk `OrganizationSwitcher`
- Remove all Firebase imports from frontend `package.json`
- Clean up any remaining `window.electronAPI` guards (harmless but dead code)

### Phase 5: Cleanup & Verification
- Delete all Firebase-related files: `src/lib/firebase.ts`, `src/config/index.ts` Firebase block
- Update `.env.example` with Clerk variables, remove all Firebase variables
- Update `HANDOFF-20260407.md` to reflect Clerk auth
- Verify all patient endpoints work with real org scoping from Clerk tokens
- Test end-to-end flow: login → dashboard → patient list → patient detail → CRUD operations
- Update conductor track plan and spec

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No org selected | Clerk forces org creation/selection before accessing protected routes |
| Token expired | Clerk auto-refreshes JWTs; backend returns 401 → frontend redirects to login |
| Org permission denied | Backend returns 403 if user's org doesn't match requested resource's org |
| Multi-org user | Clerk handles org switching; backend validates `org_id` on every request |
| Local dev without Clerk | Clerk test mode with mock tokens for local development |

---

## Out of Scope

- Firebase Cloud Messaging / push notifications (not in current scope)
- Migration of existing Firebase users (no production users to migrate yet)
- Mastra AI framework integration (deferred to Phase 8)
- Advanced RBAC beyond Clerk org roles (deferred)
- E2E testing with Playwright (deferred)

---

## Files Modified

### Frontend
- `src/lib/firebase.ts` → DELETED
- `src/hooks/use-auth.ts` → REWRITTEN
- `src/app/login/page.tsx` → REWRITTEN
- `src/components/auth/AuthListener.tsx` → UPDATED
- `src/components/layout/Header.tsx` → UPDATED (add OrganizationSwitcher)
- `src/config/index.ts` → UPDATED (remove Firebase config)
- `src/app/layout.tsx` → UPDATED (add ClerkProvider)
- `.env` → UPDATED
- `.env.example` → UPDATED
- `package.json` → UPDATED (remove Firebase, add Clerk)

### Backend
- `backend/src/auth/auth.service.ts` → REWRITTEN
- `backend/src/auth/auth.controller.ts` → UPDATED
- `backend/src/auth/auth.module.ts` → UPDATED
- `backend/src/auth/strategies/firebase.strategy.ts` → DELETED
- `backend/src/auth/strategies/clerk.strategy.ts` → NEW
- `backend/src/auth/guards/jwt-auth.guard.ts` → REWRITTEN
- `backend/src/auth/guards/org-scoped.guard.ts` → REWRITTEN
- `backend/drizzle/schema.ts` → UPDATED
- `backend/drizzle/seed.ts` → UPDATED
- `backend/package.json` → UPDATED
- `backend/.env.example` → UPDATED
- `backend/drizzle/migrations/*` → NEW (migration files)

---

## Required Clerk Keys

The following keys are needed from the Clerk dashboard:

1. **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** — Frontend Clerk SDK key (safe to expose in browser)
2. **`CLERK_SECRET_KEY`** — Backend secret key for token verification and Clerk API calls (NEVER expose)

Both keys are available at https://dashboard.clerk.com → Your App → API Keys.

Google OAuth (Sign in with Google) will be configured in the Clerk dashboard under User Authentication → Social Connections.

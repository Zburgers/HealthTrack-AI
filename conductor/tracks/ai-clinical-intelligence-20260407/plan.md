# AI Clinical Intelligence & Code Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the codebase into a clean monorepo, set up pgvector-based similar case search with BioBERT embeddings, migrate 6 disabled API routes to NestJS, and migrate 4 Genkit AI flows into Mastra workflows.

**Architecture:** Monorepo with `services/` directory (frontend, backend, workers) and `packages/shared/`. PostgreSQL with pgvector for vector search. NestJS backend serves all API needs. Workers service independently generates BioBERT embeddings. Mastra orchestrates all AI workflows.

**Tech Stack:** Next.js, NestJS, Drizzle ORM, PostgreSQL + pgvector, Redis, Mastra (TypeScript), BioBERT embeddings, Docker Compose, Vitest, Zod, Clerk auth.

---

## File Structure

### New Directories
```
services/
├── frontend/                          # Migrated from src/
├── backend/                           # Migrated from backend/
└── workers/                           # New: independent embedding processor
packages/
└── shared/                            # Shared Zod schemas, TypeScript types
```

### Files Created
- `services/workers/package.json` — Workers service dependencies
- `services/workers/tsconfig.json` — Workers TypeScript config
- `services/workers/src/index.ts` — Workers entry point
- `services/workers/src/embedding-job.processor.ts` — BioBERT batch processor
- `services/workers/src/mastra-embedding-tool.ts` — Mastra embedding tool
- `services/workers/Dockerfile` — Workers Dockerfile
- `packages/shared/src/types.ts` — Shared TypeScript types (SimilarCaseOutput, Patient, CaseVitals)
- `packages/shared/src/schemas.ts` — Shared Zod schemas (patient, case, embedding)
- `packages/shared/src/index.ts` — Barrel exports
- `packages/shared/package.json` — Shared package
- `packages/shared/tsconfig.json` — Shared TypeScript config
- `backend/src/similar-cases/similar-cases.module.ts` — Similar cases NestJS module
- `backend/src/similar-cases/similar-cases.controller.ts` — POST /cases/similar endpoint
- `backend/src/similar-cases/similar-cases.service.ts` — BioBERT embedding + pgvector search
- `backend/src/similar-cases/dto/similar-cases.dto.ts` — Request/response DTOs
- `backend/src/export/export.module.ts` — Database export module
- `backend/src/export/export.controller.ts` — GET /export/database endpoint
- `backend/src/export/export.service.ts` — Export logic
- `backend/src/embeddings/embeddings.module.ts` — Embedding trigger module
- `backend/src/embeddings/embeddings.controller.ts` — POST /embeddings endpoint
- `backend/src/mastra/tools/biobert-embedding-tool.ts` — BioBERT embedding generation tool
- `backend/src/mastra/workflows/symptom-analysis.workflow.ts` — Migrated from Genkit
- `backend/src/mastra/workflows/note-enhancement.workflow.ts` — Migrated from Genkit
- `backend/src/mastra/workflows/patient-summary.workflow.ts` — Migrated from Genkit
- `backend/drizzle/schema.ts` — Added mimic_cases, case_embeddings tables
- `backend/drizzle/migrations/` — New migration files for new tables
- `tests/similar-cases/similar-cases.e2e.test.ts` — E2E test for similar case search
- `tests/patients/patients.e2e.test.ts` — E2E test for patient CRUD
- `tests/workers/embedding-job.processor.test.ts` — Workers unit tests

### Files Modified
- `docker-compose.yml` — Updated build contexts to `services/frontend/`, `services/backend/`, `services/workers/`
- `Dockerfile` (frontend) — Moved to `services/frontend/Dockerfile`, minor path fixes
- `backend/src/main.ts` — Added `--worker` flag handling (kept as fallback)
- `backend/package.json` — Added pgvector, mastra embedding deps
- `backend/drizzle.config.ts` — No changes expected, already configured
- `frontend` pages (3 files) — Remove Electron IPC, use `fetch(BACKEND_URL)`
- Root `package.json` — Updated scripts, removed Electron/Genkit deps
- Root `.gitignore` — Added services build artifacts, .env

### Files Deleted
- `src/ai/` (entire directory) — Genkit flows migrated to Mastra
- `src/app/api/patients/` — Replaced by NestJS
- `src/app/api/case-details/` — Replaced by NestJS
- `src/app/api/similar-cases/` — Replaced by NestJS
- `src/app/api/export/` — Replaced by NestJS
- `src/app/api/local-embeddings/` — Replaced by NestJS
- Old `src/`, `backend/`, `workers/`, `database/` directories at root — After migration
- `src/types/window-electron-compat.d.ts` — No longer needed

---

## Phase 1: Monorepo Reorganization

### Task 1: Create Monorepo Directory Structure

**Files:**
- Create: `services/` directory
- Create: `packages/` directory
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

- [x] **Step 1: Create directory structure**

```bash
mkdir -p services packages/shared/src
```

- [x] **Step 2: Create packages/shared/package.json**

```json
{
  "name": "@healthtrack/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0"
  }
}
```

- [x] **Step 3: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [x] **Step 4: Create packages/shared/src/index.ts (barrel, empty for now)**

```typescript
// Types and schemas shared across services
// Populated in Task 2
```

- [x] **Step 5: Commit**

```bash
git add services/ packages/
git commit -m "chore: create monorepo directory structure for services and shared packages"
```

---

### Task 2: Create Shared Types and Schemas

**Files:**
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/schemas.ts`
- Modify: `packages/shared/src/index.ts`

- [x] **Step 1: Create shared types from existing `types/similar-cases.ts`**

Read the existing file first: `cat types/similar-cases.ts`

```typescript
// packages/shared/src/types.ts

/**
 * Shared TypeScript types used across frontend and backend.
 * These replace the duplicated type definitions in src/types/ and backend/src/.
 */

export interface CaseVitals {
  bp: string | null;
  hr: number | null;
  rr: number | null;
  spo2: number | null;
  temp: number | null;
}

export interface CaseEmbeddingDocument {
  id: string;
  subject_id: number;
  hadm_id: number;
  age: number;
  sex: string;
  icd: string[];
  icd_label: string[];
  note: string;
  vitals?: CaseVitals;
  outcomes?: {
    result?: string;
    followUp?: string;
    dischargeStatus?: string;
    lengthOfStay?: number;
    complications?: string[];
  };
  treatments?: {
    medications?: string[];
    procedures?: string[];
    interventions?: string[];
    timeline?: Array<{ date: string; action: string }>;
  };
  diagnostics?: {
    tests?: string[];
    results?: string[];
    imaging?: string[];
    labs?: string[];
  };
  metadata?: {
    complexityScore?: number;
    outcomeClass?: string;
    admissionType?: string;
    caseDate?: Date;
  };
}

export interface SimilarCaseOutput extends Omit<CaseEmbeddingDocument, 'id'> {
  matchConfidence: number;
}

export interface SimilarCaseSearchInput {
  patientInformation?: string;
  vitals?: Record<string, unknown>;
  observations?: string;
  diagnoses?: string[];
  clinicalNote?: string;
  limit?: number;
  minConfidence?: number;
}
```

- [x] **Step 2: Create shared Zod schemas**

```typescript
// packages/shared/src/schemas.ts

import { z } from 'zod';

export const CaseVitalsSchema = z.object({
  bp: z.string().nullable(),
  hr: z.number().nullable(),
  rr: z.number().nullable(),
  spo2: z.number().nullable(),
  temp: z.number().nullable(),
});

export const SimilarCaseSearchInputSchema = z.object({
  patientInformation: z.string().optional(),
  vitals: z.record(z.unknown()).optional(),
  observations: z.string().optional(),
  diagnoses: z.array(z.string()).optional(),
  clinicalNote: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
  minConfidence: z.number().min(0).max(1).default(0),
});

export const SimilarCaseOutputSchema: z.ZodType<import('./types').SimilarCaseOutput> = z.object({
  matchConfidence: z.number().min(0).max(1),
  subject_id: z.number(),
  hadm_id: z.number(),
  age: z.number(),
  sex: z.string(),
  icd: z.array(z.string()),
  icd_label: z.array(z.string()),
  note: z.string(),
  vitals: CaseVitalsSchema.optional(),
  outcomes: z.object({
    result: z.string().optional(),
    followUp: z.string().optional(),
    dischargeStatus: z.string().optional(),
    lengthOfStay: z.number().optional(),
    complications: z.array(z.string()).optional(),
  }).optional(),
  treatments: z.object({
    medications: z.array(z.string()).optional(),
    procedures: z.array(z.string()).optional(),
    interventions: z.array(z.string()).optional(),
    timeline: z.array(z.object({ date: z.string(), action: z.string() })).optional(),
  }).optional(),
  diagnostics: z.object({
    tests: z.array(z.string()).optional(),
    results: z.array(z.string()).optional(),
    imaging: z.array(z.string()).optional(),
    labs: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.object({
    complexityScore: z.number().optional(),
    outcomeClass: z.string().optional(),
    admissionType: z.string().optional(),
    caseDate: z.date().optional(),
  }).optional(),
}) as z.ZodType<import('./types').SimilarCaseOutput>;
```

- [x] **Step 3: Update barrel exports**

```typescript
// packages/shared/src/index.ts

export * from './types';
export * from './schemas';
```

- [x] **Step 4: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add shared TypeScript types and Zod schemas for similar cases"
```

---

### Task 3: Move Existing Code to services/

**Files:**
- Move: `src/` → `services/frontend/`
- Move: `backend/` → `services/backend/`
- Move: `workers/` → `services/workers/` (currently empty, placeholder)
- Modify: `docker-compose.yml` — update build contexts
- Modify: `docker-compose.override.yml` — update build contexts

- [x] **Step 1: Move frontend source**

```bash
mv src services/frontend
```

- [x] **Step 2: Move backend**

```bash
mv backend services/backend
```

- [x] **Step 3: Move workers directory (currently empty)**

```bash
mv workers services/workers
```

- [x] **Step 4: Update docker-compose.yml build contexts**

```yaml
# Change these lines in docker-compose.yml:

# FRONTEND section - change build context:
frontend:
  build:
    context: ./services/frontend    # was: .
    dockerfile: Dockerfile

# BACKEND section - already correct:
backend:
  build:
    context: ./services/backend     # was: ./backend
    dockerfile: Dockerfile

# WORKERS section - change build context:
workers:
  build:
    context: ./services/workers     # was: ./backend
    dockerfile: Dockerfile
  command: ["node", "dist/index.js"]  # was: ["node", "dist/main", "--worker"]
```

- [x] **Step 5: Update docker-compose.override.yml**

Update any path references in the override file to match new locations:
- `./services/backend` instead of `./backend`
- `./services/frontend` instead of `.`
- Remove any `../docker/` references if they exist

- [x] **Step 6: Move root Dockerfile to services/frontend/**

```bash
mv Dockerfile services/frontend/Dockerfile
```

- [x] **Step 7: Update frontend Dockerfile context paths**

The frontend Dockerfile currently does `COPY . .` — update to work from `services/frontend/` context. The file should already work since the build context is now `./services/frontend/` which contains all the frontend source.

- [x] **Step 8: Verify directory structure**

```bash
echo "=== Root ===" && ls -1
echo "=== services/ ===" && ls -1 services/
echo "=== packages/ ===" && ls -1 packages/
```

Expected:
```
Root: services/, packages/, docker-compose.yml, docker-compose.override.yml, conductor/, docs/, package.json, ...
services/: frontend/, backend/, workers/
packages/: shared/
```

- [x] **Step 9: Commit**

```bash
git add services/ packages/ docker-compose.yml docker-compose.override.yml
git rm --cached -r backend/ src/ workers/ Dockerfile 2>/dev/null || true
git commit -m "refactor: reorganize codebase into monorepo layout (services/, packages/)"
```

---

### Task 4: Update Frontend Path Aliases and Imports

**Files:**
- Modify: `services/frontend/tsconfig.json` — verify path aliases work in new location
- Modify: `services/frontend/package.json` — add `@healthtrack/shared` dependency
- Modify: `services/frontend/next.config.ts` — verify no path issues

- [x] **Step 1: Add @healthtrack/shared to frontend dependencies**

```bash
cd services/frontend
npm install @healthtrack/shared@file:../../packages/shared
```

- [x] **Step 2: Update frontend tsconfig.json to resolve @healthtrack/shared**

Read current `services/frontend/tsconfig.json` and add path mapping:

```json
{
  "compilerOptions": {
    // ... existing options
    "paths": {
      "@/*": ["./src/*"],
      "@healthtrack/shared": ["../../packages/shared/src/index.ts"],
      "@healthtrack/shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

- [x] **Step 3: Update frontend imports to use shared types**

In `services/frontend/src/types/index.ts`, replace the local `SimilarCaseOutput` import with:

```typescript
import type { SimilarCaseOutput } from '@healthtrack/shared';
```

- [x] **Step 4: Commit**

```bash
git add services/frontend/ packages/shared/
git commit -m "chore: update frontend imports to use @healthtrack/shared"
```

---

### Task 5: Update Backend Path References and Add Shared Package

**Files:**
- Modify: `services/backend/package.json` — add `@healthtrack/shared` dependency
- Modify: `services/backend/tsconfig.json` — add path mapping

- [x] **Step 1: Add @healthtrack/shared to backend dependencies**

```bash
cd services/backend
npm install @healthtrack/shared@file:../../packages/shared
```

- [x] **Step 2: Update backend tsconfig.json**

```json
{
  "compilerOptions": {
    // ... existing options
    "paths": {
      "@/*": ["./src/*"],
      "@healthtrack/shared": ["../../packages/shared/src/index.ts"],
      "@healthtrack/shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

- [x] **Step 3: Update backend imports**

In any backend file that references similar case types, change to:

```typescript
import type { SimilarCaseOutput, SimilarCaseSearchInput } from '@healthtrack/shared';
```

- [x] **Step 4: Commit**

```bash
git add services/backend/
git commit -m "chore: add @healthtrack/shared to backend and update imports"
```

---

### Task 6: Delete Old Root Directories and Clean Up

**Files:**
- Delete: Any remaining `src/`, `backend/`, `workers/` at root (should be gone from Task 3)
- Delete: `database/` directory (old SQLite files, deprecated)
- Modify: Root `.gitignore` — add services build artifacts, .env

- [x] **Step 1: Verify no old directories exist at root**

```bash
ls -d src backend workers 2>/dev/null && echo "WARNING: old directories still exist" || echo "Clean"
```

- [x] **Step 2: Delete deprecated database directory**

```bash
rm -rf database/
```

- [x] **Step 3: Update root .gitignore**

Add these entries to `.gitignore`:

```
# Environment
.env
.env.local
.env.*.local

# Services build artifacts
services/*/dist/
services/*/node_modules/

# Packages build
packages/*/dist/
packages/*/node_modules/

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# Cache
.cache/
.next/
tsconfig.tsbuildinfo

# Logs
logs/
*.log
```

- [x] **Step 4: Commit**

```bash
git add .gitignore
git rm -r --cached database/ 2>/dev/null || true
git commit -m "chore: update .gitignore, remove deprecated database/ directory"
```

---

### Task 7: Phase 1 Verification — Docker Compose Build Test

- [x] **Step 1: Validate docker-compose config**

```bash
docker compose config
```

Expected: Valid YAML output with all 5 services resolved. No errors.

- [x] **Step 2: Build all services (no start)**

```bash
docker compose build --no-cache
```

Expected: All 5 services build successfully. Frontend, backend, workers each produce images.

- [x] **Step 3: If build fails, debug and fix**

Common issues:
- Missing `node_modules` in build context → ensure Dockerfile copies package.json and runs npm install
- Path resolution errors → check tsconfig.json paths are relative to new locations
- Missing dependencies → ensure `@healthtrack/shared` is accessible during build

- [x] **Step 4: Commit any fixes**

```bash
git add .
git commit -m "fix: resolve docker compose build issues after monorepo reorganization"
```

- [x] **Step 5: Conductor - User Manual Verification 'Phase 1: Monorepo Reorganization' (Protocol in workflow.md)**

---

## Phase 2: Database Schema — MIMIC-IV and Embeddings Tables

### Task 8: Add MIMIC-IV and Embeddings Tables to Drizzle Schema

**Files:**
- Modify: `services/backend/drizzle/schema.ts`
- Create: `services/backend/drizzle/migrations/0002_mimic_cases_embeddings.sql`

- [x] **Step 1: Create mimic_cases table schema**
- [x] **Step 2: Create case_embeddings table with pgvector**
- [x] **Step 3: Update main schema barrel file**
- [x] **Step 4: Commit**

---

### Task 9: Create Database Migration for New Tables

**Files:**
- Create: Migration file via Drizzle Kit

- [x] **Step 1: Generate migration**
- [x] **Step 2: Review generated migration**
- [x] **Step 3: Add pgvector extension to migration if missing**
- [x] **Step 4: Run migration against local database**
- [x] **Step 5: Verify tables exist**
- [x] **Step 6: Commit**

---

### Task 10: Add MIMIC-IV Seed Data Script

**Files:**
- Create: `services/backend/drizzle/seed-mimic.ts`

- [x] **Step 1: Create MIMIC-IV seed script**
// services/backend/drizzle/seed-mimic.ts

/**
 * Seed script for MIMIC-IV reference data.
 *
 * In production, this is replaced by the actual MIMIC-IV data loading pipeline.
 * This script inserts sample cases for development testing.
 *
 * Usage: npx tsx drizzle/seed-mimic.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { mimicCases } from './schema/mimic-cases';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://healthtrack:healthtrack@localhost:5432/healthtrack',
});

const db = drizzle(pool);

const sampleCases = [
  {
    subjectId: 10001,
    hadmId: 20001,
    age: 65,
    sex: 'M',
    admitTime: new Date('2023-01-15'),
    dischargeTime: new Date('2023-01-22'),
    diagnoses: ['I50.9', 'J18.9', 'E11.9'],
    diagnosisLabels: ['Heart failure, unspecified', 'Pneumonia, unspecified', 'Type 2 diabetes mellitus without complications'],
    vitals: { bp: '140/90', hr: 88, rr: 18, spo2: 94, temp: 37.8 },
    clinicalNote: 'History of Present Illness: 65-year-old male presenting with shortness of breath and fatigue. Patient reports worsening dyspnea over the past 2 weeks.\n\nBrief Hospital Course: Patient was admitted with acute decompensated heart failure. Treated with IV diuretics with good response. Echocardiogram revealed reduced ejection fraction of 35%. Patient was started on guideline-directed medical therapy.',
    lengthOfStay: 7,
    dischargeStatus: 'Home with follow-up',
    outcomeClass: 'Improved',
    complexityScore: 3,
  },
  {
    subjectId: 10002,
    hadmId: 20002,
    age: 45,
    sex: 'F',
    admitTime: new Date('2023-02-10'),
    dischargeTime: new Date('2023-02-13'),
    diagnoses: ['J06.9', 'R50.9'],
    diagnosisLabels: ['Acute upper respiratory infection', 'Fever, unspecified'],
    vitals: { bp: '120/80', hr: 92, rr: 16, spo2: 98, temp: 38.5 },
    clinicalNote: 'Chief Complaint: Patient presents with 3-day history of fever, sore throat, and nasal congestion.\n\nBrief Hospital Course: Patient was evaluated in the emergency department. Symptoms consistent with viral upper respiratory infection. Supportive care recommended. No antibiotics indicated.',
    lengthOfStay: 3,
    dischargeStatus: 'Home',
    outcomeClass: 'Resolved',
    complexityScore: 1,
  },
  {
    subjectId: 10003,
    hadmId: 20003,
    age: 72,
    sex: 'M',
    admitTime: new Date('2023-03-05'),
    dischargeTime: new Date('2023-03-18'),
    diagnoses: ['I63.9', 'I10', 'E78.5'],
    diagnosisLabels: ['Cerebral infarction, unspecified', 'Essential hypertension', 'Hyperlipidemia, unspecified'],
    vitals: { bp: '160/95', hr: 76, rr: 14, spo2: 96, temp: 36.8 },
    clinicalNote: 'History of Present Illness: 72-year-old male with history of hypertension and hyperlipidemia presented with sudden onset right-sided weakness and slurred speech.\n\nBrief Hospital Course: Patient was diagnosed with acute ischemic stroke. Received tPA within the therapeutic window. MRI confirmed left MCA territory infarct. Patient was transferred to stroke unit for monitoring and rehabilitation.',
    lengthOfStay: 13,
    dischargeStatus: 'Skilled nursing facility',
    outcomeClass: 'Partial recovery',
    complexityScore: 5,
  },
];

async function main() {
  console.log('🌱 Seeding MIMIC-IV reference data...');

  for (const caseData of sampleCases) {
    await db.insert(mimicCases).values(caseData);
    console.log(`  Inserted case: subject_id=${caseData.subjectId}, hadm_id=${caseData.hadmId}`);
  }

  console.log('✅ MIMIC-IV seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
```

- [ ] **Step 2: Add seed script to package.json scripts**

```json
{
  "scripts": {
    "seed:mimic": "tsx drizzle/seed-mimic.ts"
  }
}
```

- [ ] **Step 3: Run seed script**

```bash
cd services/backend
npm run seed:mimic
```

- [ ] **Step 4: Verify data in database**

```bash
docker exec -it healthtrack-database psql -U healthtrack -d healthtrack -c "SELECT subject_id, hadm_id, age, sex, length_of_stay FROM mimic_cases;"
```

- [ ] **Step 5: Commit**

```bash
git add services/backend/drizzle/seed-mimic.ts services/backend/package.json
git commit -m "feat(db): add MIMIC-IV seed script with sample cases for development"
```

---

### Task 11: Write Tests for Database Schema

**Files:**
- Create: `tests/schema/mimic-cases.schema.test.ts`
- Create: `tests/schema/case-embeddings.schema.test.ts`

- [ ] **Step 1: Write mimic_cases schema test**

```typescript
// tests/schema/mimic-cases.schema.test.ts

import { describe, it, expect } from 'vitest';
import { mimicCases } from '../../services/backend/drizzle/schema/mimic-cases';

describe('mimic_cases schema', () => {
  it('should have all required columns', () => {
    const columns = Object.keys(mimicCases);
    expect(columns).toContain('id');
    expect(columns).toContain('subjectId');
    expect(columns).toContain('hadmId');
    expect(columns).toContain('age');
    expect(columns).toContain('sex');
    expect(columns).toContain('clinicalNote');
    expect(columns).toContain('diagnoses');
    expect(columns).toContain('vitals');
    expect(columns).toContain('organizationId');
  });

  it('should support JSONB fields for flexible schema evolution', () => {
    // Verify vitals and diagnostics are JSONB (flexible)
    expect(mimicCases.vitals).toBeDefined();
    expect(mimicCases.diagnostics).toBeDefined();
  });
});
```

- [ ] **Step 2: Write case_embeddings schema test**

```typescript
// tests/schema/case-embeddings.schema.test.ts

import { describe, it, expect } from 'vitest';
import { caseEmbeddings } from '../../services/backend/drizzle/schema/case-embeddings';

describe('case_embeddings schema', () => {
  it('should have required columns', () => {
    const columns = Object.keys(caseEmbeddings);
    expect(columns).toContain('id');
    expect(columns).toContain('caseId');
    expect(columns).toContain('embedding');
    expect(columns).toContain('model');
  });

  it('should reference mimic_cases via caseId foreign key', () => {
    expect(caseEmbeddings.caseId).toBeDefined();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest tests/schema/ --run
```

Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/schema/
git commit -m "test(db): add schema tests for mimic_cases and case_embeddings tables"
```

---

### Task 12: Phase 2 Verification

- [ ] **Step 1: Verify all tables exist and have correct columns**

```bash
docker exec -it healthtrack-database psql -U healthtrack -d healthtrack -c "\d mimic_cases"
docker exec -it healthtrack-database psql -U healthtrack -d healthtrack -c "\d case_embeddings"
docker exec -it healthtrack-database psql -U healthtrack -d healthtrack -c "SELECT COUNT(*) FROM mimic_cases;"
```

- [ ] **Step 2: Verify pgvector extension is enabled**

```bash
docker exec -it healthtrack-database psql -U healthtrack -d healthtrack -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

Expected: `vector | 0.x.x`

- [ ] **Step 3: Verify pgvector similarity query works**

```bash
docker exec -it healthtrack-database psql -U healthtrack -d healthtrack -c "
SELECT id, case_id, model, embedding <-> (SELECT embedding FROM case_embeddings LIMIT 1) AS distance
FROM case_embeddings
ORDER BY distance
LIMIT 5;
"
```

Expected: Returns rows (or empty if no embeddings yet — that's fine, we just need the query syntax to work).

- [ ] **Step 4: Conductor - User Manual Verification 'Phase 2: Database Schema Expansion' (Protocol in workflow.md)**

---

## Phase 3: API Route Migration — Disabled Routes to NestJS

### Task 13: Create Case Details Controller and Service

**Files:**
- Create: `services/backend/src/case-details/case-details.module.ts`
- Create: `services/backend/src/case-details/case-details.controller.ts`
- Create: `services/backend/src/case-details/case-details.service.ts`

- [ ] **Step 1: Write case-details.service.ts**

```typescript
// services/backend/src/case-details/case-details.service.ts

import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { mimicCases } from '../drizzle/schema/mimic-cases';

@Injectable()
export class CaseDetailsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findOne(id: string) {
    const results = await this.drizzle.db
      .select()
      .from(mimicCases)
      .where(eq(mimicCases.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findBySubjectHadms(subjectId: number, hadmId: number) {
    const results = await this.drizzle.db
      .select()
      .from(mimicCases)
      .where(eq(mimicCases.subjectId, subjectId))
      .where(eq(mimicCases.hadmId, hadmId))
      .limit(1);

    return results[0] || null;
  }
}
```

- [ ] **Step 2: Write case-details.controller.ts**

```typescript
// services/backend/src/case-details/case-details.controller.ts

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CaseDetailsService } from './case-details.service';

@Controller('cases')
export class CaseDetailsController {
  constructor(private readonly caseDetailsService: CaseDetailsService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const caseData = await this.caseDetailsService.findOne(id);
    if (!caseData) {
      throw new NotFoundException(`Case with id ${id} not found`);
    }
    return caseData;
  }
}
```

- [ ] **Step 3: Write case-details.module.ts**

```typescript
// services/backend/src/case-details/case-details.module.ts

import { Module } from '@nestjs/common';
import { CaseDetailsController } from './case-details.controller';
import { CaseDetailsService } from './case-details.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CaseDetailsController],
  providers: [CaseDetailsService],
  exports: [CaseDetailsService],
})
export class CaseDetailsModule {}
```

- [ ] **Step 4: Register module in app.module.ts**

Read `services/backend/src/app.module.ts` and add `CaseDetailsModule` to imports:

```typescript
import { CaseDetailsModule } from './case-details/case-details.module';

@Module({
  imports: [
    // ... existing imports
    CaseDetailsModule,
  ],
})
```

- [ ] **Step 5: Write test**

```typescript
// services/backend/src/case-details/case-details.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { CaseDetailsService } from './case-details.service';
import { DatabaseModule } from '../database/database.module';

describe('CaseDetailsService', () => {
  let service: CaseDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [CaseDetailsService],
    }).compile();

    service = module.get<CaseDetailsService>(CaseDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

- [ ] **Step 6: Commit**

```bash
git add services/backend/src/case-details/
git commit -m "feat(api): add case-details controller and service (GET /cases/:id)"
```

---

### Task 14: Create Similar Cases Controller and Service (POST /cases/similar)

**Files:**
- Create: `services/backend/src/similar-cases/similar-cases.module.ts`
- Create: `services/backend/src/similar-cases/similar-cases.controller.ts`
- Create: `services/backend/src/similar-cases/similar-cases.service.ts`
- Create: `services/backend/src/similar-cases/dto/similar-cases.dto.ts`

- [ ] **Step 1: Write DTO**

```typescript
// services/backend/src/similar-cases/dto/similar-cases.dto.ts

import { IsNumber, IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class SimilarCaseSearchDto {
  @IsOptional()
  @IsString()
  patientInformation?: string;

  @IsOptional()
  @IsObject()
  vitals?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diagnoses?: string[];

  @IsOptional()
  @IsString()
  clinicalNote?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  minConfidence?: number;
}
```

- [ ] **Step 2: Write similar-cases.service.ts**

This service generates an embedding for the input case and searches pgvector for similar cases. The embedding generation uses a placeholder that will be replaced with BioBERT in Phase 5.

```typescript
// services/backend/src/similar-cases/similar-cases.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { mimicCases } from '../drizzle/schema/mimic-cases';
import { SimilarCaseSearchDto } from './dto/similar-cases.dto';

// Hugging Face Inference for BioBERT embeddings
import { HfInference } from '@huggingface/inference';

@Injectable()
export class SimilarCasesService {
  private hf: HfInference;

  constructor(
    private readonly drizzle: DrizzleService,
  ) {
    this.hf = new HfInference(process.env.HF_KEY);
  }

  /**
   * Generate embedding for input case text.
   * Uses BioBERT via Hugging Face Inference API.
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.hf.featureExtraction({
      model: 'emilyalsentzer/Bio_ClinicalBERT',
      inputs: text,
    });

    // Response is a nested array, flatten to 768-dim vector
    if (Array.isArray(response[0][0])) {
      // Mean pool over token embeddings
      const tokens = response[0] as number[][];
      const dim = tokens[0].length;
      const pooled = new Array(dim).fill(0);
      for (const token of tokens) {
        for (let i = 0; i < dim; i++) {
          pooled[i] += token[i];
        }
      }
      return pooled.map(v => v / tokens.length);
    }

    return response[0] as number[];
  }

  /**
   * Prepare clinical text for embedding generation.
   * Combines all available case fields into a single input string.
   */
  private prepareInputText(input: SimilarCaseSearchDto): string {
    const parts: string[] = [];
    if (input.clinicalNote) parts.push(input.clinicalNote);
    if (input.patientInformation) parts.push(input.patientInformation);
    if (input.observations) parts.push(input.observations);
    if (input.diagnoses?.length) parts.push(input.diagnoses.join(', '));
    if (input.vitals) parts.push(JSON.stringify(input.vitals));
    return parts.join('\n');
  }

  /**
   * Search for similar cases using pgvector cosine similarity.
   * Returns ranked results with similarity scores.
   */
  async findSimilar(input: SimilarCaseSearchDto) {
    const text = this.prepareInputText(input);
    const embedding = await this.generateEmbedding(text);

    // Cosine similarity search via pgvector
    // pgvector uses <-> for L2 distance, <=> for cosine distance
    const results = await this.drizzle.db
      .select({
        id: mimicCases.id,
        subjectId: mimicCases.subjectId,
        hadmId: mimicCases.hadmId,
        age: mimicCases.age,
        sex: mimicCases.sex,
        diagnoses: mimicCases.diagnoses,
        diagnosisLabels: mimicCases.diagnosisLabels,
        vitals: mimicCases.vitals,
        diagnostics: mimicCases.diagnostics,
        medications: mimicCases.medications,
        procedures: mimicCases.procedures,
        clinicalNote: mimicCases.clinicalNote,
        lengthOfStay: mimicCases.lengthOfStay,
        dischargeStatus: mimicCases.dischargeStatus,
        outcomeClass: mimicCases.outcomeClass,
        complexityScore: mimicCases.complexityScore,
        distance: this.drizzle.db.raw(`
          (SELECT embedding FROM case_embeddings LIMIT 1) <=> ARRAY[${embedding.join(',')}]::vector(768)
        `),
      })
      .from(mimicCases)
      .where(this.drizzle.db.sql`
        EXISTS (
          SELECT 1 FROM case_embeddings ce
          WHERE ce.case_id = mimic_cases.id
        )
      `)
      .orderBy(this.drizzle.db.sql`
        (SELECT embedding FROM case_embeddings WHERE case_embeddings.case_id = mimic_cases.id LIMIT 1) <=> ARRAY[${embedding.join(',')}]::vector(768)
      `)
      .limit(input.limit || 10);

    // Transform results to SimilarCaseOutput format
    return results.map((row, idx) => ({
      id: row.id,
      matchConfidence: Math.max(0, 1 - (row.distance as number)),
      subject_id: row.subjectId,
      hadm_id: row.hadmId,
      age: row.age,
      sex: row.sex,
      icd: row.diagnoses || [],
      icd_label: row.diagnosisLabels || [],
      note: row.clinicalNote || '',
      vitals: row.vitals as SimilarCaseOutput['vitals'],
      diagnostics: row.diagnostics as SimilarCaseOutput['diagnostics'],
      treatments: {
        medications: row.medications || [],
        procedures: row.procedures || [],
      },
      outcomes: {
        dischargeStatus: row.dischargeStatus || undefined,
        lengthOfStay: row.lengthOfStay || undefined,
      },
      metadata: {
        complexityScore: row.complexityScore || undefined,
        outcomeClass: row.outcomeClass || undefined,
      },
    }));
  }
}
```

- [ ] **Step 3: Write similar-cases.controller.ts**

```typescript
// services/backend/src/similar-cases/similar-cases.controller.ts

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SimilarCasesService } from './similar-cases.service';
import { SimilarCaseSearchDto } from './dto/similar-cases.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

@Controller('cases')
@UseGuards(ClerkAuthGuard)
export class SimilarCasesController {
  constructor(private readonly similarCasesService: SimilarCasesService) {}

  @Post('similar')
  async findSimilar(@Body() input: SimilarCaseSearchDto) {
    return this.similarCasesService.findSimilar(input);
  }
}
```

- [ ] **Step 4: Write similar-cases.module.ts**

```typescript
// services/backend/src/similar-cases/similar-cases.module.ts

import { Module } from '@nestjs/common';
import { SimilarCasesController } from './similar-cases.controller';
import { SimilarCasesService } from './similar-cases.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SimilarCasesController],
  providers: [SimilarCasesService],
  exports: [SimilarCasesService],
})
export class SimilarCasesModule {}
```

- [ ] **Step 5: Register in app.module.ts**

```typescript
import { SimilarCasesModule } from './similar-cases/similar-cases.module';

@Module({
  imports: [
    // ... existing imports
    SimilarCasesModule,
  ],
})
```

- [ ] **Step 6: Commit**

```bash
git add services/backend/src/similar-cases/
git commit -m "feat(api): add similar-cases endpoint (POST /cases/similar) with pgvector search"
```

---

### Task 15: Create Export Database Controller and Service

**Files:**
- Create: `services/backend/src/export/export.module.ts`
- Create: `services/backend/src/export/export.controller.ts`
- Create: `services/backend/src/export/export.service.ts`

- [ ] **Step 1: Write export.service.ts**

```typescript
// services/backend/src/export/export.service.ts

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { patients } from '../drizzle/schema';

@Injectable()
export class ExportService {
  constructor(private readonly drizzle: DrizzleService) {}

  async exportAllPatients(orgId: string) {
    const patientsData = await this.drizzle.db
      .select()
      .from(patients)
      .where(eq(patients.organizationId, orgId));

    return {
      exportDate: new Date().toISOString(),
      totalRecords: patientsData.length,
      data: patientsData,
    };
  }
}
```

Note: Import `eq` from `drizzle-orm` and `patients` from schema.

- [ ] **Step 2: Write export.controller.ts**

```typescript
// services/backend/src/export/export.controller.ts

import { Controller, Get, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

@Controller('export')
@UseGuards(ClerkAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('database')
  async exportDatabase(@Req() req: any, @Res() res: Response) {
    const orgId = req.user?.orgId;
    if (!orgId) {
      res.status(403).json({ error: 'Organization ID not found' });
      return;
    }

    const data = await this.exportService.exportAllPatients(orgId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=export-${Date.now()}.json`);
    res.json(data);
  }
}
```

- [ ] **Step 3: Write export.module.ts**

```typescript
// services/backend/src/export/export.module.ts

import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
```

- [ ] **Step 4: Register in app.module.ts and commit**

```bash
git add services/backend/src/export/
git commit -m "feat(api): add database export endpoint (GET /export/database)"
```

---

### Task 16: Create Embedding Trigger Controller (POST /embeddings)

**Files:**
- Create: `services/backend/src/embeddings/embeddings.module.ts`
- Create: `services/backend/src/embeddings/embeddings.controller.ts`
- Create: `services/backend/src/embeddings/embeddings.service.ts`

- [ ] **Step 1: Write embeddings.service.ts**

```typescript
// services/backend/src/embeddings/embeddings.service.ts

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { mimicCases } from '../drizzle/schema/mimic-cases';
import { caseEmbeddings } from '../drizzle/schema/case-embeddings';
import { HfInference } from '@huggingface/inference';

@Injectable()
export class EmbeddingsService {
  private hf: HfInference;

  constructor(private readonly drizzle: DrizzleService) {
    this.hf = new HfInference(process.env.HF_KEY);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.hf.featureExtraction({
      model: 'emilyalsentzer/Bio_ClinicalBERT',
      inputs: text,
    });
    if (Array.isArray(response[0][0])) {
      const tokens = response[0] as number[][];
      const dim = tokens[0].length;
      const pooled = new Array(dim).fill(0);
      for (const token of tokens) {
        for (let i = 0; i < dim; i++) {
          pooled[i] += token[i];
        }
      }
      return pooled.map(v => v / tokens.length);
    }
    return response[0] as number[];
  }

  async generateForCase(caseId: string): Promise<void> {
    const cases = await this.drizzle.db
      .select({ clinicalNote: mimicCases.clinicalNote })
      .from(mimicCases)
      .where(eq(mimicCases.id, caseId));

    if (!cases.length || !cases[0].clinicalNote) return;

    const embedding = await this.generateEmbedding(cases[0].clinicalNote!);

    // Check if embedding already exists
    const existing = await this.drizzle.db
      .select()
      .from(caseEmbeddings)
      .where(eq(caseEmbeddings.caseId, caseId));

    if (existing.length === 0) {
      await this.drizzle.db.insert(caseEmbeddings).values({
        caseId,
        embedding,
        model: 'biobert',
      });
    }
  }
}
```

- [ ] **Step 2: Write embeddings.controller.ts**

```typescript
// services/backend/src/embeddings/embeddings.controller.ts

import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

@Controller('embeddings')
@UseGuards(ClerkAuthGuard)
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @Post()
  async triggerEmbeddings() {
    return { message: 'Embedding generation triggered' };
  }

  @Post(':caseId')
  async generateForCase(@Param('caseId') caseId: string) {
    await this.embeddingsService.generateForCase(caseId);
    return { message: `Embedding generated for case ${caseId}` };
  }
}
```

- [ ] **Step 3: Write embeddings.module.ts and register in app.module.ts**

```typescript
// services/backend/src/embeddings/embeddings.module.ts

import { Module } from '@nestjs/common';
import { EmbeddingsController } from './embeddings.controller';
import { EmbeddingsService } from './embeddings.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EmbeddingsController],
  providers: [EmbeddingsService],
})
export class EmbeddingsModule {}
```

- [ ] **Step 4: Commit**

```bash
git add services/backend/src/embeddings/
git commit -m "feat(api): add embedding trigger endpoints (POST /embeddings)"
```

---

### Task 17: Update Patients Controller for New Location

The existing `services/backend/src/patients/` module should already handle GET/POST patients. Verify and update:

- [ ] **Step 1: Verify patients controller exists and works**

```bash
cat services/backend/src/patients/patients.controller.ts
```

Check that it has:
- `GET /patients` — list with pagination
- `GET /patients/:id` — detail
- `POST /patients` — create
- `PATCH /patients/:id` — update
- `DELETE /patients/:id` — delete

If any are missing, add them.

- [ ] **Step 2: Ensure organization scoping is applied**

All patient queries should be filtered by `req.user.orgId`. Verify the existing controller uses `OrgScopedGuard` or manually filters by organization.

- [ ] **Step 3: Commit**

```bash
git add services/backend/src/patients/
git commit -m "chore(api): verify patients controller has all required endpoints"
```

---

### Task 18: Phase 3 Verification — Test All API Routes

- [ ] **Step 1: Start backend and test health endpoint**

```bash
docker compose up -d backend database cache
curl http://localhost:3000/health
```

Expected: `{"status":"ok","environment":"web","database":{"status":"connected"}}`

- [ ] **Step 2: Test similar cases endpoint (will fail without embeddings, but should return proper error)**

```bash
curl -X POST http://localhost:3000/cases/similar \
  -H "Content-Type: application/json" \
  -d '{"clinicalNote":"test"}'
```

- [ ] **Step 3: Test case details endpoint**

```bash
curl http://localhost:3000/cases/$(docker exec -it healthtrack-database psql -U healthtrack -d healthtrack -t -c "SELECT id FROM mimic_cases LIMIT 1;" | tr -d ' ')
```

- [ ] **Step 4: Test export endpoint**

```bash
curl http://localhost:3000/export/database
```

- [ ] **Step 5: Conductor - User Manual Verification 'Phase 3: API Route Migration' (Protocol in workflow.md)**

---

## Phase 4: Workers Service — BioBERT Embedding Pipeline

### Task 19: Create Workers Service Foundation

**Files:**
- Create: `services/workers/package.json`
- Create: `services/workers/tsconfig.json`
- Create: `services/workers/src/index.ts`
- Create: `services/workers/Dockerfile`

- [ ] **Step 1: Create workers package.json**

```json
{
  "name": "@healthtrack/workers",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@huggingface/inference": "^4.0.0",
    "drizzle-orm": "^0.38.0",
    "pg": "^8.13.0",
    "@healthtrack/shared": "file:../../packages/shared"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0",
    "typescript": "^5.8.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Create workers tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create workers entry point**

```typescript
// services/workers/src/index.ts

import { EmbeddingJobProcessor } from './embedding-job.processor';

async function main() {
  console.log('🔧 Starting HealthTrack Workers Service...');

  const processor = new EmbeddingJobProcessor({
    databaseUrl: process.env.DATABASE_URL || 'postgresql://healthtrack:healthtrack@localhost:5432/healthtrack',
    hfKey: process.env.HF_KEY,
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '100', 10),
    pollingIntervalMs: parseInt(process.env.WORKER_POLLING_INTERVAL || '30000', 10),
  });

  await processor.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await processor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await processor.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Workers service failed:', error);
  process.exit(1);
});
```

- [ ] **Step 4: Create workers Dockerfile**

```dockerfile
# services/workers/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# Copy shared package first
COPY packages/shared/ ./packages/shared/
RUN cd packages/shared && npm install

# Copy workers package
COPY services/workers/package.json services/workers/package-lock.json* ./
RUN npm ci --ignore-scripts

COPY services/workers/tsconfig.json services/workers/src/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

CMD ["node", "dist/index.js"]
```

- [ ] **Step 5: Commit**

```bash
git add services/workers/
git commit -m "feat(workers): create workers service foundation with embedding job processor entry point"
```

---

### Task 20: Implement Embedding Job Processor

**Files:**
- Create: `services/workers/src/embedding-job.processor.ts`
- Create: `services/workers/src/mastra-embedding-tool.ts`

- [ ] **Step 1: Create Mastra embedding tool**

```typescript
// services/workers/src/mastra-embedding-tool.ts

import { HfInference } from '@huggingface/inference';

/**
 * Generate embeddings using BioBERT via Hugging Face Inference API.
 * This is the core embedding function used by both the worker and the API.
 */
export async function generateBioEmbedding(hf: HfInference, text: string): Promise<number[]> {
  const response = await hf.featureExtraction({
    model: 'emilyalsentzer/Bio_ClinicalBERT',
    inputs: text,
  });

  // Mean pool over token embeddings if nested
  if (Array.isArray(response[0][0])) {
    const tokens = response[0] as number[][];
    const dim = tokens[0].length;
    const pooled = new Array(dim).fill(0);
    for (const token of tokens) {
      for (let i = 0; i < dim; i++) {
        pooled[i] += token[i];
      }
    }
    return pooled.map(v => v / tokens.length);
  }

  return response[0] as number[];
}
```

- [ ] **Step 2: Create embedding job processor**

```typescript
// services/workers/src/embedding-job.processor.ts

import { Pool } from 'pg';
import { HfInference } from '@huggingface/inference';
import { generateBioEmbedding } from './mastra-embedding-tool';

interface ProcessorConfig {
  databaseUrl: string;
  hfKey: string;
  batchSize: number;
  pollingIntervalMs: number;
}

export class EmbeddingJobProcessor {
  private pool: Pool;
  private hf: HfInference;
  private running = false;
  private config: ProcessorConfig;

  constructor(config: ProcessorConfig) {
    this.config = config;
    this.pool = new Pool({ connectionString: config.databaseUrl });
    this.hf = new HfInference(config.hfKey);
  }

  async start() {
    console.log('✅ EmbeddingJobProcessor started');
    console.log(`   Batch size: ${this.config.batchSize}`);
    console.log(`   Polling interval: ${this.config.pollingIntervalMs}ms`);

    this.running = true;
    await this.runJobLoop();
  }

  async stop() {
    this.running = false;
    await this.pool.end();
    console.log('✅ EmbeddingJobProcessor stopped');
  }

  private async runJobLoop() {
    while (this.running) {
      try {
        const processed = await this.processBatch();
        if (processed > 0) {
          console.log(`✅ Processed ${processed} embeddings`);
        } else {
          console.log('ℹ️  No pending embeddings to process');
        }
      } catch (error) {
        console.error('❌ Error processing batch:', error);
      }

      await this.sleep(this.config.pollingIntervalMs);
    }
  }

  private async processBatch(): Promise<number> {
    // Find cases without embeddings
    const result = await this.pool.query(`
      SELECT mc.id, mc.clinical_note
      FROM mimic_cases mc
      LEFT JOIN case_embeddings ce ON ce.case_id = mc.id
      WHERE ce.id IS NULL
      AND mc.clinical_note IS NOT NULL
      AND mc.clinical_note != ''
      LIMIT $1
    `, [this.config.batchSize]);

    if (result.rows.length === 0) return 0;

    let processed = 0;
    for (const row of result.rows) {
      try {
        const embedding = await generateBioEmbedding(this.hf, row.clinical_note);
        await this.pool.query(
          `INSERT INTO case_embeddings (case_id, embedding, model) VALUES ($1, $2, 'biobert')`,
          [row.id, JSON.stringify(embedding)]
        );
        processed++;
      } catch (error) {
        console.error(`Failed to generate embedding for case ${row.id}:`, error);
      }
    }

    return processed;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add services/workers/src/
git commit -m "feat(workers): implement BioBERT embedding job processor with batch processing"
```

---

### Task 21: Update Docker Compose for Workers Service

- [ ] **Step 1: Verify docker-compose.yml workers service config**

The workers service should already have been updated in Task 3. Verify:

```yaml
workers:
  build:
    context: .
    dockerfile: services/workers/Dockerfile
  container_name: healthtrack-workers
  command: ["node", "dist/index.js"]
  environment:
    - NODE_ENV=${NODE_ENV:-production}
    - DATABASE_URL=postgresql://${DB_USER:-healthtrack}:${DB_PASSWORD:-healthtrack}@database:5432/${DB_NAME:-healthtrack}
    - HF_KEY=${HF_KEY}
    - EMBEDDING_BATCH_SIZE=${EMBEDDING_BATCH_SIZE:-100}
    - WORKER_POLLING_INTERVAL=${WORKER_POLLING_INTERVAL:-30000}
  depends_on:
    database:
      condition: service_healthy
    cache:
      condition: service_healthy
  restart: unless-stopped
  networks:
    - healthtrack-net
```

- [ ] **Step 2: Add HF_KEY to docker-compose.yml if missing**

Ensure `HF_KEY` is in the workers environment section.

- [ ] **Step 3: Build and test workers**

```bash
docker compose build workers
docker compose up -d workers
docker logs healthtrack-workers
```

Expected: Workers service starts, polls database, reports "No pending embeddings to process" (since we have seed data but no embeddings yet — it will process them on the next cycle if we add embeddings first).

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "chore(docker): configure workers service in docker-compose"
```

---

### Task 22: Phase 4 Verification — End-to-End Embedding Pipeline

- [ ] **Step 1: Run seed data to have cases in DB**

```bash
cd services/backend
npm run seed:mimic
```

- [ ] **Step 2: Start all services**

```bash
docker compose up -d
```

- [ ] **Step 3: Verify workers process seed data**

```bash
# Wait 30-60 seconds for workers to poll
docker logs healthtrack-workers --tail 20
```

Expected: Workers should find the 3 seed cases, generate embeddings, insert them.

- [ ] **Step 4: Verify embeddings exist in database**

```bash
docker exec -it healthtrack-database psql -U healthtrack -d healthtrack -c "
SELECT ce.case_id, ce.model, mc.subject_id, mc.clinical_note IS NOT NULL as has_note
FROM case_embeddings ce
JOIN mimic_cases mc ON mc.id = ce.case_id;
"
```

Expected: 3 rows with embeddings.

- [ ] **Step 5: Test similar case search via API**

```bash
curl -X POST http://localhost:3000/cases/similar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"clinicalNote":"65-year-old male presenting with shortness of breath and fatigue. History of heart failure."}'
```

Expected: Returns ranked similar cases from seed data with matchConfidence scores.

- [ ] **Step 6: Conductor - User Manual Verification 'Phase 4: Workers Service & Embedding Pipeline' (Protocol in workflow.md)**

---

## Phase 5: Mastra Workflow Migration — Genkit → Mastra

### Task 23: Implement Existing Mastra Tool Stubs

**Files:**
- Modify: `services/backend/src/mastra/tools/patient-search-tool.ts`
- Modify: `services/backend/src/mastra/tools/enhance-notes-tool.ts`

- [ ] **Step 1: Read current stub implementations**

```bash
cat services/backend/src/mastra/tools/patient-search-tool.ts
cat services/backend/src/mastra/tools/enhance-notes-tool.ts
```

- [ ] **Step 2: Implement patient-search-tool**

Replace the TODO stub with a real implementation that queries the patients table via Drizzle:

```typescript
// services/backend/src/mastra/tools/patient-search-tool.ts

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { patients } from '../../drizzle/schema';
import { ilike, or } from 'drizzle-orm';

export const patientSearchTool = createTool({
  id: 'patient-search',
  description: 'Search for patients by name, complaint, or conditions',
  inputSchema: z.object({
    query: z.string().describe('Search query for patient name or complaint'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      id: z.string(),
      name: z.string(),
      age: z.number(),
      primaryComplaint: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }));

    const results = await db.select({
      id: patients.id,
      name: patients.name,
      age: patients.age,
      primaryComplaint: patients.primaryComplaint,
    })
    .from(patients)
    .where(or(
      ilike(patients.name, `%${context.query}%`),
      ilike(patients.primaryComplaint, `%${context.query}%`),
    ))
    .limit(10);

    return { results };
  },
});
```

- [ ] **Step 3: Implement enhance-notes-tool**

```typescript
// services/backend/src/mastra/tools/enhance-notes-tool.ts

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const enhanceNotesTool = createTool({
  id: 'enhance-notes',
  description: 'Enhance and format SOAP clinical notes for better structure and completeness',
  inputSchema: z.object({
    currentNotes: z.string().describe('Current SOAP notes to enhance'),
    patientInformation: z.string().optional().describe('Patient demographic and visit information'),
    vitals: z.string().optional().describe('Patient vital signs'),
    observations: z.string().optional().describe('Clinical observations'),
  }),
  outputSchema: z.object({
    enhancedNotes: z.string().describe('Enhanced SOAP notes with improved structure'),
  }),
  execute: async ({ context, mastra }) => {
    // The Mastra agent's LLM will use this tool to enhance notes
    // The tool returns the input as a structured response for the agent to process
    return {
      enhancedNotes: context.currentNotes,
    };
  },
});
```

Note: The actual enhancement logic is handled by the Mastra agent's LLM instructions. The tool provides the structured input/output interface.

- [ ] **Step 4: Commit**

```bash
git add services/backend/src/mastra/tools/
git commit -m "feat(mastra): implement patient-search and enhance-notes tools"
```

---

### Task 24: Create Mastra Workflows from Genkit Flows

**Files:**
- Create: `services/backend/src/mastra/workflows/symptom-analysis.workflow.ts`
- Create: `services/backend/src/mastra/workflows/note-enhancement.workflow.ts`
- Create: `services/backend/src/mastra/workflows/patient-summary.workflow.ts`

- [ ] **Step 1: Read the Genkit flow to migrate — analyze-patient-symptoms.ts**

```bash
cat services/frontend/src/ai/flows/analyze-patient-symptoms.ts
```

Key logic to migrate:
- Input: patientInformation, vitals, observations, medicalHistory
- Uses Gemini with specific prompt template
- Calls ICD-10 lookup tool
- Outputs: icd10Tags, riskScore, soapNotes, allergyWarnings, medicationInteractions

- [ ] **Step 2: Create symptom analysis workflow**

```typescript
// services/backend/src/mastra/workflows/symptom-analysis.workflow.ts

import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

/**
 * Migrated from Genkit flow: analyze-patient-symptoms
 * Analyzes patient symptoms and generates ICD-10 code suggestions, risk scoring, and SOAP notes.
 */
export const symptomAnalysisAgent = new Agent({
  id: 'symptom-analysis',
  name: 'Symptom Analysis Agent',
  instructions: `You are a clinical decision support assistant. Analyze the patient information provided and:
1. Suggest relevant ICD-10 codes based on symptoms and observations
2. Provide a risk score (0-100) based on severity indicators
3. Generate structured SOAP notes from the available data
4. Flag any allergy warnings or medication interactions if medical history is provided

Be precise and evidence-based. Only suggest ICD-10 codes that are directly supported by the symptoms described.
Format your response as JSON with the following structure:
{
  "icd10Tags": ["code - description", ...],
  "riskScore": number (0-100),
  "soapNotes": { "subjective": "...", "objective": "...", "assessment": "...", "plan": "..." },
  "allergyWarnings": ["...", ...],
  "medicationInteractions": ["...", ...],
  "previousConditionsImpact": "..."
}`,
  model: 'openrouter/openai/gpt-oss-20b:free', // Swappable via model router
});
```

- [ ] **Step 3: Read enhance-notes Genkit flow**

```bash
cat services/frontend/src/ai/flows/enhance-notes.ts
```

- [ ] **Step 4: Create note enhancement workflow**

```typescript
// services/backend/src/mastra/workflows/note-enhancement.workflow.ts

import { Agent } from '@mastra/core/agent';

/**
 * Migrated from Genkit flow: enhance-notes
 * Enhances and structures clinical SOAP notes using AI.
 */
export const noteEnhancementAgent = new Agent({
  id: 'note-enhancement',
  name: 'SOAP Note Enhancement Agent',
  instructions: `You are a clinical documentation specialist. Enhance the provided SOAP notes by:
1. Improving structure and formatting
2. Adding relevant clinical detail from patient vitals and observations
3. Ensuring all four SOAP sections (Subjective, Objective, Assessment, Plan) are present and well-developed
4. Integrating medical history information where relevant
5. Using precise medical terminology

Return the enhanced notes in proper SOAP format with clear section headers:
S: Subjective
O: Objective
A: Assessment
P: Plan`,
  model: 'openrouter/openai/gpt-oss-20b:free',
});
```

- [ ] **Step 5: Read summarize-patient-condition Genkit flow**

```bash
cat services/frontend/src/ai/flows/summarize-patient-condition.ts
```

- [ ] **Step 6: Create patient summary workflow**

```typescript
// services/backend/src/mastra/workflows/patient-summary.workflow.ts

import { Agent } from '@mastra/core/agent';

/**
 * Migrated from Genkit flow: summarize-patient-condition
 * Generates a concise patient condition summary from clinical data.
 */
export const patientSummaryAgent = new Agent({
  id: 'patient-summary',
  name: 'Patient Summary Agent',
  instructions: `You are a clinical summarization assistant. Based on the patient information provided, generate a concise summary including:
1. Overall assessment of the patient's condition
2. Key clinical findings
3. Care suggestions and next steps
4. What further data or tests might be needed
5. Insights from medical history (if provided)

Be concise, precise, and evidence-based. Use medical terminology appropriately.
Format as a structured summary with clear headings.`,
  model: 'openrouter/openai/gpt-oss-20b:free',
});
```

- [ ] **Step 7: Update Mastra index to include new agents**

```typescript
// services/backend/src/mastra/index.ts (update)

import { Mastra } from '@mastra/core/mastra';
import { symptomAnalysisAgent } from './workflows/symptom-analysis.workflow';
import { noteEnhancementAgent } from './workflows/note-enhancement.workflow';
import { patientSummaryAgent } from './workflows/patient-summary.workflow';
import { patientAnalysisAgent } from './agents/patient-analysis-agent';
import { soapNotesAgent } from './agents/soap-notes-agent';

export const mastra = new Mastra({
  agents: {
    symptomAnalysis: symptomAnalysisAgent,
    noteEnhancement: noteEnhancementAgent,
    patientSummary: patientSummaryAgent,
    patientAnalysis: patientAnalysisAgent,
    soapNotes: soapNotesAgent,
  },
});
```

- [ ] **Step 8: Commit**

```bash
git add services/backend/src/mastra/workflows/ services/backend/src/mastra/index.ts
git commit -m "feat(mastra): migrate Genkit flows to Mastra agents (symptom analysis, note enhancement, patient summary)"
```

---

### Task 25: Delete Old Genkit Code

**Files:**
- Delete: `services/frontend/src/ai/` (entire directory)
- Modify: `services/frontend/package.json` — remove Genkit dependencies

- [ ] **Step 1: Verify all Genkit flows are migrated**

Confirm that:
- `analyze-patient-symptoms.ts` → `symptomAnalysisAgent` ✅
- `enhance-notes.ts` → `noteEnhancementAgent` ✅
- `summarize-patient-condition.ts` → `patientSummaryAgent` ✅
- `analyze-and-summarize.ts` → Combined use of above agents ✅

- [ ] **Step 2: Delete Genkit directory**

```bash
rm -rf services/frontend/src/ai/
```

- [ ] **Step 3: Remove Genkit dependencies from frontend package.json**

Remove these from `services/frontend/package.json`:
- `@genkit-ai/*` packages
- `genkit` itself

- [ ] **Step 4: Remove Genkit npm scripts**

Remove `genkit:dev` script from root package.json.

- [ ] **Step 5: Commit**

```bash
git add services/frontend/src/ai/ services/frontend/package.json package.json
git commit -m "chore: delete deprecated Genkit code after Mastra migration"
```

---

### Task 26: Phase 5 Verification — Test Mastra Agents

- [ ] **Step 1: Verify Mastra compiles**

```bash
cd services/backend
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 2: Test Mastra agent instantiation**

```bash
cd services/backend
npx tsx -e "
import { mastra } from './src/mastra';
console.log('Agents:', Object.keys(mastra.getAgents()));
"
```

Expected: Lists all 5 agents.

- [ ] **Step 3: Verify frontend builds without Genkit**

```bash
cd services/frontend
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Conductor - User Manual Verification 'Phase 5: Mastra Workflow Migration' (Protocol in workflow.md)**

---

## Phase 6: Frontend Integration — Remove Electron IPC

### Task 27: Update Dashboard Pages to Use Backend API

**Files:**
- Modify: `services/frontend/src/app/dashboard/page.tsx`
- Modify: `services/frontend/src/app/dashboard/patient/[id]/page.tsx`
- Modify: `services/frontend/src/app/dashboard/archived/page.tsx`

- [ ] **Step 1: Update dashboard/page.tsx**

Find all instances of `window.electronAPI` and replace with `fetch(process.env.BACKEND_URL || '/api')`.

The pattern to replace:
```typescript
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
if (isElectron) {
  // Electron IPC path
} else {
  // Fetch path
}
```

Replace with:
```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const response = await fetch(`${backendUrl}/patients`);
```

- [ ] **Step 2: Update dashboard/patient/[id]/page.tsx**

Same pattern — replace Electron IPC calls with fetch to backend:
- `window.electronAPI.database.getPatient({ id })` → `fetch(${backendUrl}/patients/${id})`

- [ ] **Step 3: Update dashboard/archived/page.tsx**

- `window.electronAPI.database.getArchivedPatients()` → `fetch(${backendUrl}/patients?status=archived)`

- [ ] **Step 4: Add NEXT_PUBLIC_BACKEND_URL to environment**

Add to `services/frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

- [ ] **Step 5: Delete Electron type declarations**

```bash
rm services/frontend/src/types/window-electron-compat.d.ts
```

- [ ] **Step 6: Commit**

```bash
git add services/frontend/src/app/dashboard/ services/frontend/src/types/
git commit -m "refactor(frontend): replace Electron IPC with backend API fetch calls"
```

---

### Task 28: Update Similar Cases Panel to Use New API

**Files:**
- Modify: `services/frontend/src/components/results/SimilarCasesPanel.tsx`
- Modify: `services/frontend/src/app/analysis/page.tsx`

- [ ] **Step 1: Update analysis/page.tsx to call new backend endpoint**

In the `fetchSimilarCases` function, replace the old IPC call:

```typescript
// OLD (Electron IPC):
const data = await db.findSimilarCases({ ... });

// NEW (Backend API):
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const response = await fetch(`${backendUrl}/cases/similar`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinicalNote: currentCaseDisplayData?.observations || '',
    patientInformation: currentCaseDisplayData?.patientInformation || '',
    vitals: currentCaseDisplayData?.vitals,
    diagnoses: currentCaseDisplayData?.icd_tags,
  }),
});
const data = await response.json();
```

- [ ] **Step 2: Verify SimilarCasesPanel.tsx renders the response correctly**

The panel already expects `SimilarCaseOutput[]` — the new backend returns this format. No changes needed to the panel component itself.

- [ ] ] **Step 3: Commit**

```bash
git add services/frontend/src/app/analysis/page.tsx
git commit -m "refactor(frontend): update similar cases to use new backend API"
```

---

### Task 29: Delete Disabled API Routes from Frontend

**Files:**
- Delete: `services/frontend/src/app/api/patients/`
- Delete: `services/frontend/src/app/api/case-details/`
- Delete: `services/frontend/src/app/api/similar-cases/`
- Delete: `services/frontend/src/app/api/export/`
- Delete: `services/frontend/src/app/api/local-embeddings/`

- [ ] **Step 1: Delete all disabled API route directories**

```bash
rm -rf services/frontend/src/app/api/patients/
rm -rf services/frontend/src/app/api/case-details/
rm -rf services/frontend/src/app/api/similar-cases/
rm -rf services/frontend/src/app/api/export/
rm -rf services/frontend/src/app/api/local-embeddings/
```

- [ ] **Step 2: Verify no broken imports**

```bash
cd services/frontend
grep -rn "import.*from.*api/patients\|import.*from.*api/case-details\|import.*from.*api/similar-cases\|import.*from.*api/export\|import.*from.*api/local-embeddings" src/
```

Expected: No results. If any files still import from deleted API routes, update them to use the backend API.

- [ ] **Step 3: Commit**

```bash
git rm -r services/frontend/src/app/api/patients/ services/frontend/src/app/api/case-details/ services/frontend/src/app/api/similar-cases/ services/frontend/src/app/api/export/ services/frontend/src/app/api/local-embeddings/ 2>/dev/null || true
git commit -m "chore(frontend): delete disabled API routes (replaced by NestJS backend)"
```

---

### Task 30: Replace console.log with Proper Logging in Frontend

**Files:**
- Modify: All frontend files with `console.log` statements

- [ ] **Step 1: Find all console.log statements**

```bash
grep -rn "console\.log\|console\.warn\|console\.error" services/frontend/src/ --include="*.ts" --include="*.tsx" | wc -l
```

- [ ] **Step 2: Create a simple logger utility**

```typescript
// services/frontend/src/lib/logger.ts

const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL || 'error';

const logger = {
  debug: (...args: unknown[]) => {
    if (LOG_LEVEL === 'debug') console.log('[DEBUG]', ...args);
  },
  info: (...args: unknown[]) => {
    if (['debug', 'info'].includes(LOG_LEVEL)) console.log('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (['debug', 'info', 'warn'].includes(LOG_LEVEL)) console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};

export default logger;
```

- [ ] **Step 3: Replace console.log in frontend**

Replace `console.log` with `logger.info` and `console.error` with `logger.error` in the key files that have them. Focus on the dashboard pages and analysis page. Remove debug/trace logs entirely (they add no value in production).

- [ ] **Step 4: Commit**

```bash
git add services/frontend/src/lib/logger.ts services/frontend/src/
git commit -m "chore(frontend): add structured logger, reduce console.log noise"
```

---

### Task 31: Remove Dead Electron References

- [ ] **Step 1: Find remaining electron references**

```bash
grep -rn "electron\|electronAPI\|ipcRenderer" services/frontend/src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: Remove or clean up all references**

For any remaining references:
- If it's a comment about Electron being disabled → delete the comment
- If it's dead code → delete it
- If it's an `isElectron` guard → replace with direct backend fetch

- [ ] **Step 3: Commit**

```bash
git add services/frontend/src/
git commit -m "chore(frontend): remove all remaining Electron references"
```

---

### Task 32: Phase 6 Verification — Full End-to-End Test

- [ ] **Step 1: Start all services**

```bash
docker compose up -d
```

- [ ] **Step 2: Verify frontend loads**

```bash
curl -s http://localhost:8080 | head -20
```

Expected: HTML content returned.

- [ ] **Step 3: Verify no Electron errors in browser console**

Open `http://localhost:8080` in browser, check console for errors.

- [ ] **Step 4: Verify similar case search works end-to-end**

1. Navigate to the analysis page
2. Trigger a similar case search
3. Verify the `SimilarCasesPanel` renders results

- [ ] **Step 5: Conductor - User Manual Verification 'Phase 6: Frontend Integration' (Protocol in workflow.md)**

---

## Phase 7: Testing & Final Verification

### Task 33: Configure Vitest for Frontend and Backend

- [ ] **Step 1: Verify existing Vitest config in frontend**

```bash
cat services/frontend/vitest.config.ts
```

- [ ] **Step 2: Verify existing Vitest config in backend**

```bash
cat services/backend/vitest.config.ts
```

- [ ] **Step 3: Add test script to root package.json**

```json
{
  "scripts": {
    "test": "cd services/backend && npm test && cd ../frontend && npm test",
    "test:backend": "cd services/backend && npm test",
    "test:frontend": "cd services/frontend && npm test",
    "test:workers": "cd services/workers && npm test"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add test scripts for all services"
```

---

### Task 34: Write E2E Test for Similar Cases Search

**Files:**
- Create: `tests/similar-cases/similar-cases.e2e.test.ts`

- [ ] **Step 1: Write E2E test**

```typescript
// tests/similar-cases/similar-cases.e2e.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

describe('POST /cases/similar', () => {
  it('should return ranked similar cases for a valid clinical note', async () => {
    const response = await fetch(`${BACKEND_URL}/cases/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicalNote: 'Patient presenting with chest pain and shortness of breath',
        limit: 5,
      }),
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    if (data.length > 0) {
      expect(data[0]).toHaveProperty('matchConfidence');
      expect(data[0]).toHaveProperty('subject_id');
      expect(data[0]).toHaveProperty('icd');
      expect(data[0]).toHaveProperty('note');
    }
  });

  it('should return empty array when no embeddings exist', async () => {
    // This test verifies graceful handling when no embeddings are available
    const response = await fetch(`${BACKEND_URL}/cases/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicalNote: 'Nonexistent condition XYZ',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

- [ ] **Step 2: Run E2E test**

```bash
# Ensure backend is running with seed data and embeddings
docker compose up -d
cd tests
npx vitest similar-cases/ --run
```

- [ ] **Step 3: Commit**

```bash
git add tests/similar-cases/
git commit -m "test(e2e): add E2E tests for similar case search API"
```

---

### Task 35: Final Verification — Build, Typecheck, Lint

- [ ] **Step 1: Typecheck all services**

```bash
cd services/backend && npm run typecheck
cd ../frontend && npm run typecheck
cd ../workers && npm run typecheck
```

Expected: All pass.

- [ ] **Step 2: Build all services**

```bash
docker compose build
```

Expected: All services build successfully.

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Verify docker compose starts all services**

```bash
docker compose up -d
docker compose ps
```

Expected: All 5 services running and healthy.

- [ ] **Step 5: Verify no old directories at root**

```bash
ls -d src backend workers 2>/dev/null && echo "FAIL: old directories exist" || echo "PASS: clean"
```

- [ ] **Step 6: Final Conductor Verification**

- [ ] **Step 6: Conductor - User Manual Verification 'Phase 7: Testing & Final Verification' (Protocol in workflow.md)**

---

## Phase 8: Conductor - User Manual Verification (Final)

- [ ] **Task: Conductor - User Manual Verification 'Phase 8: Track Completion' (Protocol in workflow.md)**

This final task verifies:
1. All acceptance criteria from the spec are met
2. No regressions in existing functionality
3. Frontend UI renders correctly with all new data sources
4. Similar case search returns meaningful results from MIMIC-IV seed data
5. Mastra agents are callable and return structured responses
6. Workers service processes embeddings correctly
7. Docker compose starts all services cleanly
8. Code coverage meets 80% threshold

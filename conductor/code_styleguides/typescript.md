# TypeScript Style Guide

## Strict Mode
- Always enable `"strict": true` in `tsconfig.json`
- No `any` types — use `unknown` when type is truly uncertain, then narrow
- Explicit return types on all functions and methods
- No implicit `any` from imports

## Naming Conventions
- **Types/Interfaces**: PascalCase (`PatientRecord`, `UsePatientResult`)
- **Variables/Functions**: camelCase (`getPatients`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`MAX_RETRIES`, `API_TIMEOUT_MS`)
- **Files**: kebab-case (`patient-service.ts`, `use-patient-data.ts`)
- **Directories**: kebab-case (`src/components/patient-list/`)

## Module Organization
- One type/interface per file if exported and used across modules
- Co-locate types with their implementation when tightly coupled
- Export from barrel files (`index.ts`) for public module surfaces only
- No circular imports — use dependency injection or extract shared types

## Error Handling
- Use discriminated unions for error results, not thrown exceptions in application logic
- `never` type for exhaustive switch checks
- Wrap external/untrusted calls in try/catch with typed error objects
- Never swallow errors — log or rethrow with context

## Functions
- Prefer small, focused functions (< 30 lines when possible)
- Pure functions where possible — side effects at the edges
- Named function expressions over anonymous for better stack traces
- Avoid default exports — use named exports for better refactoring and tree-shaking

## Data Access (Drizzle ORM)
- Define schemas in a dedicated `db/schema` directory
- Infer TypeScript types from schema definitions (no duplicate types)
- Use query builders, not raw SQL, unless absolutely necessary
- All queries must include organization-scoped filtering (`organization_id`)

## AI/ML Integration (Mastra)
- Type all AI model inputs and outputs explicitly
- Never trust AI output without validation (Zod schema validation on all AI responses)
- Isolate AI provider configuration — swap providers without touching business logic

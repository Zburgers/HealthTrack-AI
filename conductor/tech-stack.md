# HealthTrack AI — Technology Stack

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | Latest stable (App Router) | React framework, SSR, routing |
| React | Latest | UI library |
| TypeScript | Latest | Type safety across the stack |
| Tailwind CSS | Latest | Utility-first styling |
| shadcn/ui | Latest | Reusable component primitives |
| Lucide React | Latest | Icon library |
| Framer Motion | Latest | Animations & transitions |
| React Hook Form + Zod | Latest | Form validation |

### Design Principles
- Maintain current clean, minimalist, modern aesthetic
- High contrast for clinical environments
- Mobile-responsive, mobile-first approach

## Backend

| Technology | Purpose |
|---|---|
| NestJS | API framework — modular, testable, structured |
| Drizzle ORM | PostgreSQL ORM — lightweight, type-safe, explicit queries |
| Zod | Request validation, schema validation, type generation |
| Mastra (TypeScript) | AI orchestration framework — provider-agnostic, no vendor lock-in |

### AI/ML
| Technology | Purpose |
|---|---|
| Mastra | AI workflow orchestration, model-agnostic routing |
| Google Gemini | AI model provider (swappable via Mastra) |
| pgvector | Vector embeddings stored directly in PostgreSQL |
| MIMIC-IV dataset | Clinical case data for similar-case matching |

## Database

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary production database — relational, ACID, extensible |
| pgvector extension | Vector search for similar-case intelligence (same DB, no separate vector store needed) |
| Redis | Caching layer, session store, rate limiting, pub/sub for real-time features |

### Rationale
- **PostgreSQL over MongoDB**: Relational integrity, ACID transactions, pgvector eliminates need for separate vector DB, better for multi-tenant org-scoped data isolation
- **pgvector over MongoDB Atlas Vector Search**: Same database, lower complexity, no external dependency, easier backups

## Infrastructure

| Technology | Purpose |
|---|---|
| Docker | Container runtime for all services |
| Docker Compose | Multi-service orchestration (production-ready) |
| CI/CD | Built into compose setup — automated build, test, deploy pipeline |

### Microservice Architecture (Docker Compose)
| Service | Description |
|---|---|
| `frontend` | Next.js application (SSR + client-side) |
| `backend` | NestJS API (REST/GraphQL) |
| `database` | PostgreSQL with pgvector |
| `cache` | Redis |
| `workers` | Background job processors (AI workflows, embedding generation, async tasks) |

### Deployment
- **Self-hosted** via Docker Compose — no cloud vendor lock-in
- Production-ready compose configuration with health checks, restart policies, resource limits
- Google Cloud Run removed as primary deployment target

## Authentication

| Technology | Purpose |
|---|---|
| Firebase Google OAuth | User authentication (retained from current implementation) |
| Session management | Redis-backed sessions for stateless API auth |

## Testing

| Technology | Purpose |
|---|---|
| Vitest | Unit & component tests — fast, modern, excellent TS support |
| Testing Library | Component testing — user-centric assertions |
| Supertest | API integration testing for NestJS endpoints |
| Playwright | End-to-end browser testing |

## To Be Removed (Current Technical Debt)

| Component | Reason |
|---|---|
| Electron (all) | Moving to web-first, Electron formally deprecated |
| MongoDB (Node driver) | Replaced by PostgreSQL |
| MongoDB Atlas Vector Search | Replaced by pgvector |
| Better-SQLite3 | Deprecated, redundant local DB |
| Genkit | Replaced by Mastra |
| Next.js API routes | Replaced by NestJS |
| Jest | Replaced by Vitest |
| All IPC handlers, preload scripts, electron/dist/ | Electron removal |

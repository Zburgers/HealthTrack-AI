# HealthTrack AI — Product Guidelines

## Messaging & Tone

### Voice
- **Authoritative & trusted**: Emphasize credibility, data sources (MIMIC-IV, BioBERT), and medical accuracy. AI outputs should inspire confidence, not doubt.
- **Clinical & professional**: Use precise, evidence-based language. Avoid marketing fluff. Doctors value accuracy over persuasion.

### Tone Rules
- Never exaggerate AI capabilities — be transparent about what AI can and cannot do
- Use medical terminology correctly; do not dumb down clinical language for the UI
- When AI makes a suggestion, frame it as "AI-assisted recommendation" not "diagnosis"
- Error messages should be calm, specific, and actionable — never alarming

## AI Output Presentation

### Core Principle: Transparent Reasoning + Editable Drafts
- All AI-generated content (SOAP notes, ICD-10 codes, similar cases) must be clearly marked as **AI suggestions**
- Show the AI's reasoning, confidence score, or source citations alongside the output so clinicians understand *why* a suggestion was made
- AI output is always presented as an **editable draft** — the doctor reviews, edits, and approves before finalizing
- Never auto-commit AI output to a patient record without explicit user action

## Visual Identity

- **Maintain current design language**: Clean, minimalist, and modern aesthetic (already in place, review existing UX for refinement)
- High contrast for readability in clinical environments
- Color-coded risk indicators remain (red/amber/green) for quick clinical triage
- No redesign needed — refine and standardize existing patterns

## Error Handling

- **Non-intrusive notifications**: Use toast notifications for errors
- Never block the user's workflow unless the error is critical (e.g., data loss risk)
- AI failures should gracefully fall back to manual input mode with a toast notification
- Log errors server-side for debugging; surface to user only when action is needed

## Strategic Direction

### Web-First, Electron Removed
- Electron support is **formally deprecated and removed entirely**
- All desktop functionality is replaced by the responsive web interface
- Electron codebase, IPC handlers, preload scripts, and related build tooling will be deleted
- The project will be a pure SaaS multi-tenant web application

### Data Architecture
- Single, clean data access path — no competing abstractions
- Organization-scoped data isolation via `organization_id` on all records
- MongoDB Atlas as the primary data store with vector search for similar cases
- Local SQLite removed entirely (was already deprecated)

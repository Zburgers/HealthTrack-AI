
# HealthTrack AI — Product Requirements Document (PRD)

## 1. Introduction
**HealthTrack AI** is a real-time AI assistant for doctors that streamlines patient assessment by analyzing symptoms, predicting disease risks, and generating structured clinical documentation. This MVP is being developed for the Google AI for Action Hackathon.

## 2. Problem Statement
Doctors, especially in high-volume settings (e.g., ED, ICU), often spend significant time documenting symptoms, diagnosing, and referencing prior cases. This slows down patient throughput and increases mental load. There is a lack of seamless, explainable AI support during this process.

## 3. Solution Overview
HealthTrack reduces time spent on clinical decision-making and documentation by combining advanced LLMs, biomedical embeddings, and real-time UI/UX workflows. It provides a one-click interface to:
- Extract symptoms and ICD-10 codes from input
- Predict top diagnosis risks with explanations
- Generate editable SOAP notes
- Retrieve similar real-world cases from MIMIC-IV dataset

## 4. Primary Users
- Frontline doctors in hospitals (Emergency, ICU, General OPD)
- General physicians handling high patient volume
- Secondary: Clinical researchers exploring AI-assisted workflows

## 5. User Stories

### User Story 1: Login
As a doctor, I want to securely log in with Google OAuth so that I can access my patients quickly.

### User Story 2: Dashboard
As a user, I want to see a list of recent patients with tags and risk scores so that I can resume work efficiently.

### User Story 3: New Case Input
As a doctor, I want to input patient details, vitals, and symptoms in a structured form so that the AI can analyze the case.

### User Story 4: AI Analysis
As a user, I want to click "Analyze Patient" to trigger real-time AI outputs (ICD tags, risk predictions, SOAP notes, similar cases).

### User Story 5: Results Review
As a user, I want to edit the SOAP note and confirm AI suggestions so that I maintain full control over clinical judgment.

### User Story 6: Export
As a doctor, I want to export my notes as PDF, JSON, or secure share link so I can share or store patient records easily.

## 6. Acceptance Criteria

### Login
- [ ] User can authenticate via Google OAuth
- [ ] On success, user is routed to the dashboard

### Dashboard
- [ ] Displays cards with name, age, risk color, last edited status
- [ ] Searchable via fuzzy spotlight-style search

### New Case Input
- [ ] Supports form inputs for demographics, vitals, and observations
- [ ] Auto-suggests symptoms from free-text observations
- [ ] “Analyze Patient” button triggers AI agents

### AI Agents Output
- [ ] NER: Extract symptoms with ICD-10 + confidence
- [ ] Risk Prediction: Top 3–5 diseases with % risk and reasons
- [ ] SOAP Generator: Editable structured note (Subjective, Objective, Assessment, Plan)
- [ ] Case Matcher: Retrieve 3–5 most similar MIMIC-IV cases

### Results Review
- [ ] User can edit clinical note inline
- [ ] Hover/tap to highlight source text for tags
- [ ] Toggle explanations and highlights

### Export & Save
- [ ] Copy to EMR (FHIR JSON)
- [ ] Download formatted PDF
- [ ] Share via secure Firebase link
- [ ] Prompt to save on unsaved changes

## 7. Technical Requirements

- **LLMs**: Gemini 2.0 Pro & Flash via Vertex AI Studio
- **NER/ICD Prompt**: Structured prompt for extracting tags with confidence scores
- **Risk/Note Prompt**: One-shot structured prompt using ICD tags + top similar cases
- **Embedding Model**: BioBERT v1.1 base (768-d vector)
- **Vector Search**: MongoDB Atlas (Cosine Similarity)
- **Authentication**: Firebase Google OAuth
- **Frontend**: Next.js + Tailwind + Framer Motion
- **Backend**: Next.js API Routes + MongoDB Atlas

## 8. Constraints

- ❗ Must use real MIMIC-IV data for case embeddings
- ❗ No demo mode; requires login
- ❗ Only doctors are intended users (not nurses/admins)
- ❗ Gemini APIs only — no deprecated Healthcare NLP

## 9. Visual / UX Notes

- Dashboard: Gradient patient cards, color-coded risk labels
- Results: Real-time gauges, SOAP block coloring, tag chips with hover tooltips
- Animations: Spotlight search, modals with glassmorphism
- Export Panel: Copy/Download/Share modal with blur

## 10. Out of Scope (MVP)

- No medications, outcome prediction, or chat-based interfaces
- No fine-tuned custom LLMs (only prompting used)
- No external integrations (EMR push is local-only)

## 11. North Star Goal
> "Make the doctor say: ‘Wow, this just saved me 15 minutes per patient.’"

This is the single success metric. The app must deliver fast, accurate, explainable intelligence in one click.

---

# HealthTrack AI — Product Guide

## Vision
An intelligent clinical assistance platform that helps solo practitioners and small clinic teams work faster, document better, and make more informed clinical decisions through AI-powered tools.

## Target Users
- **Primary**: Solo clinicians (independent practitioners)
- **Secondary**: Small clinic teams (1–20 doctors per organization)
- **Organizational model**: Multi-tenant SaaS where each organization has its own workspace with role-based access for doctors, admins, and support staff

## Core Goals

### 1. 🔐 Secure Authentication & Access
- Firebase Google OAuth integration
- Role-based access control (RBAC) — org admin, doctor, nurse, etc.
- Session management with audit logging
- Organization-level data isolation

### 2. 📊 Intelligent Patient Dashboard
- Color-coded risk visualization for quick clinical triage
- Real-time patient data updates
- Fuzzy search across patient records
- Mobile-responsive design for on-the-go access

### 3. ⚕️ AI-Powered Clinical Analysis
- **Symptom Recognition**: Automated ICD-10 code suggestions
- **SOAP Note Generation**: AI-generated structured documentation from clinical input
- **Real-time Validation**: Against latest medical ontologies
- Reduces documentation time and coding errors

### 4. 🔍 Similar Cases Intelligence
- Powered by MIMIC-IV dataset (10,000+ patient records)
- BioBERT embeddings for semantic similarity matching
- MongoDB Atlas Vector Search for sub-second retrieval
- Treatment outcome insights from similar historical cases

### 5. 🤝 Collaboration
- Enable doctors within an organization to share patient insights
- Cross-role visibility (admins manage, doctors diagnose, nurses assist)
- Organization-scoped data sharing

## Deployment Model
- **SaaS multi-tenant** — single hosted instance, organizations sign up and manage their teams

## Data Isolation Strategy
- **Shared database with row-level isolation** — all organizations share one database, separated by `organization_id` on every record
- Strict enforcement at the data access layer — every query must include org context
- Pragmatic choice: simpler infrastructure, lower cost, easier to operate. Schema-per-org reserved for future enterprise clients if needed.

## Current State & Direction
- **Current**: Brownfield project with severe technical debt from uncoordinated Electron port by multiple developers
- **Direction**: Clean up immediate issues (secrets, `.gitignore`, dead code), then migrate to web-first SaaS application, dropping Electron entirely
- **Architecture goal**: Clean, single data access path, no competing abstractions, clear separation of concerns

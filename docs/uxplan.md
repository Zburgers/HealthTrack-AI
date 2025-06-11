✅ Final Polished MVP UX Plan: HealthTrack AI

🔵 SCREEN 1: Login

Authentication: Firebase Google OAuth only

No sandbox/demo mode

On success → route to Dashboard with Sticky Header

🔹 Persistent Header (All Screens)

Left

Center

Right

App Logo

Current Patient (if loaded)

+ New Case • User Profile

✅ Keeps identity, context, and actions visible at all times.

🟢 SCREEN 2: Patient Dashboard

Patient Cards (Visual + Functional)

Name, Age, Sex, Date

Risk Score (if available): Color-coded (Low/Medium/High)

Tags: Icons or chips for key conditions

Status: Last edited / Saved

Spotlight Fuzzy Search

Center-screen overlay

Transparent blurred background

X dismiss top-left

Real-time fuzzy match (MongoDB Atlas text search)

Top-Right: “+ New Case” Button

Routes to structured case input screen

✅ Polished, visual, intuitive dashboard for repeated use.

🟠 SCREEN 3: New Case Input (Structured Form)

🩺 Patient Details Section

Full Name

Age, Sex

Patient ID (auto-generated or entered)

Optional: Past history / Comorbidities (tags/chips)

📋 Vitals Entry

Temperature

Blood Pressure

Heart Rate

SPO2 (optional)

Respiratory Rate

🧠 Doctor’s Observations (Free Text Box)

Large textarea

Placeholder: “Describe the symptoms and patient condition…”

🧾 Symptoms Panel

Checkboxes for common symptoms

“+ Add Symptom” input (adds chip/tag)

Auto-identify symptoms from the free text (Gemini NER)

Analyze Patient → Triggers AI Agents Asynchronously:

Task

Output

Engine

Symptom NER

ICD-10 Tags + confidence

Gemini (Vertex AI)

Risk Prediction

Risk % + Top factors

Vertex AutoML

SOAP Note Gen

Editable note in SOAP format

Vertex GenAI

Similar Cases

3–5 matches with treatments

BioBERT + MongoDB

✅ Gemini replaces deprecated Healthcare API with custom prompts.

🔴 SCREEN 4: Results Dashboard (Smart Layout)

🧠 Section A: Risk Score

Circular Gauge (colorful, real-time)

Label: e.g. “Diabetes – High Risk (82%)”

Button: “Explain” →

Structured Bullet Panel:

Top Risk Drivers (with icons)

Color bars for influence (%)

“What If” toggles (e.g., "If Fever was not present…")

🧪 Section B: ICD-10 Tag Panel

Tag List: confidence % bars

Tap tag → source text highlight

Confirm/Delete toggle with smooth animation

Tooltip: “Linked to: 'persistent cough' in input”

📄 Section C: Clinical Note (Editable)

Full SOAP Note:

🟪 Subjective: Patient reports persistent cough...
🟨 Objective: Vitals indicate elevated temp, mild tachycardia...
🟦 Assessment: Possible acute bronchitis...
🟥 Plan: Prescribe X, recommend Y, monitor Z...

Prompt-engineered and color-formatted with icons

Toggle: “Show AI Highlights”

Inline editing allowed

Edits don’t overwrite AI output — just extend

✅ Speeds up clinical documentation, doesn't replace it.

🔍 SIDEPANEL: Similar Cases

Slide-in from right

Matched Patients:

Age, Sex, Tags

Diagnosis Outcome

Treatment Summary

Match % Confidence

✅ Adds precedent-based support for clinical decisions.

🟣 SCREEN 5: Export & Collaboration Panel (Popup)

Hovering modal over Screen 4 (background blurred)

Close: X top-right corner

Export Options:

📋 “Copy to EMR” (FHIR-compatible JSON)

📄 “Download PDF” (formatted summary)

🤝 “Send to Colleague” (Firebase-secure share link)

✅ Enables seamless, flexible handoff of patient reports.

🟢 “Save Patient” + “Back to Dashboard” Buttons

Appears when navigating away from unsaved changes

💾 Save before exiting?
[Save & Exit] [Discard] [Cancel]

✅ Unified save experience across app

🎨 Visual Polish & Style Guide

Element

Style

Risk Gauge

Recharts / D3 + glowing edge effects

ICD Tags

Soft pastel bars + tooltip on hover

SOAP Note

Monospace + emoji/color block layout

Search

Spotlight style + blurred background

Buttons & Forms

Tailwind + Framer Motion animations

Patient Cards

Apple Health-inspired gradients

Modals & Popups

Glassmorphism with light shadows

✅ This MVP is:

Lightning-fast

Visually appealing

Clinically useful

Hackathon-ready

Scalable for real hospital deployment later


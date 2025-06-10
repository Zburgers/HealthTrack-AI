# **App Name**: HealthTrack AI

## Core Features:

- Secure Authentication: Firebase Auth integration with Google OAuth for secure access to the dashboard, following the UX flow strictly.
- Patient Dashboard: Display recent patients in a Shadcn UI-based dashboard layout with risk score colors and key condition tags. Includes a prominent 'New Case' button, adhering to the UX flow.
- New Case Form: Implement a responsive form using Shadcn UI components for inputting patient information, vitals, and doctor's observations. Dynamically generates chip/tags based on input, following the new case input flow.
- AI-Powered Analysis: Analyze patient symptoms by identifying relevant ICD-10 tags, calculating risk scores, and drafting SOAP notes using generative AI, presented as editable text in a clinical note format. A tool assists the LLM in deciding how and where to apply this information within the generated outputs. Adheres to UX flow for AI integration.
- Risk Score Visualization: Visually represent the calculated risk score with a Recharts radial progress gauge, complete with color-coded indicators and detailed risk factor explanations, integrated within the results dashboard layout.
- Similar Case Matching: Show similar past cases with patient details, diagnosis outcome, treatment summary, and match confidence score, slide-in from the right, using Shadcn UI components for a polished presentation within the results dashboard.
- Export Panel: Provide a modal dialog (using Shadcn UI with glassmorphism) for exporting patient reports as FHIR-compatible JSON, downloadable PDFs, or secure Firebase share links, as the final step in the UX flow.
- Backend File Setup: Backend files for MongoDB Atlas connection, including setup and environment variables. This feature also takes into account vertexAI setup and connection with proper env vars

## Style Guidelines:

- Primary color: Deep teal (#008080), evoking a sense of calmness, trustworthiness, and clinical precision.
- Secondary color: Soft lavender (#E6E6FA), used for subtle highlights and accents, ensuring accessibility and visual comfort.
- Background color: Off-white (#F8F8FF), providing a clean, distraction-free canvas for clinical data.
- Body font: 'Inter', a highly readable sans-serif optimized for screen displays, enhancing clarity and minimizing eye strain.
- Headline font: 'Manrope', providing a modern touch
- Utilize the Lucide icon set: Consistent, minimalist icons related to medical terminology and patient care.
- Functionally fast and responsive design adapting to various screen sizes without prioritizing mobile-first, focusing on beautiful and elegant presentation.
- Subtle transitions and animations using Framer Motion, creating a fluid and engaging user experience. Animated components should have low opacity
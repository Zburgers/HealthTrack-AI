# 🩺 HealthTrack AI: Intelligent Clinical Assistance

**HealthTrack AI is a cutting-edge, real-time AI assistant designed to empower doctors by streamlining patient assessment, enhancing diagnostic accuracy, and simplifying clinical documentation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![Next.js](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white) ![Firebase](https://img.shields.io/badge/Firebase-orange?style=for-the-badge&logo=firebase&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

---

## 🌟 Overview

In the fast-paced world of healthcare, clinicians often face immense pressure, juggling patient care with extensive administrative tasks. HealthTrack AI aims to alleviate this burden by providing an intelligent layer of support, enabling doctors to focus more on what truly matters: their patients.

This project, initially developed for the Google AI for Action Hackathon, leverages the power of advanced Large Language Models (LLMs), biomedical embeddings, and intuitive real-time UI/UX workflows to deliver a seamless and explainable AI experience.

---

## 💔 The Challenge

Doctors, particularly in high-demand environments like Emergency Departments (ED) and Intensive Care Units (ICU), dedicate a significant portion of their valuable time to:

*   **Documenting symptoms and patient history:** A meticulous but time-consuming process.
*   **Formulating diagnoses:** Requiring careful consideration of various factors and often, sifting through vast amounts of medical knowledge.
*   **Referencing prior cases:** Seeking patterns and insights from past experiences can be challenging and inefficient.

This not only slows down patient throughput but also contributes to increased mental load and potential burnout among healthcare professionals. Existing systems often lack the seamless integration of explainable AI needed to truly augment the clinician's workflow.

---

## ✨ Our Solution: HealthTrack AI

HealthTrack AI offers a sophisticated yet user-friendly platform designed to reduce the time spent on clinical decision-making and documentation. It acts as an intelligent co-pilot, providing clinicians with:

*   **Rapid Symptom Analysis:** Quickly extracts and structures patient-reported symptoms.
*   **AI-Powered Insights:** Predicts potential diagnosis risks with clear, understandable explanations.
*   **Automated Documentation:** Generates editable, structured SOAP (Subjective, Objective, Assessment, Plan) notes.
*   **Contextual Case Referencing:** Provides insights from a vast dataset of de-identified medical records to aid in complex cases.

Our goal is to provide a one-click interface that integrates smoothly into the existing clinical workflow, making advanced AI assistance readily accessible.

---

## 🚀 Key Features

HealthTrack AI is packed with features designed to support clinicians at various stages of patient interaction:

*   **👤 Secure Authentication:**
    *   Easy and secure login using Firebase Google OAuth.

*   **📊 Intuitive Patient Dashboard:**
    *   Visually appealing patient cards displaying key information: Name, Age, Sex, Last Visit Date.
    *   Color-coded Risk Scores (Low/Medium/High) for quick assessment.
    *   Tags/icons for key conditions.
    *   Case status indicators (e.g., Last Edited, Saved).
    *   Powerful spotlight fuzzy search (powered by MongoDB Atlas text search) for quickly finding patients.

*   **📝 Effortless New Case Input:**
    *   Structured forms for capturing comprehensive patient details (Full Name, Age, Sex, Symptoms, Vitals, etc.).
    *   Streamlined process to initiate AI analysis.

*   **🧠 AI-Driven Analysis & Insights:**
    *   **Symptom Extraction & ICD-10 Coding:** Automatically identifies and suggests relevant ICD-10 codes from patient input.
    *   **Differential Diagnosis Support:** Predicts top diagnosis risks with confidence scores and explanations.
    *   **SOAP Note Generation:** Creates structured and editable SOAP notes, significantly reducing documentation time.
    *   **Medical History Analysis:** Identifies potential allergy warnings, medication interactions, and impacts of previous conditions.

*   **⚕️ Similar Cases Panel:**
    *   Provides access to relevant, de-identified similar patient cases from the **MIMIC-IV (Medical Information Mart for Intensive Care) v3.1 database**.
    *   Aids in pattern recognition and clinical decision-making for complex scenarios.
    *   *Disclaimer: This feature is for reference and pattern recognition; professional clinical judgment remains paramount.*

*   **📱 Responsive & Real-Time UI/UX:**
    *   Designed for seamless use across devices.
    *   Persistent header for easy navigation and access to core actions like "+ New Case" and User Profile.

*   **📄 Legal & Informational Pages:**
    *   Comprehensive About Us, Contact Us, Privacy Policy, Terms of Service, and Citations pages.

---

## 🛠️ Technology Highlights

HealthTrack AI is built using a modern, robust technology stack:

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS for a dynamic, responsive, and type-safe user interface.
*   **Backend & Authentication:** Firebase (Google OAuth for authentication, potentially other Firebase services).
*   **Database:** MongoDB Atlas, utilizing its powerful text search capabilities for the patient dashboard and storing patient data, notes, and vectors for similarity search (as per `schema.md`).
*   **AI & Machine Learning:**
    *   Leverages advanced Large Language Models (LLMs) and biomedical embeddings.
    *   Initial development with Google Genkit, with a view towards Vertex AI for production capabilities (enhanced error handling, cost optimization, model tuning, and enterprise security).
*   **Deployment:** Configured for App Hosting (as per `apphosting.yaml`).

---

## 🌍 Ethical AI & Data Usage

*   **Explainable AI:** We are committed to providing transparent AI insights, helping clinicians understand the basis of AI-generated suggestions.
*   **Data Privacy & Security:** Patient data security is paramount. The platform is designed with privacy in mind, leveraging secure services like Firebase and aiming for HIPAA compliance standards.
*   **MIMIC-IV Dataset:** For the "Similar Cases" feature, HealthTrack AI utilizes the MIMIC-IV dataset, a publicly available, de-identified database of medical records from Beth Israel Deaconess Medical Center. This allows for valuable comparative analysis without compromising individual patient privacy. All usage adheres to the data use agreements of the MIMIC-IV dataset.

---

## 🖼️ Visual Tour (Coming Soon!)

*   `[Screenshot of the Login Page]`
*   `[Screenshot of the Patient Dashboard with Patient Cards and Search]`
*   `[Screenshot of the New Case Input Form]`
*   `[Screenshot of the Analysis Page showing Risk Scores, ICD-10 Tags, and SOAP Notes]`
*   `[Screenshot of the Similar Cases Panel]`

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (version 18.x or later recommended)
*   npm or yarn

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/HealthTrack-AI.git
    cd HealthTrack-AI
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of the project and populate it with the necessary Firebase and MongoDB credentials, and any other API keys required. Refer to `src/config/index.ts` and the `docs/vertex-ai-migration-guide.md` for hints on required variables.
    Example structure:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
    # ... other Firebase and API keys

    MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY 
    # ... etc.
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📁 Project Structure

A brief overview of the key directories:

```
HealthTrack-AI/
├── docs/                 # Project documentation (PRD, schema, guides)
├── notebooks/            # Jupyter notebooks (e.g., for embedding experiments)
├── public/               # Static assets
├── src/
│   ├── ai/               # AI logic, Genkit flows, Vertex AI integration
│   ├── app/              # Next.js 13+ app router (pages, layouts, API routes)
│   ├── components/       # Reusable React components (UI, layout, features)
│   ├── config/           # Application configuration (env variables)
│   ├── context/          # React context for global state
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core libraries (Firebase, MongoDB, utilities)
│   └── types/            # TypeScript type definitions
├── tasks/                # Task management files (if using a task runner)
├── tests/                # Jest test files
├── .env.local.example    # Example environment file
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

---

## 🔮 Future Vision

While the current focus is on delivering a robust MVP, the vision for HealthTrack AI extends to:

*   Deeper integration with Electronic Health Record (EHR) systems.
*   Advanced model tuning for specialized medical use cases.
*   Personalized risk prediction models.
*   Expansion of supported languages and medical ontologies.

---

## 📜 Disclaimer

HealthTrack AI is an assistive tool for qualified medical professionals. It is **not** a substitute for professional medical advice, diagnosis, or treatment. All clinical decisions remain the sole responsibility of the attending healthcare provider. The AI-generated information should be critically reviewed and validated before being used for patient care.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE.txt` (if present) or https://opensource.org/licenses/MIT for more information.

---

## 📧 Contact & Feedback

We'd love to hear from you! If you have questions, feedback, or suggestions, please open an issue on this GitHub repository or reach out through the contact methods provided within the application.

**Let's revolutionize healthcare together!**

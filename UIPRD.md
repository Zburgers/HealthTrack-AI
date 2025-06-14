# UI Product Requirements Document (UIPRD) - HealthTrack-AI Revamp

**Version:** 1.0
**Date:** June 14, 2025
**Author:** GitHub Copilot (AI Assistant)
**Project:** HealthTrack-AI UI Overhaul

## 1. Introduction and Vision

HealthTrack-AI is a powerful clinical tool designed to significantly speed up and enhance medical professionals' workflows. While its functionality is robust, the current user interface (UI) and user experience (UX) require a comprehensive overhaul to match the sophistication of its backend.

**Vision:** To transform HealthTrack-AI into a visually stunning, intuitive, and modern application that clinicians love to use. The new UI should feel seamless, trustworthy, and highly professional, drawing inspiration from the design excellence of companies like Stripe, Google, and Apple. The goal is not just a facelift but a deep rethinking of the user interaction to make complex tasks feel effortless.

## 2. Guiding Principles

*   **Modern & Clean:** Embrace contemporary design trends, focusing on clarity, minimalism, and aesthetic appeal.
*   **Intuitive & Effortless:** Interactions should be natural and predictable. Reduce cognitive load wherever possible.
*   **Trustworthy & Professional:** The design must instill confidence, reflecting the critical nature of healthcare data and processes.
*   **Seamless & Smooth:** Utilize animations and transitions (leveraging Framer Motion) to create a fluid and engaging experience.
*   **Accessible:** Design with WCAG guidelines in mind to ensure usability for all users.
*   **Consistent:** Maintain a consistent design language (components, spacing, typography, iconography) across the entire application.
*   **Performance-focused:** UI changes should not negatively impact application load times or responsiveness.

## 3. Scope of Revamp

This UI overhaul encompasses all visual and interactive aspects of the HealthTrack-AI application, including but not limited to:

*   Global Styles (colors, typography, spacing)
*   All Pages (Landing, Login, Dashboard, Patient Detail, New Case, Results, Analysis, Settings, Error pages)
*   All UI Components (buttons, forms, tables, modals, navigation, charts, etc.)
*   Iconography
*   Animations and Micro-interactions

**Functionality Preservation:** All existing functionalities must be preserved and remain easily accessible. The UI revamp should enhance, not hinder, the core capabilities of HealthTrack-AI.

## 4. Design Inspirations

*   **Stripe:** Cleanliness, excellent typography, subtle use of gradients and shadows, clear information hierarchy, smooth transitions.
*   **Google (Material Design 3):** Dynamic color, expressive motion, adaptive layouts, strong component system.
*   **Apple:** Premium feel, attention to detail, intuitive navigation, high-quality iconography, and typography.

## 5. Detailed UI Requirements

### 5.1. Global Styles

#### 5.1.1. Color Palette
*   **Primary:** A calming yet modern shade of blue (e.g., `#4A90E2` or a sophisticated teal) to evoke trust and technology.
*   **Secondary:** Neutral grays (e.g., `#F5F7FA` for backgrounds, `#D0D7E0` for borders, `#6A737D` for secondary text) to provide a clean canvas.
*   **Accent/Call-to-Action:** A vibrant, accessible color (e.g., a bright teal/green like `#1ABC9C` or a warm orange like `#F39C12`) for primary buttons and important actions. Ensure high contrast.
*   **Success:** A clear green (e.g., `#2ECC71`).
*   **Warning:** A noticeable yellow/orange (e.g., `#F1C40F`).
*   **Error/Risk:** A distinct red (e.g., `#E74C3C`).
*   **Dark Mode:** (Future consideration, but design choices should not preclude easy dark mode implementation later). For now, focus on an exceptional light theme.

#### 5.1.2. Typography
*   **Primary Font:** Select a modern, highly readable sans-serif font family. Consider options like Inter, Manrope, or a system font stack for performance and familiarity. Ensure a good range of weights.
    *   Headings: Clear, impactful, and well-spaced.
    *   Body Text: Optimized for legibility.
    *   UI Labels: Crisp and concise.
*   **Font Sizing & Hierarchy:** Establish a clear typographic scale for headings (H1-H6), body text, captions, and labels. Ensure responsive scaling.
*   **Line Height & Spacing:** Optimize line height (e.g., 1.5-1.7 for body text) and letter spacing for readability.

#### 5.1.3. Spacing & Grid System
*   Implement a consistent spacing system (e.g., 4px or 8px grid) for margins, paddings, and layout.
*   Utilize a responsive grid system for page layouts to ensure adaptability across screen sizes.

#### 5.1.4. Shadows & Borders
*   Use subtle, modern shadows to create depth and elevate interactive elements (e.g., cards, modals, dropdowns). Avoid heavy, dated shadow effects.
*   Borders should be light and used purposefully to define sections or interactive areas.

#### 5.1.5. Iconography
*   Adopt a single, high-quality, and consistent icon set. Consider options like Heroicons, Lucide Icons (already in use via ShadCN), or a custom set if budget allows.
*   Icons should be clear, recognizable, and appropriately sized.

### 5.2. Component-Specific Revamp (Leveraging ShadCN/UI, Radix UI, Framer Motion)

For all components listed in `src/components/ui/` and custom components:

*   **Buttons (`button.tsx`):**
    *   Clear visual hierarchy (primary, secondary, tertiary/ghost, destructive).
    *   Subtle hover and active states with smooth transitions (Framer Motion).
    *   Option for icons within buttons.
    *   Ensure accessible focus states.
*   **Forms (`form.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `label.tsx`):**
    *   Modern, clean input fields with clear focus states.
    *   Enhanced visual feedback for validation (success, error).
    *   Improved usability for select dropdowns and date pickers (`calendar.tsx`).
    *   Consistent styling for all form elements.
*   **Cards (`card.tsx`):**
    *   Modernized appearance with subtle shadows and rounded corners.
    *   Flexible layout options for card content (header, body, footer).
    *   Use for displaying summaries, patient snippets, etc.
*   **Tables (`table.tsx`):**
    *   Improved readability: better row/cell spacing, clear typography.
    *   Subtle hover states for rows if interactive.
    *   Consider options for sortable columns and pagination if not already robust.
*   **Modals/Dialogs (`dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `popover.tsx`):**
    *   Smooth entry/exit animations (Framer Motion).
    *   Clean and focused layout. Clear call-to-action buttons.
    *   Ensure proper ARIA attributes for accessibility.
    *   Sheets (side panels) should be used effectively for contextual information or actions.
*   **Navigation (Header, Sidebar - `Header.tsx`, `MainLayout.tsx`, `sidebar.tsx`, `menubar.tsx`):**
    *   **Header:** Clean, modern, with clear branding (new logo/wordmark if applicable) and user profile access.
    *   **Sidebar:** Intuitive navigation structure. Consider collapsible sections for larger menus. Clear visual indication of the active page. Modern icons.
*   **Notifications/Toasts (`toast.tsx`, `toaster.tsx`, `alert.tsx`):**
    *   Non-intrusive yet noticeable.
    *   Clear visual distinction for different types (info, success, warning, error).
    *   Smooth animations for appearance and disappearance.
*   **Data Display (`badge.tsx`, `progress.tsx`, `skeleton.tsx`, `avatar.tsx`):**
    *   **Badges:** Modern styling for tags and status indicators.
    *   **Progress Bars:** Visually appealing and clear.
    *   **Skeletons:** Implement elegant loading states for a smoother perceived performance.
    *   **Avatars:** Clean and modern.
*   **Interactive Elements (`accordion.tsx`, `dropdown-menu.tsx`, `tabs.tsx`, `slider.tsx`, `tooltip.tsx`):**
    *   Enhance with smooth transitions and modern styling.
    *   Ensure clear visual feedback on interaction.
    *   Tooltips should be informative and unobtrusive.
*   **Charts (`chart.tsx`):**
    *   Ensure charts are visually appealing, easy to understand, and interactive (e.g., tooltips on hover).
    *   Use the new color palette effectively.
*   **Animations (`animations.tsx`):**
    *   Systematically integrate Framer Motion for page transitions, list item animations, modal pop-ups, and micro-interactions to enhance the "wow" factor.
    *   Animations should be purposeful, not distracting.

### 5.3. Page-Specific Revamp

#### 5.3.1. Landing Page (`src/app/page.tsx`)
*   **Goal:** Create a stunning first impression. Clearly articulate HealthTrack-AI's value proposition.
*   **Elements:**
    *   Compelling hero section with a strong headline, concise explanatory text, and a primary call-to-action (e.g., "Get Started" or "Learn More").
    *   Visually engaging graphics or subtle animations.
    *   Sections highlighting key features and benefits.
    *   Testimonials or trust signals (if applicable).
    *   Clean footer with relevant links.
*   **Inspiration:** Stripe's landing page for clarity and professionalism.

#### 5.3.2. Login Page (`src/app/login/page.tsx`)
*   **Goal:** Simple, secure, and trustworthy.
*   **Elements:**
    *   Clean layout with application logo/name.
    *   Clear input fields for credentials.
    *   Prominent login button.
    *   Links for "Forgot Password" and potentially "Sign Up" (if applicable).
    *   Minimalistic design to focus the user on the task.

#### 5.3.3. Dashboard (`src/app/dashboard/page.tsx`)
*   **Goal:** Provide a clear, actionable overview for the clinician.
*   **Elements:**
    *   Modernized layout with `MainLayout.tsx`.
    *   Key metrics or summaries presented in visually appealing cards or charts.
    *   Easy access to patient lists/search.
    *   Quick actions (e.g., "Start New Case").
    *   Recent activity feed if relevant.

#### 5.3.4. Patient Detail Page (`src/app/dashboard/patient/[id]/page.tsx`)
*   **Goal:** Present comprehensive patient information in an organized and easily digestible manner.
*   **Elements:**
    *   Clear patient identification section.
    *   Tabbed or sectioned layout for different types of information (e.g., demographics, visit history, notes, analyses).
    *   Improved presentation of medical history, SOAP notes, and analysis results.
    *   Easy access to actions related to the patient (e.g., "Edit Details," "Start New Analysis").

#### 5.3.5. New Case Page (`src/app/new-case/page.tsx` & `NewCaseForm.tsx`)
*   **Goal:** Streamline the process of creating a new case.
*   **Elements:**
    *   Revamp `NewCaseForm.tsx` for a multi-step or clearly sectioned form if complex.
    *   Improved input fields, selectors, and text areas.
    *   Clear progress indication if a multi-step form.
    *   Visually guide the user through the required information.

#### 5.3.6. Results Page (`src/app/results/page.tsx`)
*   **Goal:** Present analysis results in a stunning, clear, and actionable way.
*   **Components to Revamp:**
    *   `ResultsDisplay.tsx`: Overall layout and presentation of results.
    *   `RiskGauge.tsx`: Modernize the risk gauge for better visual impact and clarity.
    *   `SimilarCasesPanel.tsx`: Improve the display of similar cases, perhaps using cards or an improved list view.
    *   `SoapNotesEditor.tsx`: Enhance the editor's UI for better usability and visual appeal. Consider WYSIWYG controls if appropriate.
    *   `ExportModal.tsx`: Clean and simple modal for export options.
*   **Consider:** Using charts and visual elements more effectively to communicate insights.

#### 5.3.7. Analysis Page (`src/app/analysis/page.tsx`)
*   **Goal:** Provide an interactive and visually engaging platform for exploring analysis data.
*   **Elements:**
    *   Focus on data visualization. Use `chart.tsx` capabilities to their fullest.
    *   Interactive filters and controls.
    *   Layout that allows for easy comparison and exploration of data points.
    *   Make it feel dynamic and responsive to user input.

#### 5.3.8. Settings Page (`src/app/settings/page.tsx`)
*   **Goal:** Clean, organized, and easy to use.
*   **Elements:**
    *   Group settings logically (e.g., Profile, Preferences, Integrations).
    *   Use clear labels and input controls (toggles, dropdowns, text fields).
    *   Ensure a professional and uncluttered appearance.

#### 5.3.9. Error Page (`src/app/error.tsx`)
*   **Goal:** Provide a user-friendly and helpful error message.
*   **Elements:**
    *   Clear indication that an error occurred.
    *   Simple, apologetic message.
    *   Option to return to the homepage or try again.
    *   Maintain the new modern aesthetic.

### 5.4. General UI Enhancements
*   **Loading States:** Implement consistent and visually appealing skeleton loaders (`skeleton.tsx`) for data-heavy sections to improve perceived performance.
*   **Empty States:** Design informative and friendly empty states for lists, tables, or sections where no data is available (e.g., "No patients found," "No analyses yet").
*   **Responsive Design:** Ensure all pages and components are fully responsive and provide an excellent experience on desktops, tablets, and mobile devices (if mobile is a target). `use-mobile.tsx` hook can be leveraged.
*   **Accessibility (A11y):**
    *   Ensure sufficient color contrast.
    *   Proper keyboard navigation for all interactive elements.
    *   ARIA attributes where necessary.
    *   Semantic HTML structure.

## 6. Technology Stack & Libraries to Leverage

*   **Next.js & React:** Core framework.
*   **TypeScript:** For type safety.
*   **Tailwind CSS:** For utility-first styling. Continue to leverage its power.
*   **ShadCN/UI & Radix UI:** Continue building upon these excellent component libraries, customizing them to fit the new design language.
*   **Framer Motion:** For all animations and transitions.
*   **Lucide Icons (or chosen set):** For iconography.
*   **`src/app/globals.css`:** For global style overrides and base styles.

## 7. Non-Goals (for this iteration)

*   Major changes to backend logic or API endpoints.
*   Introduction of entirely new core features (unless directly supporting a UI improvement, e.g., a new way to visualize existing data).
*   Complete rebranding (logo, core brand identity) unless a new simple wordmark is needed for the header. Focus is on the application UI itself.
*   Full dark mode implementation (design with it in mind for the future).

## 8. Success Metrics

*   Qualitative feedback from users (if possible) indicating improved satisfaction and ease of use.
*   Visual appeal aligning with modern standards set by Stripe, Google, Apple.
*   Improved task completion times for common workflows (long-term observation).
*   Consistency and polish across the entire application.
*   No degradation in performance or accessibility.

## 9. Process

1.  **UIPRD Review & Approval.**
2.  **Task Breakdown by Taskmaster AI.**
3.  **Iterative Design & Development:**
    *   Start with global styles (colors, typography).
    *   Revamp shared layouts and navigation.
    *   Tackle individual components and pages one by one, starting with high-impact areas like the Landing Page, Dashboard, and Results Page.
4.  **Regular Reviews & Feedback.**
5.  **Testing (including responsive and accessibility testing).**

This UIPRD will serve as the guiding document for the UI overhaul of HealthTrack-AI. It should be considered a living document, subject to refinement as the project progresses.

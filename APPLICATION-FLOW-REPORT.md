# 🏥 HealthTrack-AI Application Flow Report

## 📱 Application Overview

**HealthTrack-AI** is a comprehensive AI-powered clinical decision support system built as a **hybrid desktop/web application** using Next.js and Electron. The application provides intelligent healthcare analytics, patient management, and AI-driven clinical insights.

---

## 🖥️ Electron Desktop Application Flow

### **Entry Point & Initialization**
- **Main Process**: `electron/main.ts`
- **Window Configuration**: 1400x900px (min: 1200x800)
- **Icon**: `public/assets/healthtrack.ico` ✅ (Recently Fixed)
- **Preload Script**: `electron/preload.ts` for secure IPC
- **Development URL**: `http://localhost:9002`
- **Production**: Static files from `out/index.html`

### **Local Database Integration**
- **Local MongoDB**: Embedded database via `electron/db/local-db.ts`
- **IPC Handlers**: Secure communication in `electron/ipc/handlers.ts`
- **Database Path**: System-specific local storage
- **Collections**: Dynamic detection (`ai_cache`, `patients`, etc.)

### **Security Features**
- Context isolation enabled
- Node integration disabled
- External link protection
- Navigation security controls

---

## 🌐 Web Application Architecture

### **Framework & Structure**
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS + Radix UI components
- **Authentication**: Firebase Auth with Google OAuth
- **State Management**: React Context (`AppStateContext`)
- **Animations**: Framer Motion

---

## 📍 Complete Page Flow & User Journey

### **1. Landing/Marketing Pages** 
*(Public - No Authentication Required)*

#### 🏠 **Homepage** (`/`)
- **File**: `src/app/page.tsx` (729 lines)
- **Content**: Marketing landing page with feature highlights
- **Components**: 
  - Feature cards with animations
  - Tech showcases
  - Call-to-action buttons leading to `/login`
- **Key Features Shown**:
  - AI-Driven Insights
  - ICD-10 Coding automation
  - Visual Analytics
  - HIPAA compliance

#### 📄 **Legal & Information Pages**
- **About** (`/about`): Developer info and vision
- **Privacy Policy** (`/privacy-policy`): HIPAA compliance details
- **Terms of Service** (`/terms-of-service`): Usage terms
- **Contact** (`/contact-us`): Support information

---

### **2. Authentication Flow**

#### 🔐 **Login Page** (`/login`)
- **File**: `src/app/login/page.tsx` (273 lines)
- **Authentication**: Firebase + Google OAuth
- **Features**:
  - Animated feature highlights during login
  - Loading states with sophisticated animations
  - Auto-redirect to `/dashboard` on success
  - Error handling with toast notifications
- **User Experience**: Modern glass-morphism design with feature showcases

---

### **3. Main Application Flow** 
*(Authenticated Users Only)*

#### 🏠 **Dashboard** (`/dashboard`)
- **File**: `src/app/dashboard/page.tsx` (835 lines)
- **Purpose**: Central hub for patient management
- **Key Features**:
  - **Patient List**: Grid/table view with search and filtering
  - **Quick Stats**: Total patients, risk levels, recent activity
  - **Risk Assessment**: Color-coded patient risk indicators
  - **Search & Filter**: By name, risk level, date ranges
  - **Action Buttons**: "New Case" and individual patient actions
- **Components**:
  - `PatientAvatar` for user representation
  - Risk gauges and progress indicators
  - Animated patient cards with hover effects
  - Advanced filtering and sorting options

#### 👤 **Patient Detail View** (`/dashboard/patient/[id]`)
- **File**: `src/app/dashboard/patient/[id]/page.tsx` (1055+ lines)
- **Purpose**: Comprehensive patient information and management
- **Tabs Structure**:
  - **Overview**: Basic info, vitals, risk scores
  - **Medical History**: Past diagnoses, treatments
  - **SOAP Notes**: Clinical documentation
  - **Analysis**: AI insights and recommendations
  - **Timeline**: Treatment progression
- **Key Features**:
  - Real-time vital signs display
  - ICD-10 code management
  - Treatment timeline visualization
  - Patient deletion with confirmation
  - Export functionality

#### 📊 **Archived Patients** (`/dashboard/archived`)
- **Purpose**: Historical patient data management
- **Features**: Similar to main dashboard but for archived cases

---

### **4. Clinical Workflow**

#### ➕ **New Case Creation** (`/new-case`)
- **File**: `src/app/new-case/page.tsx` (38 lines)
- **Component**: `NewCaseForm` (949 lines)
- **Form Sections**:
  - **Patient Demographics**: Name, age, gender, visit date
  - **Primary Complaint**: Chief complaint and symptoms
  - **Vital Signs**: Temperature, BP, heart rate, etc.
  - **Clinical Observations**: Physical examination findings
  - **Medical History**: Relevant past medical history
  - **Current Medications**: Active prescriptions
- **Features**:
  - Real-time form validation
  - Progress indicators
  - Expandable sections
  - Smart defaults and suggestions
- **Flow**: After submission → Redirects to `/analysis`

#### 🧠 **Analysis & Results** (`/analysis`)
- **File**: `src/app/analysis/page.tsx` (1415+ lines)
- **Purpose**: AI-powered clinical analysis and insights
- **Main Components**:
  - **Risk Assessment**: Comprehensive risk scoring
  - **SOAP Notes Editor**: Clinical documentation tools
  - **Similar Cases**: AI-matched historical cases
  - **ICD-10 Suggestions**: Automated coding recommendations
  - **Differential Diagnosis**: AI-generated possibilities
  - **Export Options**: PDF, JSON, clinical formats
- **Tabs System**:
  - **Analysis Overview**: Key insights and risk factors
  - **Detailed Results**: In-depth AI analysis
  - **SOAP Notes**: Structured clinical notes
  - **Similar Cases**: Pattern matching results
  - **Charts & Visualizations**: Data representations
- **AI Integration**: Real-time analysis using Vertex AI/Gemini

---

### **5. Settings & Configuration**

#### ⚙️ **Settings Page** (`/settings`)
- **File**: `src/app/settings/page.tsx` (162 lines)
- **Sections**:
  - **User Profile**: Avatar, name, email management
  - **Theme Settings**: Light/dark mode toggle
  - **Database Settings**: Local/remote database management
  - **Notification Preferences**: Alert configurations
- **Components**:
  - `DatabaseSettings`: Connection status, export tools
  - User avatar with fallback initials
  - Theme switcher with Next.js themes

---

### **6. Development & Testing**

#### 🎨 **Test Styles** (`/test-styles`)
- **Purpose**: Component showcase and UI testing
- **Content**: All UI components in various states

#### 🐛 **Debug Configuration** (`/debug-config`)
- **Purpose**: Development debugging tools
- **Features**: System information and configuration display

---

## 🔄 **Navigation & Layout System**

### **Main Layout** (`MainLayout`)
- **File**: `src/components/layout/MainLayout.tsx` (105 lines)
- **Structure**:
  - **Header**: Fixed top navigation with user menu
  - **Sidebar**: Collapsible navigation (desktop only)
  - **Main Content**: Dynamic page content with animations
- **Navigation Items**:
  - Dashboard (`/dashboard`)
  - New Case (`/new-case`)
  - Analysis (`/analysis`)
  - Settings (`/settings`)
  - Test Styles (`/test-styles`)

### **Header Component**
- **File**: `src/components/layout/Header.tsx` (83 lines)
- **Features**:
  - HealthTrack logo and branding
  - User avatar dropdown
  - Sign out functionality
  - Responsive design

---

## 🔌 **API Endpoints & Integrations**

### **Next.js API Routes**
- **Health Check**: `/api/health` - Application status
- **Patient Management**: 
  - `/api/patients` - CRUD operations
  - `/api/patients/[id]` - Individual patient operations
- **AI Analysis**:
  - `/api/v2/analyze-patient` - Primary AI analysis
  - `/api/v2/enhance-notes` - SOAP note enhancement
  - `/api/v2/patient-summary` - Summary generation
- **Similar Cases**: `/api/similar-cases` - Pattern matching
- **Case Details**: `/api/case-details/[id]` - Detailed case info
- **Export**: `/api/export/database` - Data export functionality
- **Error Reporting**: `/api/error-reports` - Error logging

### **External AI Services**
- **Google Vertex AI**: Primary AI processing
- **Gemini Models**: Text analysis and generation
- **Vector Embeddings**: Case similarity matching

---

## 💾 **Database Architecture**

### **Hybrid Database System**
- **Local MongoDB**: Patient data, case cache
- **Remote MongoDB Atlas**: Embeddings, shared data
- **Collections**:
  - `patients`: Patient records
  - `ai_cache`: Cached AI responses
  - `case_embeddings`: Vector similarity data
  - Dynamic collections based on usage

---

## 🚀 **Development & Build Process**

### **Available Scripts**
- **Development**: `npm run dev` (port 9002)
- **Electron Dev**: `npm run electron:start`
- **Build**: `npm run build`
- **Electron Build**: `npm run electron:build-win`

### **Key Configuration Files**
- `package.json`: Main dependencies and scripts
- `next.config.ts`: Next.js configuration
- `tailwind.config.ts`: Styling configuration
- `electron/main.ts`: Electron main process

---

## 🎯 **User Experience Flow Summary**

1. **Entry**: User opens desktop app or visits web URL
2. **Authentication**: Google OAuth login required
3. **Dashboard**: Central patient management hub
4. **Case Creation**: Comprehensive patient data entry
5. **AI Analysis**: Automated clinical insights generation
6. **Results Review**: SOAP notes, risk assessment, recommendations
7. **Patient Management**: Ongoing case tracking and updates
8. **Settings**: Profile and system configuration

---

## 📊 **Current Status & Health**

- ✅ **Icon Fixed**: Electron now uses correct healthtrack.ico
- ✅ **Database Integration**: Local MongoDB working with IPC
- ✅ **Authentication**: Firebase Google OAuth functional
- ✅ **AI Integration**: Vertex AI/Gemini connected
- ✅ **UI/UX**: Modern, responsive design with animations
- ✅ **Data Flow**: Complete patient lifecycle management

The application provides a comprehensive, professional-grade clinical decision support system with robust desktop integration and modern web technologies.

Authenticated
Welcome back!
HealthTrack

naki
Dashboard
New Case
Analysis
Settings
Test Styles
Settings
Manage your profile and application preferences.

naki
naki
ekagra7865@gmail.com
Edit Profile (Soon)
Preferences
Customize your application experience.

Light Mode
Other notification preferences and display options will be available here soon.

Adjust More Preferences (Soon)
Account & Security
Manage your account details and security settings.
Options for password changes (if applicable), two-factor authentication, and viewing login activity will be available here in the future.

Manage Account
Notifications
Configure how you receive notifications from HealthTrack AI.
Detailed notification settings for different types of alerts and updates will appear here soon. You'll be able to choose between email, in-app, or push notifications.

Configure Notifications
Database & Storage
Manage your database settings and data storage preferences
Connection Status
Hybrid (Local + Remote)
Database Information
Type:
hybrid

Local Path:
C:\Users\ekagr\AppData\Roaming\healthtrack\database

Total Size:
10 MB

Local Database URI:
Local Connection:
Connected
Local Database:
Collections
ai_cache
3 documents
local
patients
1 documents
local
local_embeddings
0 documents
local
notes
0 documents
local
db_metadata
0 documents
local
Actions
Export Database
Change Storage Location
Refresh Info
Advanced Settings
2
PS D:\Hustle\Projects\AIAGoogle\healthtrack\HealthTrack-AI> npm run electron:dev

> healthtrack@0.1.1 electron:dev
> concurrently --names "NEXT,ELECTRON" --prefix-colors "cyan,magenta" --prefix "[{name}]" "npm run dev:electron" "wait-on --interval 1000 --timeout 120000 --httpTimeout 5000 http://localhost:9002/api/health && electron ."

[NEXT] 
[NEXT] > healthtrack@0.1.1 dev:electron
[NEXT] > cross-env ELECTRON_ENV=true next dev --turbopack -p 9002
[NEXT] 
[NEXT]    ▲ Next.js 15.3.3 (Turbopack)
[NEXT]    - Local:        http://localhost:9002  
[NEXT]    - Network:      http://172.17.32.1:9002
[NEXT]    - Environments: .env
[NEXT] 
[NEXT]  ✓ Starting...
[NEXT]  ✓ Ready in 1619ms
[NEXT]  ⚠ Webpack is configured while Turbopack is not, which may cause problems.
[NEXT]  ⚠ See instructions if you need to configure Turbopack:
[NEXT]   https://nextjs.org/docs/app/api-reference/next-config-js/turbo
[NEXT] 
[NEXT]  ○ Compiling /api/health ...
[NEXT]  ✓ Compiled /api/health in 1249ms
[NEXT]  HEAD /api/health/ 200 in 1555ms
[NEXT]  HEAD /api/health/ 200 in 631ms 
[NEXT]  HEAD /api/health/ 200 in 1557ms
[ELECTRON] 
[ELECTRON] 🚀 Initializing HealthTrack-AI Electron app...
[ELECTRON] 🔧 Initializing local database...
[ELECTRON] 🚀 Starting local MongoDB server...
[ELECTRON] 📂 Database path: C:\Users\ekagr\AppData\Roaming\healthtrack\database
[ELECTRON] ✅ Local MongoDB started at: mongodb://127.0.0.1:27018/
[ELECTRON] ✅ Connected to local MongoDB database   
[ELECTRON] 🏗️ Setting up collections and indexes...
[ELECTRON] 📊 Created index: isDeleted_index      
[ELECTRON] 📊 Created index: active_patients_index
[ELECTRON] 📊 Created index: name_search_index
[ELECTRON] 📊 Created AI cache index
[ELECTRON] ✅ Collections and indexes initialized successfully
[ELECTRON] ✅ Local database initialized: mongodb://127.0.0.1:27018/
[ELECTRON] ✅ Local database available
[ELECTRON] 🚀 Creating Electron window...
[ELECTRON] 🔗 Loading Next.js app from http://localhost:9002
[ELECTRON] 🔌 Setting up IPC handlers...
[ELECTRON] 🔧 Trying to load handlers.ts...
[ELECTRON] ⚠️ handlers.ts failed, trying handlers.js...
[ELECTRON] ✅ handlers.js loaded, exports: [ 'setupIpcHandlers' ]
[ELECTRON] 🎯 Found setupIpcHandlers function, calling it...
[ELECTRON] 🔌 Setting up test IPC handlers...
[ELECTRON] ✅ Test IPC handlers setup complete
[ELECTRON] ✅ Unified IPC handlers loaded successfully
[ELECTRON] 🧠 Initializing smart caching system...
[ELECTRON] ✅ HealthTrack-AI Electron app initialized successfully
[NEXT]  ○ Compiling / ...
[NEXT]  ✓ Compiled / in 6s
[NEXT]  GET / 200 in 7866ms
[ELECTRON] ✅ HealthTrack-AI Electron window ready!
[ELECTRON] 🎉 Successfully connected to Next.js server!
[ELECTRON] ⚠️ Cache warming failed to initialize: Unexpected strict mode reserved word
[NEXT]  ○ Compiling /login ...
[NEXT]  ✓ Compiled /login in 4.3s
[NEXT]  GET /login/ 200 in 4874ms
[ELECTRON] 🎉 Successfully connected to Next.js server!
[NEXT]  GET /login/ 200 in 392ms
[NEXT]  ○ Compiling /dashboard ...
[NEXT]  ✓ Compiled /dashboard in 27.6s
[NEXT]  GET /dashboard/ 200 in 28346ms
[NEXT]  GET /dashboard/ 200 in 8261ms
[NEXT]  ○ Compiling /api/patients ...
[NEXT]  ✓ Compiled /api/patients in 5.3s
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] ✅ Connected to local MongoDB
[NEXT] ✅ Connected to remote MongoDB Atlas
[NEXT] ✅ Successfully connected to database (universal framework)
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "patients": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT]  GET /api/patients/ 200 in 7874ms
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "patients": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT]  GET /api/patients/?archivedOnly=true 200 in 160ms
[NEXT]  ○ Compiling /new-case ...
[NEXT]  ✓ Compiled /new-case in 7.9s
[NEXT]  GET /new-case/ 200 in 8238ms
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "patients": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT]  POST /api/patients/ 201 in 328ms
[NEXT]  ○ Compiling /dashboard/patient/[id] ...
[NEXT]  ✓ Compiled /dashboard/patient/[id] in 3.6s
[NEXT]  GET /dashboard/patient/6862f9608b52f6677ea9be9b/ 200 in 5132ms
[NEXT] [Vertex AI] Request completed {
[NEXT]   timestamp: '2025-06-30T20:53:58.395Z',
[NEXT]   model: 'gemini-2.0-flash-001',
[NEXT]   type: 'generateContent',
[NEXT]   promptLength: 2285,
[NEXT]   responseLength: 1922,
[NEXT]   duration: 5754,
[NEXT]   context: {
[NEXT]     workflow: 'analyze_patient_symptoms',
[NEXT]     patientId: 'Ravi Sharma_1751316832640',
[NEXT]     templateVersion: 'v2_optimized'
[NEXT]   }
[NEXT] }
[NEXT] [Vertex AI] Request completed {
[NEXT]   timestamp: '2025-06-30T20:53:58.401Z',
[NEXT]   model: 'gemini-2.0-flash-001',
[NEXT]   type: 'generateStructuredContent',
[NEXT]   promptLength: 2285,
[NEXT]   responseLength: 1910,
[NEXT]   duration: 5757,
[NEXT]   context: {
[NEXT]     workflow: 'analyze_patient_symptoms',
[NEXT]     patientId: 'Ravi Sharma_1751316832640',
[NEXT]     templateVersion: 'v2_optimized'
[NEXT]   },
[NEXT]   schemaValidation: 'success'
[NEXT] }
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "patients": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT] Successfully updated patient 6862f9608b52f6677ea9be9b with AI analysis.
[NEXT]  ○ Compiling /api/patients/[id] ...
[NEXT]  ✓ Compiled /api/patients/[id] in 1022ms
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "patients": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT]  GET /api/patients/6862f9608b52f6677ea9be9b/ 200 in 2767ms
[NEXT]  ○ Compiling /analysis ...
[NEXT]  ✓ Compiled /analysis in 11s
[NEXT]  GET /analysis/ 200 in 11188ms
[NEXT]  ○ Compiling /api/v2/analyze-and-summarize ...
[NEXT]  ✓ Compiled /api/v2/analyze-and-summarize in 7.5s
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "ai_cache": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT] 🧠 Starting analyze and summarize workflow with smart caching...
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "ai_cache": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT] ❌ Cache MISS for analyze-and-summarize-patient
[NEXT] 🧮 Computing result for analyze-and-summarize-patient...
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "ai_cache": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT] 💾 Cached result for analyze-and-summarize-patient
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "ai_cache": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT]  POST /api/v2/analyze-and-summarize/ 200 in 26199ms
[NEXT]  ○ Compiling /api/similar-cases ...
[NEXT]  ✓ Compiled /api/similar-cases in 4.6s
[NEXT] [VectorSearch] Using Atlas Vector Search Index Name: "case_index" (From ENV: "case_index")
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] Input text truncated from 315 to 286 characters to meet token limits.
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "ai_cache": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT] [API Similar Cases] Prepared inputText for embedding (length: 315): "Patient appears anxious and mildly diaphoretic. Chest pain is described as pressure-like, non-radiating, worsens with exertion, 6/10 intensity. Mild tenderness in the epigastric region. No signs of cyanosis or edema. ECG pending. Symptoms suggest possible unstable angina or GERD mimic. Needs further investigation."
[NEXT] [API Similar Cases] Note: Character-based truncation to approx. <100 tokens will occur in getEmbeddings if needed. Vertex AI will determine final token count.
[NEXT] Defaulting to 'auto' which will select the first provider available for the model, sorted by the user's order in https://hf.co/settings/inference-providers.
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "case_embeddings": remote (Electron: true, Requested DB: healthtrack)
[NEXT] ☁️ Using REMOTE database: healthtrack
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "ai_cache": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT]  POST /api/similar-cases/ 200 in 11800ms
[NEXT]  GET /dashboard/ 200 in 234ms
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "patients": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT]  GET /api/patients/ 200 in 262ms
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "patients": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT]  GET /api/patients/?archivedOnly=true 200 in 216ms
[NEXT]  GET /dashboard/patient/6862f9608b52f6677ea9be9b/ 200 in 193ms
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Environment check - ELECTRON_ENV: true
[NEXT] 🔍 Environment check - NODE_ENV: development
[NEXT] 🔍 Environment check - process.versions.electron: undefined
[NEXT] ✅ Detected Electron environment via ELECTRON_ENV
[NEXT] 🔍 Database routing for collection "patients": local (Electron: true, Requested DB: healthtrack)
[NEXT] 📱 Using LOCAL database: healthtrack_local
[NEXT]  GET /api/patients/6862f9608b52f6677ea9be9b/ 200 in 250ms
[NEXT]  ○ Compiling /settings ...
[NEXT]  ✓ Compiled /settings in 3.2s
[NEXT]  GET /settings/ 200 in 3341ms
[ELECTRON] 🔍 Test: Getting database info...
[ELECTRON] 🔍 Found collections: [ 'ai_cache', 'patients', 'local_embeddings', 'notes', 'db_metadata' ]

==================================

this is the settings page where you can see the database information, this is still using mongodb 

Then you can see all the logs where i go through my usual customer ux flow as you can see in all of the workflows of the working application it is using the mongodb database only 
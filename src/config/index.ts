// This file centralizes the configuration for the application, primarily from environment variables.
// Ensure you have a .env.local file in the root of your project with these variables defined.

// Firebase Configuration
// These details can be found in your Firebase project settings.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional, for Analytics
};

// Check for missing Firebase configuration keys during development
if (process.env.NODE_ENV !== 'production') {
  const requiredFirebaseKeys: (keyof typeof firebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];
  for (const key of requiredFirebaseKeys) {
    if (!firebaseConfig[key]) {
      console.warn(
        `Firebase config key "${key}" is missing. Please check your .env.local file and ensure NEXT_PUBLIC_FIREBASE_${key.toUpperCase()} is set.`
      );
    }
  }
}


// MongoDB Atlas Configuration (Guidance)
// Your MongoDB connection string. It's best to keep this server-side only.
// Example: MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority"
// This variable (MONGODB_URI) would typically be used in backend API routes or server actions if you directly connect to MongoDB.
// For this application, direct MongoDB interaction is not part of the scaffolded UI features,
// but this is where you'd manage its configuration if needed.
// const MONGODB_URI = process.env.MONGODB_URI;


// Vertex AI / Genkit Configuration (Guidance)
// Genkit typically uses Google Cloud Application Default Credentials (ADC).
// Ensure your environment is authenticated (e.g., via `gcloud auth application-default login`).
// Specific Vertex AI project ID or location might be needed by Genkit plugins if not inferred.
// Genkit's `googleAI` plugin may look for `GOOGLE_API_KEY` or use ADC.
// The `@genkit-ai/googleai` plugin initialized in `src/ai/genkit.ts` handles this.
// See Genkit documentation for specific environment variable needs for Google AI.
// Example:
// GOOGLE_API_KEY="your_google_ai_api_key" (if using API keys for Gemini)
// Or ensure `GOOGLE_APPLICATION_CREDENTIALS` is set if using service accounts for ADC.

export const APP_CONFIG = {
  // Add any other app-wide configurations here
  appName: 'HealthTrack AI',
};

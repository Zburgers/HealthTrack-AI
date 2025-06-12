
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

// Placeholders to check against - ensure these match the exact strings used as defaults if any.
const PLACEHOLDER_API_KEY = "YOUR_ACTUAL_API_KEY_HERE";
const PLACEHOLDER_AUTH_DOMAIN = "YOUR_ACTUAL_AUTH_DOMAIN_HERE";
const PLACEHOLDER_PROJECT_ID = "YOUR_ACTUAL_PROJECT_ID_HERE";
const PLACEHOLDER_APP_ID = "YOUR_ACTUAL_APP_ID_HERE";
// Add other placeholders if necessary, e.g., for storageBucket, messagingSenderId

// Check for missing or placeholder Firebase configuration keys.
// Throw errors during development for easier debugging.
if (process.env.NODE_ENV !== 'production') {
  const criticalKeys: Array<{ key: keyof typeof firebaseConfig, envVarName: string, placeholder?: string }> = [
    { key: 'apiKey', envVarName: 'NEXT_PUBLIC_FIREBASE_API_KEY', placeholder: PLACEHOLDER_API_KEY },
    { key: 'authDomain', envVarName: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', placeholder: PLACEHOLDER_AUTH_DOMAIN },
    { key: 'projectId', envVarName: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', placeholder: PLACEHOLDER_PROJECT_ID },
    { key: 'appId', envVarName: 'NEXT_PUBLIC_FIREBASE_APP_ID', placeholder: PLACEHOLDER_APP_ID },
    // storageBucket and messagingSenderId are often not strictly required for auth to initialize
    // but are good to have for full Firebase functionality. Add them here if they become critical.
    // { key: 'storageBucket', envVarName: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', placeholder: "YOUR_ACTUAL_STORAGE_BUCKET_HERE" },
    // { key: 'messagingSenderId', envVarName: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', placeholder: "YOUR_ACTUAL_MESSAGING_SENDER_ID_HERE" },
  ];

  for (const { key, envVarName, placeholder } of criticalKeys) {
    const value = firebaseConfig[key];
    if (!value) {
      throw new Error(
        `Firebase configuration error: The environment variable "${envVarName}" for config key "${key}" is missing or empty in your .env.local file. ` +
        `Please set it with the correct value from your Firebase project settings. ` +
        `After updating .env.local, you MUST restart your Next.js development server.`
      );
    }
    // Check if the value exactly matches a known placeholder
    if (placeholder && value === placeholder) {
      throw new Error(
        `Firebase configuration error: The environment variable "${envVarName}" for config key "${key}" appears to be using the placeholder value ("${value}"). ` +
        `Please replace it with your actual credential from your Firebase project in .env.local. ` +
        `After updating .env.local, you MUST restart your Next.js development server.`
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
const MONGODB_PW = "2kzWwEiYR4lHLWFh"
if (!MONGODB_PW) {
  throw new Error(
    `MongoDB configuration error: The environment variable "MONGODBPW" is missing or empty in your .env file.`
  );
}

export const MONGODB_URI = `mongodb+srv://naki:${MONGODB_PW}@cluster0.hrnm8fq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Vertex AI / Genkit Configuration (Guidance)
// Genkit typically uses Google Cloud Application Default Credentials (ADC).
// Ensure your environment is authenticated (e.g., via \`gcloud auth application-default login\`).
// Specific Vertex AI project ID or location might be needed by Genkit plugins if not inferred.
// Genkit's \`googleAI\` plugin may look for \`GOOGLE_API_KEY\` or use ADC.
// The \`@genkit-ai/googleai\` plugin initialized in \`src/ai/genkit.ts\` handles this.
// See Genkit documentation for specific environment variable needs for Google AI.
// Example:
// GOOGLE_API_KEY="your_google_ai_api_key" (if using API keys for Gemini)
// Or ensure \`GOOGLE_APPLICATION_CREDENTIALS\` is set if using service accounts for ADC.

export const APP_CONFIG = {
  // Add any other app-wide configurations here
  appName: 'HealthTrack AI',
};

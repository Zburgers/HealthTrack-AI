// This file centralizes the configuration for the application, primarily from environment variables.
// Ensure you have a .env.local file in the root of your project with these variables defined.

// Firebase Configuration
// These details can be found in your Firebase project settings.
export const firebaseConfig = {
  apiKey:"AIzaSyCpwvJq21TWOG0c_1L3vHDOxK2-8NRrm8Q",
  authDomain: "healthtrack-hack.firebaseapp.com",
  projectId: "healthtrack-hack",
  storageBucket: "healthtrack-hack.firebasestorage.app",
  messagingSenderId: "943971604875",
  appId: "1:943971604875:web:a8073fdfe64dd2073e378e",
  measurementId:"G-6QSSQ74QHL", // Optional, for Analytics
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

// Ensure these are set in your environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Or directly use GEMINI_API_KEY if they are the same

const MONGODB_USER = process.env.MONGODB_USER; // Assuming you might have a user too
const MONGODB_PW = process.env.MONGODBPW;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'healthtrack'; // Default if not set
const ATLAS_VECTOR_SEARCH_INDEX_NAME = process.env.ATLAS_VECTOR_SEARCH_INDEX_NAME || 'case_index';

// Define and export MONGODB_URI from the environment variable
export const MONGODB_URI = process.env.MONGODB_URI;

// Update the MongoDB connection string to use environment variables
// Example (you might need to adjust based on your actual connection string format):
// const MONGODB_URI_CONSTRUCTED = `mongodb+srv://${MONGODB_USER}:${MONGODB_PW}@yourcluster.mongodb.net/${MONGODB_DB_NAME}?retryWrites=true&w=majority`;

// Vertex AI Configuration from environment variables
const VERTEX_AI_ENDPOINT_HOST = process.env.VERTEX_AI_ENDPOINT_HOST;

export const APP_CONFIG = {
  // Add any other app-wide configurations here
  appName: 'HealthTrack AI',
};

export const HF_KEY = process.env.HF_KEY || process.env.HUGGINGFACE_API_KEY; // Use either variable if both are set
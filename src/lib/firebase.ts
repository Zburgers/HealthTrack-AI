import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { firebaseConfig } from '@/config';

let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

function initializeFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  // Conditionally log the config to help debug environment variable issues
  // Moved inside initializeFirebase to ensure it only logs when initialization occurs
  if (process.env.NODE_ENV === 'development') {
    // Ensure firebaseConfig is fully resolved before logging
    const resolvedFirebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      };
    console.log('Firebase Config Initializing with:', resolvedFirebaseConfig);
    if (!resolvedFirebaseConfig.apiKey || resolvedFirebaseConfig.apiKey === "YOUR_ACTUAL_API_KEY_HERE") {
        console.warn("Firebase API Key might be missing or a placeholder in environment variables.");
    }
  }
}

// Getter functions to ensure Firebase is initialized before use
function getFirebaseApp() {
  if (!app) initializeFirebase();
  return app;
}

function getFirebaseAuth() {
  if (!auth) initializeFirebase();
  return auth;
}

function getGoogleAuthProvider() {
  if (!googleProvider) initializeFirebase();
  return googleProvider;
}

export { getFirebaseApp, getFirebaseAuth, getGoogleAuthProvider };

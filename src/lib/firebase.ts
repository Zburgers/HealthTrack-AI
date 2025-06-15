import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { firebaseConfig } from '@/config'; // We'll create this config file

// Conditionally log the config to help debug environment variable issues
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config Initializing with:', firebaseConfig);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };

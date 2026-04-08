// Application configuration, centralized from environment variables.

// Clerk Configuration
export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  signInUrl: process.env.CLERK_SIGN_IN_URL || '/login',
  signUpUrl: process.env.CLERK_SIGN_UP_URL || '/signup',
};

// API Configuration
export const apiConfig = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
};

// Validate Clerk config in development
if (process.env.NODE_ENV !== 'production') {
  if (!clerkConfig.publishableKey) {
    throw new Error(
      'Clerk configuration error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. ' +
      'Set it in your .env file and restart the dev server.'
    );
  }
}

export const APP_CONFIG = {
  appName: 'HealthTrack AI',
};

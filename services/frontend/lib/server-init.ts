// Server initialization checks for HealthTrack AI.
// Database connection is now managed by the NestJS backend (PostgreSQL).
// Frontend only needs Clerk auth configuration.

import { clerkConfig } from '@/config';

/**
 * Validates Clerk configuration is present.
 */
function checkClerkConfig() {
  if (!clerkConfig.publishableKey) {
    throw new Error(
      'Clerk configuration error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. ' +
      'Set it in your .env file.'
    );
  }
}

// Run checks on startup
if (process.env.NODE_ENV !== 'production' && !process.env.CI) {
  try {
    checkClerkConfig();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('FATAL: Pre-startup check failed:', errorMessage);
    process.exit(1);
  }
}

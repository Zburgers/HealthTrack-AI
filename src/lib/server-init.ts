
import { verifyDatabaseConnection } from './mongodb';
import { firebaseConfig } from '@/config';

/**
 * Validates that essential Firebase environment variables are present.
 * Throws an error if any critical keys are missing.
 */
function checkFirebaseConfig() {
  console.log("Verifying Firebase configuration...");

  const criticalKeys: Array<keyof typeof firebaseConfig> = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId',
  ];

  const missingKeys = criticalKeys.filter(key => !firebaseConfig[key] || firebaseConfig[key]?.includes('YOUR_ACTUAL_'));

  if (missingKeys.length > 0) {
    throw new Error(`Firebase config validation failed. Missing or placeholder value for: ${missingKeys.join(', ')}`);
  }

  console.log("✔ Firebase configuration loaded successfully.");
}

/**
 * Connects to MongoDB and logs the outcome.
 * Throws an error on failure.
 */
async function checkMongoDBConnection() {
  console.log("Connecting to MongoDB Atlas for verification...");
  await verifyDatabaseConnection();
  // The verification function handles its own logging. We add a confirmation here.
  console.log("✔ MongoDB connection verified successfully.");
}

/**
 * Runs all startup checks and provides clear feedback.
 * Exits the process if any check fails.
 */
async function runStartupChecks() {
  console.log("-----------------------------------------");
  console.log("  Running Pre-startup Server Checks");
  console.log("-----------------------------------------");
  try {
    // Check 1: Firebase Configuration
    checkFirebaseConfig();

    // Check 2: MongoDB Connection
    await checkMongoDBConnection();

    console.log("-----------------------------------------");
    console.log("  All checks passed. Starting server...");
    console.log("-----------------------------------------");
  } catch (error: any) {
    console.error("************************************************************");
    console.error("***         FATAL: A pre-startup check failed.           ***");
    console.error(`*** ERROR: ${error.message} `);
    console.error("************************************************************");
    process.exit(1); // Exit with an error code
  }
}

// Execute the startup checks.
runStartupChecks();

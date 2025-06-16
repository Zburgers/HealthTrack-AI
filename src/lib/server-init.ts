import { verifyDatabaseConnection } from './mongodb';
import { firebaseConfig } from '@/config';
import util from 'util';
import { exec as oldExec } from 'child_process';

const exec = util.promisify(oldExec);

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
 * Verifies essential GCP and Vertex AI environment variables and authentication.
 * Throws an error on failure.
 */
async function checkGCPVertexAIConnection() {
  console.log("Verifying GCP Vertex AI configuration and authentication...");

  const requiredEnvVars = [
    'GCLOUD_PROJECT',
    'VERTEX_AI_ENDPOINT_HOST',
    'VERTEX_AI_PROJECT_ID_FOR_ENDPOINT',
    'VERTEX_AI_LOCATION_FOR_ENDPOINT',
    'VERTEX_AI_ENDPOINT_ID_FOR_ENDPOINT',
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`GCP Vertex AI config validation failed. Missing environment variables: ${missingEnvVars.join(', ')}`);
  }
  console.log("✔ All required GCP Vertex AI environment variables are set.");

  // Attempt to get an access token as a basic auth check
  const authProjectId = process.env.GCLOUD_PROJECT;
  try {
    console.log(`Attempting to retrieve GCP access token for project: ${authProjectId}...`);
    const { stdout } = await exec(`gcloud auth print-access-token --project=${authProjectId}`);
    if (!stdout || stdout.trim() === '') {
      throw new Error('Received empty access token from gcloud.');
    }
    console.log("✔ Successfully retrieved GCP access token.");
  } catch (error: any) {
    let errorMessage = 'Failed to retrieve GCP access token.';
    if (error.stderr) {
      errorMessage += ` Stderr: ${error.stderr}`;
    }
    if (error.stdout) { // Sometimes error details are in stdout for gcloud
      errorMessage += ` Stdout: ${error.stdout}`;
    }
    if (error.message && !error.stderr && !error.stdout) {
        errorMessage += ` Message: ${error.message}`;
    }
    console.error("GCP auth print-access-token error details:", error);
    throw new Error(errorMessage);
  }

  console.log("✔ GCP Vertex AI configuration and authentication verified successfully.");
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

    // Check 3: GCP Vertex AI Connection
    await checkGCPVertexAIConnection();

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

// Execute the startup checks only if not in a build/CI environment.
if (process.env.NODE_ENV !== 'production' && !process.env.CI) {
  runStartupChecks();
}

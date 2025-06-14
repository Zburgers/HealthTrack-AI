// jest.setup.js
// Load environment variables from .env.local for testing purposes
// In a CI environment, these would typically be set directly as environment variables.
require('dotenv').config({ path: '.env.local' });

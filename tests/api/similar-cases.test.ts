import axios from 'axios';

// Configure the base URL for your API. This might be different in CI/CD environments.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const similarCasesEndpoint = `${API_BASE_URL}/api/similar-cases`;

/**
 * Test suite for the /api/similar-cases endpoint.
 */
describe('POST /api/similar-cases', () => {
  it('should return similar cases for valid input with all fields', async () => {
    const validInput = {
      note: 'Patient presents with persistent cough and fever for three days. Reports mild shortness of breath. No recent travel history.',
      age: 45,
      sex: 'M',
      vitals: {
        temp: 38.5, // Celsius
        bp: '130/85',
        hr: 90,
        spo2: 96,
        rr: 20,
      },
    };

    try {
      const response = await axios.post(similarCasesEndpoint, validInput);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      // Further checks can be added if you have expected mock data from your embedding/DB setup
      // For example, if you expect a certain number of results or specific IDs in a test DB:
      // expect(response.data.length).toBeGreaterThanOrEqual(0);
      if (response.data.length > 0) {
        const firstCase = response.data[0];
        expect(firstCase).toHaveProperty('id');
        expect(firstCase).toHaveProperty('note');
        expect(firstCase).toHaveProperty('matchConfidence');
        expect(typeof firstCase.matchConfidence).toBe('number');
        expect(firstCase.matchConfidence).toBeGreaterThanOrEqual(0);
        expect(firstCase.matchConfidence).toBeLessThanOrEqual(1);
      }
    } catch (error: any) {
      // If the API call itself fails (network error, etc.)
      console.error('Test failed due to API call error:', error.message);
      if (error.response) {
        console.error('API Error Response:', error.response.data);
      } else {
        console.error('Full error object (valid input, no response):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      throw error; // Re-throw to fail the test
    }
  });

  it('should return similar cases for valid input with only a note', async () => {
    const validInputMinimal = {
      note: 'Sore throat and mild headache.',
    };

    try {
      const response = await axios.post(similarCasesEndpoint, validInputMinimal);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    } catch (error: any) {
      console.error('Test failed due to API call error (minimal input):', error.message);
      if (error.response) {
        console.error('API Error Response (minimal input):', error.response.data);
      } else {
        console.error('Full error object (minimal input, no response):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      throw error; // Re-throw to fail the test
    }
  });

  it('should return 400 for invalid input (e.g., empty note)', async () => {
    const invalidInput = {
      patientId: 'test-patient-empty-note',
      encounterId: 'enc-empty-note',
      caseId: 'case-empty-note',
      // note is intentionally missing or empty
      note: '',
      // Optional fields
      age: 30,
      sex: 'Female',
      vitals: {
        heartRate: 75,
        bloodPressure: '120/80',
        temperature: 37.0,
        oxygenSaturation: 98,
      },
    };

    try {
      await axios.post(similarCasesEndpoint, invalidInput);
      // If the request succeeds, the test should fail because we expect an error
      throw new Error('API should have returned 400 for empty note, but it succeeded.');
    } catch (error: any) {
      if (!error.response) {
        console.error('Full error object (empty note, no response):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw new Error('Test setup error: No response received from API for invalid input (empty note).');
      }
      expect(error.response).toBeDefined();
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('message');
      expect(error.response.data.message).toContain('Invalid input data');
    }
  });

  it('should return 400 for invalid input (e.g., wrong data type for age)', async () => {
    const invalidInput = {
      patientId: 'test-patient-wrong-type',
      encounterId: 'enc-wrong-type',
      caseId: 'case-wrong-type',
      note: 'Patient reports persistent cough and fever.',
      age: 'thirty', // Incorrect data type
    };

    try {
      await axios.post(similarCasesEndpoint, invalidInput);
      // If the request succeeds, the test should fail
      throw new Error('API should have returned 400 for wrong data type, but it succeeded.');
    } catch (error: any) {
      if (!error.response) {
        console.error('Full error object (wrong data type, no response):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw new Error('Test setup error: No response received from API for invalid input (wrong data type).');
      }
      expect(error.response).toBeDefined();
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('message', 'Invalid input data.');
      // Zod errors are in an array
      expect(error.response.data.errors[0].path).toContain('age');
    }
  });
});

describe('GET /api/similar-cases', () => {
  it('should return 405 Method Not Allowed', async () => {
    try {
      await axios.get(similarCasesEndpoint);
      // If the request succeeds, the test should fail
      throw new Error('API should have returned 405 for GET request, but it succeeded.');
    } catch (error: any) {
      if (!error.response) {
        console.error('Full error object (GET request, no response):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw new Error('Test setup error: No response received from API for GET request.');
      }
      expect(error.response).toBeDefined();
      expect(error.response.status).toBe(405);
      expect(error.response.data).toHaveProperty('message');
    }
  });
});

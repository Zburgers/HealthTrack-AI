module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  clearMocks: true,
  setupFilesAfterEnv: ['./jest.setup.js'], // For loading .env files or other global setup
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};

// Global test setup
import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables for tests
beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

// Cleanup after each test
afterEach(() => {
  // Clear any mocks or test state
});

// Global test cleanup
afterAll(() => {
  // Final cleanup
});
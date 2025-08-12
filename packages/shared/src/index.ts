// Types
export * from './types/document.js';
export * from './types/api.js';

// Utilities will be added here as needed
export const createApiResponse = <T>(
  data?: T,
  error?: string
): import('./types/api.js').ApiResponse<T> => ({
  success: !error,
  data,
  error,
  timestamp: new Date(),
});
import type { DocumentNode, SearchQuery, SearchResult, ApiResponse } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      
      throw new ApiError(
        response.status,
        errorData.message || `Request failed with status ${response.status}`,
        errorData
      );
    }

    const result: ApiResponse<T> = await response.json();
    
    if (!result.success) {
      throw new ApiError(500, result.error || 'Request failed', result);
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or parsing error
    throw new ApiError(
      0,
      error instanceof Error ? error.message : 'Network error',
      error
    );
  }
}

// Document API
export async function fetchDocuments(): Promise<DocumentNode[]> {
  return apiRequest<DocumentNode[]>('/documents');
}

export async function fetchDocument(id: string): Promise<DocumentNode> {
  return apiRequest<DocumentNode>(`/documents/${id}`);
}

export async function updateDocument(
  id: string,
  updates: Partial<DocumentNode>
): Promise<DocumentNode> {
  return apiRequest<DocumentNode>(`/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await apiRequest<void>(`/documents/${id}`, {
    method: 'DELETE',
  });
}

export async function createDocument(
  document: Omit<DocumentNode, 'id'>
): Promise<DocumentNode> {
  return apiRequest<DocumentNode>('/documents', {
    method: 'POST',
    body: JSON.stringify(document),
  });
}

// Search API
export async function searchDocuments(query: SearchQuery): Promise<SearchResult> {
  return apiRequest<SearchResult>('/search', {
    method: 'POST',
    body: JSON.stringify(query),
  });
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  const params = new URLSearchParams({ q: query, limit: '10' });
  return apiRequest<string[]>(`/search/suggestions?${params}`);
}

// Analytics API
export async function getDocumentAnalytics(id: string): Promise<{
  usageCount: number;
  lastAccessed: string;
  contextUsage: number;
  relatedDocuments: string[];
}> {
  return apiRequest(`/documents/${id}/analytics`);
}

export async function getSearchAnalytics(): Promise<{
  topQueries: { query: string; count: number }[];
  searchVolume: { date: string; count: number }[];
  averageResultCount: number;
}> {
  return apiRequest('/analytics/search');
}

// Context API
export async function saveContextSession(session: {
  name: string;
  includedNodes: string[];
  pinnedNodes: string[];
  excludedNodes: string[];
}): Promise<{ id: string }> {
  return apiRequest('/context/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
}

export async function loadContextSession(id: string): Promise<{
  id: string;
  name: string;
  includedNodes: string[];
  pinnedNodes: string[];
  excludedNodes: string[];
  createdAt: string;
  updatedAt: string;
}> {
  return apiRequest(`/context/sessions/${id}`);
}

export async function getContextSessions(): Promise<Array<{
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
}>> {
  return apiRequest('/context/sessions');
}

export async function deleteContextSession(id: string): Promise<void> {
  await apiRequest(`/context/sessions/${id}`, {
    method: 'DELETE',
  });
}

// Collections API
export async function createCollection(collection: {
  name: string;
  description?: string;
  nodeIds: string[];
  rules?: {
    includeSubfolders: boolean;
    autoUpdate: boolean;
    tags?: string[];
  };
}): Promise<{ id: string }> {
  return apiRequest('/collections', {
    method: 'POST',
    body: JSON.stringify(collection),
  });
}

export async function getCollections(): Promise<Array<{
  id: string;
  name: string;
  description?: string;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}>> {
  return apiRequest('/collections');
}

export async function getCollection(id: string): Promise<{
  id: string;
  name: string;
  description?: string;
  nodes: DocumentNode[];
  rules: {
    includeSubfolders: boolean;
    autoUpdate: boolean;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
}> {
  return apiRequest(`/collections/${id}`);
}

export async function updateCollection(
  id: string,
  updates: {
    name?: string;
    description?: string;
    nodeIds?: string[];
    rules?: {
      includeSubfolders?: boolean;
      autoUpdate?: boolean;
      tags?: string[];
    };
  }
): Promise<void> {
  await apiRequest(`/collections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteCollection(id: string): Promise<void> {
  await apiRequest(`/collections/${id}`, {
    method: 'DELETE',
  });
}

// Export/Import API
export async function exportData(options: {
  format: 'json' | 'csv';
  includeContent: boolean;
  nodeIds?: string[];
}): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Export failed');
  }

  return response.blob();
}

export async function importData(file: File): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest('/import', {
    method: 'POST',
    body: formData,
    headers: {}, // Don't set Content-Type for FormData
  });
}

// Health check
export async function healthCheck(): Promise<{
  status: string;
  timestamp: string;
  version?: string;
}> {
  return apiRequest('/health');
}
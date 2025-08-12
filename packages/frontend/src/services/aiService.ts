import type { DocumentNode } from '@shared/types';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  apiKey?: string;
}

export interface DocumentSummary {
  summary: string;
  keyPoints: string[];
  tags: string[];
  confidence: number;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ContentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  language: string;
  readabilityScore: number;
  keyEntities: {
    type: 'person' | 'organization' | 'location' | 'concept';
    entity: string;
    confidence: number;
  }[];
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface RelationshipSuggestion {
  sourceDocId: string;
  targetDocId: string;
  relationshipType: 'similar' | 'references' | 'contradicts' | 'extends';
  confidence: number;
  reason: string;
}

export interface ContextOptimization {
  nodes: DocumentNode[];
  reasoning: string;
  tokenSavings: number;
  confidenceScore: number;
}

export interface DocumentEnhancement {
  enhancedContent: string;
  extractedMetadata: Record<string, any>;
  suggestedImprovements: string[];
}

export interface SearchSuggestion {
  type: 'semantic' | 'related' | 'concept' | 'autocomplete';
  text: string;
  description?: string;
  confidence: number;
  relatedDocs?: string[];
}

class AIService {
  private baseUrl: string;
  private config: AIConfig | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  async configure(config: AIConfig): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to configure AI service: ${response.statusText}`);
      }

      this.config = config;
    } catch (error) {
      console.error('Error configuring AI service:', error);
      throw error;
    }
  }

  async summarizeDocument(documentId: string): Promise<DocumentSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/summarize/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to summarize document: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error summarizing document:', error);
      throw error;
    }
  }

  async analyzeContent(text: string): Promise<ContentAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze content: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate embedding: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async generateSmartTags(documentId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/tags/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate smart tags: ${response.statusText}`);
      }

      const result = await response.json();
      return result.tags || [];
    } catch (error) {
      console.error('Error generating smart tags:', error);
      throw error;
    }
  }

  async findRelationships(documentIds: string[]): Promise<RelationshipSuggestion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/relationships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to find relationships: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error finding relationships:', error);
      throw error;
    }
  }

  async optimizeContext(
    candidateDocumentIds: string[],
    query: string,
    tokenLimit: number = 4000
  ): Promise<ContextOptimization> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/optimize-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateDocumentIds,
          query,
          tokenLimit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to optimize context: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error optimizing context:', error);
      throw error;
    }
  }

  async enhanceDocument(documentId: string): Promise<DocumentEnhancement> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/enhance/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to enhance document: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error enhancing document:', error);
      throw error;
    }
  }

  async generateSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/search-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate search suggestions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating search suggestions:', error);
      throw error;
    }
  }

  async semanticSearch(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      includeMetadata?: boolean;
    } = {}
  ): Promise<{
    documents: DocumentNode[];
    similarity_scores: number[];
    query_embedding: number[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/semantic-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to perform semantic search: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw error;
    }
  }

  async batchProcessDocuments(
    documentIds: string[],
    operations: ('summarize' | 'embed' | 'analyze' | 'tag')[] = ['summarize', 'embed', 'tag'],
    batchSize: number = 10
  ): Promise<{
    processed: number;
    errors: number;
    results: any[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/batch-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds,
          operations,
          batchSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to batch process documents: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error batch processing documents:', error);
      throw error;
    }
  }

  async getConfiguration(): Promise<AIConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No configuration set
        }
        throw new Error(`Failed to get AI configuration: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting AI configuration:', error);
      throw error;
    }
  }

  async getUsageStats(): Promise<{
    totalTokensUsed: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/usage-stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get usage stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw error;
    }
  }

  // Health check for AI service
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    provider: string;
    model: string;
    latency: number;
  }> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/ai/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          status: 'unhealthy',
          provider: 'unknown',
          model: 'unknown',
          latency,
        };
      }

      const result = await response.json();
      return {
        ...result,
        latency,
      };
    } catch (error) {
      console.error('Error checking AI service health:', error);
      return {
        status: 'unhealthy',
        provider: 'unknown',
        model: 'unknown',
        latency: -1,
      };
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  getConfig(): AIConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
import { DatabaseService } from './DatabaseService.js';
import type { DocumentNode } from '@shared/types';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface SummaryResult {
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

export interface RelationshipSuggestion {
  sourceDocId: string;
  targetDocId: string;
  relationshipType: 'similar' | 'references' | 'contradicts' | 'extends';
  confidence: number;
  reason: string;
}

export class LLMService {
  private config: LLMConfig;
  private db: DatabaseService;

  constructor(config: LLMConfig, db?: DatabaseService) {
    this.config = config;
    this.db = db || new DatabaseService();
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await this.makeAPICall('/embeddings', {
        input: text,
        model: this.config.model || 'text-embedding-ada-002'
      });

      return {
        embedding: response.data[0].embedding,
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  async summarizeDocument(document: DocumentNode): Promise<SummaryResult> {
    if (!document.content?.fullText) {
      throw new Error('Document has no content to summarize');
    }

    const prompt = `Please analyze and summarize the following document:

Title: ${document.name}
Content: ${document.content.fullText}

Provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Relevant tags (5-8 tags)
4. Your confidence in the analysis (0-1)

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "tags": ["...", "..."],
  "confidence": 0.95
}`;

    try {
      const response = await this.makeAPICall('/chat/completions', {
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        ...result,
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error summarizing document:', error);
      throw new Error('Failed to summarize document');
    }
  }

  async analyzeContent(text: string): Promise<ContentAnalysis> {
    const prompt = `Analyze the following text content:

"${text}"

Provide detailed analysis including:
1. Sentiment analysis
2. Main topics covered
3. Content complexity level
4. Language detection
5. Readability score (0-100)
6. Key entities mentioned

Respond in JSON format:
{
  "sentiment": "positive|neutral|negative",
  "topics": ["topic1", "topic2"],
  "complexity": "simple|moderate|complex",
  "language": "en",
  "readabilityScore": 75,
  "keyEntities": [
    {"type": "person", "entity": "Name", "confidence": 0.95}
  ]
}`;

    try {
      const response = await this.makeAPICall('/chat/completions', {
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw new Error('Failed to analyze content');
    }
  }

  async findDocumentRelationships(documents: DocumentNode[]): Promise<RelationshipSuggestion[]> {
    if (documents.length < 2) return [];

    const relationships: RelationshipSuggestion[] = [];
    
    // Use embeddings to find semantic similarities
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const doc1 = documents[i];
        const doc2 = documents[j];
        
        if (!doc1.content?.embeddings || !doc2.content?.embeddings) continue;
        
        const similarity = this.cosineSimilarity(
          doc1.content.embeddings,
          doc2.content.embeddings
        );
        
        if (similarity > 0.75) {
          relationships.push({
            sourceDocId: doc1.id,
            targetDocId: doc2.id,
            relationshipType: 'similar',
            confidence: similarity,
            reason: `High semantic similarity (${(similarity * 100).toFixed(1)}%)`
          });
        }
      }
    }

    return relationships.sort((a, b) => b.confidence - a.confidence);
  }

  async generateSmartTags(document: DocumentNode): Promise<string[]> {
    if (!document.content?.fullText) return [];

    const prompt = `Generate smart tags for this document:

Title: ${document.name}
Path: ${document.path}
Content: ${document.content.fullText.substring(0, 2000)}...

Generate 5-10 relevant, specific tags that would help with:
1. Content categorization
2. Search optimization  
3. Document discovery
4. Topic clustering

Return only a JSON array of tags:
["tag1", "tag2", "tag3"]`;

    try {
      const response = await this.makeAPICall('/chat/completions', {
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.tags || [];
    } catch (error) {
      console.error('Error generating smart tags:', error);
      return [];
    }
  }

  async optimizeContextSelection(
    candidateNodes: DocumentNode[],
    query: string,
    tokenLimit: number = 4000
  ): Promise<{ nodes: DocumentNode[]; reasoning: string }> {
    const prompt = `Given a user query and candidate documents, select the optimal subset for RAG context:

Query: "${query}"
Token Limit: ${tokenLimit}

Candidate Documents:
${candidateNodes.map((doc, i) => `${i + 1}. ${doc.name} (${doc.path})
   Preview: ${doc.content?.preview || 'No preview available'}
   Tags: ${doc.metadata.tags.join(', ')}`).join('\n\n')}

Select the most relevant documents that:
1. Directly address the query
2. Provide comprehensive coverage
3. Stay within token limits
4. Maximize information density

Respond with JSON:
{
  "selectedIndices": [0, 2, 4],
  "reasoning": "Selected documents 1, 3, and 5 because..."
}`;

    try {
      const response = await this.makeAPICall('/chat/completions', {
        model: this.config.model || 'gpt-4',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const selectedNodes = result.selectedIndices.map((i: number) => candidateNodes[i]);
      
      return {
        nodes: selectedNodes,
        reasoning: result.reasoning
      };
    } catch (error) {
      console.error('Error optimizing context selection:', error);
      return {
        nodes: candidateNodes.slice(0, 3), // Fallback to first 3
        reasoning: 'Error in AI optimization, using fallback selection'
      };
    }
  }

  async enhanceDocumentContent(document: DocumentNode): Promise<{
    enhancedContent: string;
    extractedMetadata: Record<string, any>;
    suggestedImprovements: string[];
  }> {
    if (!document.content?.fullText) {
      throw new Error('Document has no content to enhance');
    }

    const prompt = `Enhance this document by improving its structure and extracting metadata:

Title: ${document.name}
Content: ${document.content.fullText}

Please:
1. Improve formatting and structure
2. Extract key metadata (dates, people, concepts, etc.)
3. Suggest content improvements
4. Maintain original meaning and accuracy

Respond in JSON format:
{
  "enhancedContent": "Improved version of the content...",
  "extractedMetadata": {
    "dateCreated": "2024-01-01",
    "authors": ["Name"],
    "keyTopics": ["topic1", "topic2"],
    "difficulty": "intermediate"
  },
  "suggestedImprovements": [
    "Add more specific examples",
    "Include references to related concepts"
  ]
}`;

    try {
      const response = await this.makeAPICall('/chat/completions', {
        model: this.config.model || 'gpt-4',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error enhancing document content:', error);
      throw new Error('Failed to enhance document content');
    }
  }

  private async makeAPICall(endpoint: string, payload: any): Promise<any> {
    const baseUrl = this.getBaseUrl();
    const headers = this.getHeaders();

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private getBaseUrl(): string {
    if (this.config.baseUrl) return this.config.baseUrl;
    
    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'local':
        return 'http://localhost:11434/v1'; // Ollama default
      default:
        throw new Error(`Unknown LLM provider: ${this.config.provider}`);
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiKey) {
      switch (this.config.provider) {
        case 'openai':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          break;
        case 'anthropic':
          headers['x-api-key'] = this.config.apiKey;
          break;
      }
    }

    return headers;
  }

  public cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public getConfig(): LLMConfig {
    return this.config;
  }

  // Batch processing for large document sets
  async processDocumentsBatch(
    documents: DocumentNode[],
    operations: ('summarize' | 'embed' | 'analyze' | 'tag')[] = ['summarize', 'embed', 'tag'],
    batchSize: number = 10
  ): Promise<{ processed: number; errors: number; results: any[] }> {
    const results = [];
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (doc) => {
        try {
          const result: any = { documentId: doc.id };
          
          if (operations.includes('embed') && doc.content?.fullText) {
            result.embedding = await this.generateEmbedding(doc.content.fullText);
          }
          
          if (operations.includes('summarize')) {
            result.summary = await this.summarizeDocument(doc);
          }
          
          if (operations.includes('analyze') && doc.content?.fullText) {
            result.analysis = await this.analyzeContent(doc.content.fullText);
          }
          
          if (operations.includes('tag')) {
            result.smartTags = await this.generateSmartTags(doc);
          }
          
          processed++;
          return result;
        } catch (error) {
          console.error(`Error processing document ${doc.id}:`, error);
          errors++;
          return { documentId: doc.id, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { processed, errors, results };
  }
}
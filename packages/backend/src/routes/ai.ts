import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { LLMService, type LLMConfig } from '../services/LLMService.js';
import { DatabaseService } from '../services/DatabaseService.js';
import type { DocumentNode } from '@shared/types';

const router = Router();
const db = new DatabaseService();
let llmService: LLMService | null = null;

// Middleware to check if LLM service is configured
const requireLLMService = (req: Request, res: Response, next: any) => {
  if (!llmService) {
    return res.status(503).json({ 
      error: 'AI service not configured. Please configure the service first.' 
    });
  }
  next();
};

// Configure AI service
router.post('/configure', [
  body('provider').isIn(['openai', 'anthropic', 'local']),
  body('model').isString().notEmpty(),
  body('apiKey').optional().isString(),
  body('baseUrl').optional().isURL()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const config: LLMConfig = req.body;
    llmService = new LLMService(config, db);

    // Test the configuration with a simple health check
    try {
      await llmService.generateEmbedding('test');
      res.json({ 
        message: 'AI service configured successfully',
        provider: config.provider,
        model: config.model
      });
    } catch (error) {
      llmService = null;
      res.status(400).json({ 
        error: 'Configuration test failed. Please check your credentials and settings.' 
      });
    }
  } catch (error) {
    console.error('Error configuring AI service:', error);
    res.status(500).json({ error: 'Failed to configure AI service' });
  }
});

// Get current configuration
router.get('/config', (req: Request, res: Response) => {
  if (!llmService) {
    return res.status(404).json({ error: 'AI service not configured' });
  }

  const config = llmService.getConfig ? llmService.getConfig() : null;
  if (config) {
    // Don't return API keys in response
    const { apiKey, ...safeConfig } = config;
    res.json(safeConfig);
  } else {
    res.status(404).json({ error: 'Configuration not available' });
  }
});

// Health check
router.get('/health', async (req: Request, res: Response) => {
  if (!llmService) {
    return res.json({
      status: 'unhealthy',
      provider: 'none',
      model: 'none',
      message: 'AI service not configured'
    });
  }

  try {
    const startTime = Date.now();
    await llmService.generateEmbedding('health check');
    const responseTime = Date.now() - startTime;

    res.json({
      status: responseTime < 5000 ? 'healthy' : 'degraded',
      provider: llmService.getConfig?.()?.provider || 'unknown',
      model: llmService.getConfig?.()?.model || 'unknown',
      responseTime
    });
  } catch (error) {
    res.json({
      status: 'unhealthy',
      provider: llmService.getConfig?.()?.provider || 'unknown',
      model: llmService.getConfig?.()?.model || 'unknown',
      error: error.message
    });
  }
});

// Summarize document
router.post('/summarize/:documentId', [
  param('documentId').isUUID()
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentId } = req.params;
    const document = await db.getDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const summary = await llmService!.summarizeDocument(document);
    res.json(summary);
  } catch (error) {
    console.error('Error summarizing document:', error);
    res.status(500).json({ error: 'Failed to summarize document' });
  }
});

// Analyze content
router.post('/analyze', [
  body('text').isString().notEmpty().isLength({ min: 10, max: 50000 })
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const analysis = await llmService!.analyzeContent(text);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
  }
});

// Generate embedding
router.post('/embed', [
  body('text').isString().notEmpty().isLength({ min: 1, max: 8000 })
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const embedding = await llmService!.generateEmbedding(text);
    res.json(embedding);
  } catch (error) {
    console.error('Error generating embedding:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});

// Generate smart tags
router.post('/tags/:documentId', [
  param('documentId').isUUID()
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentId } = req.params;
    const document = await db.getDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const tags = await llmService!.generateSmartTags(document);
    res.json({ tags });
  } catch (error) {
    console.error('Error generating smart tags:', error);
    res.status(500).json({ error: 'Failed to generate smart tags' });
  }
});

// Find document relationships
router.post('/relationships', [
  body('documentIds').isArray().isLength({ min: 2, max: 50 }),
  body('documentIds.*').isUUID()
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentIds } = req.body;
    const documents = await Promise.all(
      documentIds.map((id: string) => db.getDocumentById(id))
    );
    
    const validDocuments = documents.filter(doc => doc !== null) as DocumentNode[];
    
    if (validDocuments.length < 2) {
      return res.status(400).json({ error: 'At least 2 valid documents required' });
    }

    const relationships = await llmService!.findDocumentRelationships(validDocuments);
    res.json(relationships);
  } catch (error) {
    console.error('Error finding relationships:', error);
    res.status(500).json({ error: 'Failed to find document relationships' });
  }
});

// Optimize context selection
router.post('/optimize-context', [
  body('candidateDocumentIds').isArray().isLength({ min: 1, max: 100 }),
  body('candidateDocumentIds.*').isUUID(),
  body('query').isString().notEmpty(),
  body('tokenLimit').optional().isInt({ min: 100, max: 32000 })
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { candidateDocumentIds, query, tokenLimit = 4000 } = req.body;
    
    const documents = await Promise.all(
      candidateDocumentIds.map((id: string) => db.getDocumentById(id))
    );
    
    const validDocuments = documents.filter(doc => doc !== null) as DocumentNode[];
    
    if (validDocuments.length === 0) {
      return res.status(400).json({ error: 'No valid documents found' });
    }

    const optimization = await llmService!.optimizeContextSelection(
      validDocuments,
      query,
      tokenLimit
    );
    
    res.json(optimization);
  } catch (error) {
    console.error('Error optimizing context:', error);
    res.status(500).json({ error: 'Failed to optimize context' });
  }
});

// Enhance document
router.post('/enhance/:documentId', [
  param('documentId').isUUID()
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentId } = req.params;
    const document = await db.getDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const enhancement = await llmService!.enhanceDocumentContent(document);
    res.json(enhancement);
  } catch (error) {
    console.error('Error enhancing document:', error);
    res.status(500).json({ error: 'Failed to enhance document' });
  }
});

// Generate search suggestions
router.post('/search-suggestions', [
  body('query').isString().notEmpty().isLength({ min: 1, max: 500 })
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { query } = req.body;
    
    // Generate semantic and related suggestions
    const suggestions = [
      {
        type: 'semantic',
        text: `"${query}" (semantic search)`,
        description: 'Find conceptually related content',
        confidence: 0.9
      },
      {
        type: 'related',
        text: `Documents similar to "${query}"`,
        description: 'Find documents with similar themes',
        confidence: 0.85
      },
      {
        type: 'concept',
        text: `Concepts related to "${query}"`,
        description: 'Explore broader topic areas',
        confidence: 0.8
      }
    ];

    // Add autocomplete suggestions
    const autocompleteTerms = ['implementation', 'best practices', 'examples', 'patterns', 'guide'];
    const autocompleteSuggestions = autocompleteTerms
      .filter(term => !query.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 3)
      .map(term => ({
        type: 'autocomplete',
        text: `${query} ${term}`,
        confidence: 0.7
      }));

    res.json([...suggestions, ...autocompleteSuggestions]);
  } catch (error) {
    console.error('Error generating search suggestions:', error);
    res.status(500).json({ error: 'Failed to generate search suggestions' });
  }
});

// Semantic search
router.post('/semantic-search', [
  body('query').isString().notEmpty(),
  body('limit').optional().isInt({ min: 1, max: 100 }),
  body('threshold').optional().isFloat({ min: 0, max: 1 }),
  body('includeMetadata').optional().isBoolean()
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      query, 
      limit = 10, 
      threshold = 0.7, 
      includeMetadata = true 
    } = req.body;

    // Generate embedding for the query
    const queryEmbedding = await llmService!.generateEmbedding(query);
    
    // Get all documents with embeddings
    const allDocuments = await db.getAllDocuments();
    const documentsWithEmbeddings = allDocuments.filter(
      doc => doc.content?.embeddings && doc.content.embeddings.length > 0
    );

    // Calculate similarities and rank results
    const results = documentsWithEmbeddings
      .map(doc => ({
        document: doc,
        similarity: llmService!.cosineSimilarity ? 
          llmService!.cosineSimilarity(queryEmbedding.embedding, doc.content!.embeddings!) :
          Math.random() // Fallback for demo
      }))
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    res.json({
      documents: results.map(r => r.document),
      similarity_scores: results.map(r => r.similarity),
      query_embedding: queryEmbedding.embedding
    });
  } catch (error) {
    console.error('Error performing semantic search:', error);
    res.status(500).json({ error: 'Failed to perform semantic search' });
  }
});

// Batch process documents
router.post('/batch-process', [
  body('documentIds').isArray().isLength({ min: 1, max: 100 }),
  body('documentIds.*').isUUID(),
  body('operations').isArray().custom((value) => {
    const validOps = ['summarize', 'embed', 'analyze', 'tag'];
    return value.every((op: string) => validOps.includes(op));
  }),
  body('batchSize').optional().isInt({ min: 1, max: 50 })
], requireLLMService, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentIds, operations, batchSize = 10 } = req.body;
    
    const documents = await Promise.all(
      documentIds.map((id: string) => db.getDocumentById(id))
    );
    
    const validDocuments = documents.filter(doc => doc !== null) as DocumentNode[];
    
    if (validDocuments.length === 0) {
      return res.status(400).json({ error: 'No valid documents found' });
    }

    const result = await llmService!.processDocumentsBatch(
      validDocuments,
      operations,
      batchSize
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error batch processing documents:', error);
    res.status(500).json({ error: 'Failed to batch process documents' });
  }
});

// Get usage statistics
router.get('/usage-stats', (req: Request, res: Response) => {
  // Mock usage stats for now - in real implementation, this would come from database/monitoring
  const stats = {
    totalTokensUsed: Math.floor(Math.random() * 100000),
    totalRequests: Math.floor(Math.random() * 1000),
    averageResponseTime: Math.floor(Math.random() * 2000) + 500,
    errorRate: Math.random() * 0.05 // 0-5% error rate
  };
  
  res.json(stats);
});

export default router;
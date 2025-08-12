import { Router } from 'express';
import { z } from 'zod';
import { SearchQuerySchema, createApiResponse } from '@shared/index.js';
import { SearchService } from '../services/SearchService.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();
const searchService = new SearchService();

// Main search endpoint
router.post('/', validateRequest(SearchQuerySchema), async (req, res) => {
  try {
    const searchQuery = req.body;
    const startTime = Date.now();
    
    const results = await searchService.search(searchQuery);
    const searchTime = Date.now() - startTime;
    
    // Log search for analytics
    await searchService.logSearch(searchQuery, results.totalCount, searchTime);
    
    res.json(createApiResponse({
      ...results,
      searchTime,
    }));
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json(createApiResponse(undefined, 'Search failed'));
  }
});

// Get search suggestions
const suggestionsSchema = z.object({
  q: z.string().min(1),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
});

router.get('/suggestions', async (req, res) => {
  try {
    const validation = suggestionsSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json(
        createApiResponse(undefined, 'Invalid query parameters')
      );
    }
    
    const { q: query, limit } = validation.data;
    const suggestions = await searchService.getSuggestions(query, limit);
    
    res.json(createApiResponse(suggestions));
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to get suggestions'));
  }
});

// Get search analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await searchService.getSearchAnalytics();
    res.json(createApiResponse(analytics));
  } catch (error) {
    console.error('Error fetching search analytics:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch analytics'));
  }
});

// Get popular searches
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const popular = await searchService.getPopularSearches(limit);
    
    res.json(createApiResponse(popular));
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch popular searches'));
  }
});

// Advanced search with facets
const facetSearchSchema = SearchQuerySchema.extend({
  includeFacets: z.boolean().optional(),
});

router.post('/faceted', validateRequest(facetSearchSchema), async (req, res) => {
  try {
    const searchQuery = req.body;
    const startTime = Date.now();
    
    const results = await searchService.facetedSearch(searchQuery);
    const searchTime = Date.now() - startTime;
    
    res.json(createApiResponse({
      ...results,
      searchTime,
    }));
  } catch (error) {
    console.error('Error performing faceted search:', error);
    res.status(500).json(createApiResponse(undefined, 'Faceted search failed'));
  }
});

// Similar documents
router.get('/similar/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const similar = await searchService.findSimilarDocuments(documentId, limit);
    
    res.json(createApiResponse(similar));
  } catch (error) {
    console.error('Error finding similar documents:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to find similar documents'));
  }
});

export default router;
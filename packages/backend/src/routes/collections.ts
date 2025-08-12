import { Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@shared/index.js';
import { validateRequest } from '../middleware/validation.js';
import { DatabaseService } from '../services/DatabaseService.js';

const router = Router();
const dbService = new DatabaseService();

// Create collection
const createCollectionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  nodeIds: z.array(z.string()),
  rules: z.object({
    includeSubfolders: z.boolean(),
    autoUpdate: z.boolean(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

router.post('/', validateRequest(createCollectionSchema), async (req, res) => {
  try {
    const { name, description, nodeIds, rules } = req.body;
    const collectionId = crypto.randomUUID();
    
    // First, ensure collections table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS collections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        node_ids UUID[] DEFAULT '{}',
        rules JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await dbService.query(createTableQuery);
    
    const query = `
      INSERT INTO collections (id, name, description, node_ids, rules)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    await dbService.query(query, [
      collectionId, 
      name, 
      description, 
      nodeIds, 
      JSON.stringify(rules || {})
    ]);
    
    res.status(201).json(createApiResponse({ id: collectionId }));
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to create collection'));
  }
});

// Get all collections
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        name, 
        description, 
        ARRAY_LENGTH(node_ids, 1) as node_count,
        created_at, 
        updated_at
      FROM collections
      ORDER BY updated_at DESC
    `;
    
    const rows = await dbService.query(query);
    
    const collections = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      nodeCount: row.node_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    res.json(createApiResponse(collections));
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch collections'));
  }
});

// Get single collection with nodes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const collectionQuery = `
      SELECT id, name, description, node_ids, rules, created_at, updated_at
      FROM collections
      WHERE id = $1
    `;
    
    const collectionRows = await dbService.query(collectionQuery, [id]);
    
    if (collectionRows.length === 0) {
      return res.status(404).json(createApiResponse(undefined, 'Collection not found'));
    }
    
    const collection = collectionRows[0];
    
    // Get the actual document nodes
    let nodes = [];
    if (collection.node_ids && collection.node_ids.length > 0) {
      const nodesQuery = `
        SELECT 
          d.*,
          dc.preview,
          dc.full_text,
          dc.embeddings
        FROM documents d
        LEFT JOIN document_content dc ON d.id = dc.document_id
        WHERE d.id = ANY($1)
        ORDER BY d.name
      `;
      
      const nodeRows = await dbService.query(nodesQuery, [collection.node_ids]);
      
      nodes = nodeRows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        path: row.path,
        parentId: row.parent_id || undefined,
        metadata: {
          size: row.size,
          lastModified: new Date(row.last_modified),
          documentType: row.document_type,
          tags: row.tags || [],
          relevanceScore: row.relevance_score,
          usageCount: row.usage_count,
        },
        content: (row.preview || row.full_text || row.embeddings) ? {
          preview: row.preview,
          fullText: row.full_text,
          embeddings: row.embeddings,
        } : undefined,
      }));
    }
    
    const result = {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      nodes,
      rules: typeof collection.rules === 'string' ? JSON.parse(collection.rules) : collection.rules,
      createdAt: collection.created_at,
      updatedAt: collection.updated_at,
    };
    
    res.json(createApiResponse(result));
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch collection'));
  }
});

// Update collection
const updateCollectionSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  nodeIds: z.array(z.string()).optional(),
  rules: z.object({
    includeSubfolders: z.boolean().optional(),
    autoUpdate: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

router.patch('/:id', validateRequest(updateCollectionSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    
    if (updates.nodeIds !== undefined) {
      setClauses.push(`node_ids = $${paramIndex++}`);
      values.push(updates.nodeIds);
    }
    
    if (updates.rules !== undefined) {
      setClauses.push(`rules = $${paramIndex++}`);
      values.push(JSON.stringify(updates.rules));
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json(createApiResponse(undefined, 'No updates provided'));
    }
    
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE collections 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await dbService.query(query, values);
    
    if (result.length === 0) {
      return res.status(404).json(createApiResponse(undefined, 'Collection not found'));
    }
    
    res.json(createApiResponse({ updated: true }));
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to update collection'));
  }
});

// Delete collection
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM collections WHERE id = $1`;
    const result = await dbService.query(query, [id]);
    
    if (result.length === 0) {
      return res.status(404).json(createApiResponse(undefined, 'Collection not found'));
    }
    
    res.json(createApiResponse({ deleted: true }));
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to delete collection'));
  }
});

export default router;
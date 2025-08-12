import { Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@shared/index.js';
import { validateRequest } from '../middleware/validation.js';
import { DatabaseService } from '../services/DatabaseService.js';

const router = Router();
const dbService = new DatabaseService();

// Save context session
const saveContextSessionSchema = z.object({
  name: z.string(),
  includedNodes: z.array(z.string()),
  pinnedNodes: z.array(z.string()),
  excludedNodes: z.array(z.string()),
});

router.post('/sessions', validateRequest(saveContextSessionSchema), async (req, res) => {
  try {
    const { name, includedNodes, pinnedNodes, excludedNodes } = req.body;
    const sessionId = crypto.randomUUID();
    
    const query = `
      INSERT INTO context_sessions (id, session_name, included_nodes, pinned_nodes, excluded_nodes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    await dbService.query(query, [sessionId, name, includedNodes, pinnedNodes, excludedNodes]);
    
    res.status(201).json(createApiResponse({ id: sessionId }));
  } catch (error) {
    console.error('Error saving context session:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to save context session'));
  }
});

// Load context session
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, session_name, included_nodes, pinned_nodes, excluded_nodes, created_at, updated_at
      FROM context_sessions
      WHERE id = $1
    `;
    
    const rows = await dbService.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json(createApiResponse(undefined, 'Context session not found'));
    }
    
    const session = {
      id: rows[0].id,
      name: rows[0].session_name,
      includedNodes: rows[0].included_nodes || [],
      pinnedNodes: rows[0].pinned_nodes || [],
      excludedNodes: rows[0].excluded_nodes || [],
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at,
    };
    
    res.json(createApiResponse(session));
  } catch (error) {
    console.error('Error loading context session:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to load context session'));
  }
});

// Get all context sessions
router.get('/sessions', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        session_name, 
        created_at, 
        updated_at,
        ARRAY_LENGTH(included_nodes, 1) + ARRAY_LENGTH(pinned_nodes, 1) as node_count
      FROM context_sessions
      ORDER BY updated_at DESC
    `;
    
    const rows = await dbService.query(query);
    
    const sessions = rows.map(row => ({
      id: row.id,
      name: row.session_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      nodeCount: row.node_count || 0,
    }));
    
    res.json(createApiResponse(sessions));
  } catch (error) {
    console.error('Error fetching context sessions:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch context sessions'));
  }
});

// Delete context session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM context_sessions WHERE id = $1`;
    const result = await dbService.query(query, [id]);
    
    if (result.length === 0) {
      return res.status(404).json(createApiResponse(undefined, 'Context session not found'));
    }
    
    res.json(createApiResponse({ deleted: true }));
  } catch (error) {
    console.error('Error deleting context session:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to delete context session'));
  }
});

export default router;
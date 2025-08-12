import { Router } from 'express';
import { z } from 'zod';
import { DocumentNodeSchema, createApiResponse } from '@shared/index.js';
import { DocumentService } from '../services/DocumentService.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();
const documentService = new DocumentService();

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await documentService.getAllDocuments();
    res.json(createApiResponse(documents));
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch documents'));
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json(createApiResponse(undefined, 'Document ID is required'));
    }

    const document = await documentService.getDocumentById(id);
    
    if (!document) {
      return res.status(404).json(createApiResponse(undefined, 'Document not found'));
    }

    res.json(createApiResponse(document));
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch document'));
  }
});

// Create new document
const createDocumentSchema = DocumentNodeSchema.omit({ id: true });

router.post('/', validateRequest(createDocumentSchema), async (req, res) => {
  try {
    const documentData = req.body;
    const document = await documentService.createDocument(documentData);
    
    res.status(201).json(createApiResponse(document));
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to create document'));
  }
});

// Update document
const updateDocumentSchema = DocumentNodeSchema.partial().omit({ id: true });

router.patch('/:id', validateRequest(updateDocumentSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const document = await documentService.updateDocument(id, updates);
    
    if (!document) {
      return res.status(404).json(createApiResponse(undefined, 'Document not found'));
    }

    res.json(createApiResponse(document));
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to update document'));
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await documentService.deleteDocument(id);
    
    if (!deleted) {
      return res.status(404).json(createApiResponse(undefined, 'Document not found'));
    }

    res.json(createApiResponse({ deleted: true }));
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to delete document'));
  }
});

// Get document analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const analytics = await documentService.getDocumentAnalytics(id);
    
    res.json(createApiResponse(analytics));
  } catch (error) {
    console.error('Error fetching document analytics:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch analytics'));
  }
});

// Update usage count
router.post('/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;
    await documentService.incrementUsageCount(id);
    
    res.json(createApiResponse({ success: true }));
  } catch (error) {
    console.error('Error updating usage count:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to update usage count'));
  }
});

// Get document relationships
router.get('/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const related = await documentService.getRelatedDocuments(id, limit);
    
    res.json(createApiResponse(related));
  } catch (error) {
    console.error('Error fetching related documents:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch related documents'));
  }
});

export default router;
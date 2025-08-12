import express from 'express';
import cors from 'cors';
import { createApiResponse } from '@shared/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json(createApiResponse({ status: 'healthy', timestamp: new Date() }));
});

// API routes (to be implemented)
app.get('/api/documents', (req, res) => {
  res.json(createApiResponse({ 
    message: 'Documents API endpoint - to be implemented',
    nodes: []
  }));
});

app.get('/api/search', (req, res) => {
  res.json(createApiResponse({ 
    message: 'Search API endpoint - to be implemented',
    results: []
  }));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json(createApiResponse(undefined, 'Internal Server Error'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json(createApiResponse(undefined, 'Endpoint not found'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
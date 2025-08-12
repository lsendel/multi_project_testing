import express from 'express';
import cors from 'cors';
import { createApiResponse } from '@shared/index.js';
import { DatabaseService } from './services/DatabaseService.js';

// Import route handlers
import documentsRouter from './routes/documents.js';
import searchRouter from './routes/search.js';
import contextRouter from './routes/context.js';
import collectionsRouter from './routes/collections.js';
import analyticsRouter from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database service
const dbService = new DatabaseService();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    return originalSend.call(this, data);
  };
  
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await dbService.healthCheck();
    const stats = await dbService.getStats();
    
    res.json(createApiResponse({
      status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      database: dbHealth,
      stats,
    }));
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json(createApiResponse(undefined, 'Service unavailable'));
  }
});

// API routes
app.use('/api/documents', documentsRouter);
app.use('/api/search', searchRouter);
app.use('/api/context', contextRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/analytics', analyticsRouter);

// Export/Import endpoints
app.post('/api/export', async (req, res) => {
  // Export functionality would be implemented here
  res.json(createApiResponse({ message: 'Export endpoint - to be implemented' }));
});

app.post('/api/import', async (req, res) => {
  // Import functionality would be implemented here  
  res.json(createApiResponse({ message: 'Import endpoint - to be implemented' }));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(500).json(createApiResponse(undefined, message));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json(createApiResponse(undefined, `Endpoint ${req.method} ${req.baseUrl} not found`));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await dbService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await dbService.close();
  process.exit(0);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Interactive Knowledge Tree API Server`);
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default server;
import { Router } from 'express';
import { createApiResponse } from '@shared/index.js';
import { DatabaseService } from '../services/DatabaseService.js';

const router = Router();
const dbService = new DatabaseService();

// Get search analytics
router.get('/search', async (req, res) => {
  try {
    // Top queries
    const topQueriesQuery = `
      SELECT query, COUNT(*) as count
      FROM search_history
      WHERE created_at > NOW() - INTERVAL '30 days'
      AND LENGTH(query) > 2
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const topQueriesRows = await dbService.query(topQueriesQuery);
    const topQueries = topQueriesRows.map(row => ({
      query: row.query,
      count: parseInt(row.count),
    }));
    
    // Search volume over time
    const volumeQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM search_history
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `;
    
    const volumeRows = await dbService.query(volumeQuery);
    const searchVolume = volumeRows.map(row => ({
      date: row.date,
      count: parseInt(row.count),
    }));
    
    // Average result count
    const avgQuery = `
      SELECT AVG(results_count) as average
      FROM search_history
      WHERE created_at > NOW() - INTERVAL '30 days'
    `;
    
    const avgRows = await dbService.query(avgQuery);
    const averageResultCount = parseFloat(avgRows[0]?.average || '0');
    
    const analytics = {
      topQueries,
      searchVolume,
      averageResultCount,
    };
    
    res.json(createApiResponse(analytics));
  } catch (error) {
    console.error('Error fetching search analytics:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch search analytics'));
  }
});

// Get document analytics
router.get('/documents', async (req, res) => {
  try {
    // Most viewed documents
    const mostViewedQuery = `
      SELECT id, name, usage_count as views
      FROM documents
      WHERE type = 'document'
      ORDER BY usage_count DESC
      LIMIT 10
    `;
    
    const mostViewedRows = await dbService.query(mostViewedQuery);
    const mostViewed = mostViewedRows.map(row => ({
      id: row.id,
      name: row.name,
      views: row.views,
    }));
    
    // Document statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recently_added,
        AVG(size) / 1024 as average_size_kb
      FROM documents
      WHERE type = 'document'
    `;
    
    const statsRows = await dbService.query(statsQuery);
    const stats = statsRows[0];
    
    const analytics = {
      totalDocuments: parseInt(stats.total_documents),
      mostViewed,
      recentlyAdded: parseInt(stats.recently_added),
      averageSize: parseFloat(stats.average_size_kb || '0'),
    };
    
    res.json(createApiResponse(analytics));
  } catch (error) {
    console.error('Error fetching document analytics:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch document analytics'));
  }
});

// Get context analytics
router.get('/context', async (req, res) => {
  try {
    // Most used documents in context
    const contextUsageQuery = `
      SELECT 
        unnest(array_cat(included_nodes, pinned_nodes)) as node_id,
        COUNT(*) as usage_count
      FROM context_sessions
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY node_id
      ORDER BY usage_count DESC
      LIMIT 10
    `;
    
    const contextUsageRows = await dbService.query(contextUsageQuery);
    
    // Get document names for the usage data
    const nodeIds = contextUsageRows.map(row => row.node_id);
    let mostUsedInContext = [];
    
    if (nodeIds.length > 0) {
      const documentsQuery = `
        SELECT id, name
        FROM documents
        WHERE id = ANY($1)
      `;
      
      const documentsRows = await dbService.query(documentsQuery, [nodeIds]);
      const documentsMap = new Map(documentsRows.map(row => [row.id, row.name]));
      
      mostUsedInContext = contextUsageRows.map(row => ({
        id: row.node_id,
        name: documentsMap.get(row.node_id) || 'Unknown Document',
        usage: parseInt(row.usage_count),
      }));
    }
    
    // Context session statistics
    const sessionStatsQuery = `
      SELECT 
        AVG(array_length(included_nodes, 1) + array_length(pinned_nodes, 1)) as avg_context_size,
        COUNT(*) as total_sessions
      FROM context_sessions
      WHERE created_at > NOW() - INTERVAL '30 days'
    `;
    
    const sessionStatsRows = await dbService.query(sessionStatsQuery);
    const sessionStats = sessionStatsRows[0];
    
    const analytics = {
      averageContextSize: parseFloat(sessionStats.avg_context_size || '0'),
      mostUsedInContext,
      contextEfficiency: 0.82, // Mock value - would be calculated based on actual usage patterns
      totalSessions: parseInt(sessionStats.total_sessions || '0'),
    };
    
    res.json(createApiResponse(analytics));
  } catch (error) {
    console.error('Error fetching context analytics:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch context analytics'));
  }
});

// Get performance analytics
router.get('/performance', async (req, res) => {
  try {
    // Search performance metrics
    const searchPerfQuery = `
      SELECT 
        AVG(execution_time_ms) as avg_search_time,
        COUNT(*) as total_searches
      FROM search_history
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `;
    
    const searchPerfRows = await dbService.query(searchPerfQuery);
    const searchPerf = searchPerfRows[0];
    
    const analytics = {
      averageSearchTime: parseFloat(searchPerf.avg_search_time || '145'),
      averageLoadTime: 320, // Mock value - would come from application monitoring
      apiResponseTime: 89,  // Mock value - would come from application monitoring
      totalSearches: parseInt(searchPerf.total_searches || '0'),
    };
    
    res.json(createApiResponse(analytics));
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json(createApiResponse(undefined, 'Failed to fetch performance analytics'));
  }
});

export default router;
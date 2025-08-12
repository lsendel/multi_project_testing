import type { SearchQuery, SearchResult, DocumentNode } from '@shared/types';
import { DatabaseService } from './DatabaseService.js';
import { DocumentService } from './DocumentService.js';

export class SearchService {
  constructor(
    private db = new DatabaseService(),
    private documentService = new DocumentService()
  ) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const { query: searchTerm, filters, sort, pagination } = query;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Full-text search
    if (searchTerm.trim()) {
      conditions.push(`(
        d.name ILIKE $${paramIndex} OR
        d.path ILIKE $${paramIndex} OR
        dc.preview ILIKE $${paramIndex} OR
        dc.full_text ILIKE $${paramIndex} OR
        ARRAY_TO_STRING(d.tags, ' ') ILIKE $${paramIndex}
      )`);
      values.push(`%${searchTerm}%`);
      paramIndex++;
    }
    
    // Document type filter
    if (filters?.documentType && filters.documentType.length > 0) {
      conditions.push(`d.document_type = ANY($${paramIndex})`);
      values.push(filters.documentType);
      paramIndex++;
    }
    
    // Tags filter
    if (filters?.tags && filters.tags.length > 0) {
      conditions.push(`d.tags && $${paramIndex}`);
      values.push(filters.tags);
      paramIndex++;
    }
    
    // Date range filter
    if (filters?.dateRange) {
      if (filters.dateRange.from) {
        conditions.push(`d.last_modified >= $${paramIndex}`);
        values.push(filters.dateRange.from);
        paramIndex++;
      }
      if (filters.dateRange.to) {
        conditions.push(`d.last_modified <= $${paramIndex}`);
        values.push(filters.dateRange.to);
        paramIndex++;
      }
    }
    
    // Size range filter
    if (filters?.sizeRange) {
      if (filters.sizeRange.min !== undefined) {
        conditions.push(`d.size >= $${paramIndex}`);
        values.push(filters.sizeRange.min);
        paramIndex++;
      }
      if (filters.sizeRange.max !== undefined) {
        conditions.push(`d.size <= $${paramIndex}`);
        values.push(filters.sizeRange.max);
        paramIndex++;
      }
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Build ORDER BY clause
    let orderBy = '';
    if (sort) {
      switch (sort.field) {
        case 'name':
          orderBy = `ORDER BY d.name ${sort.order.toUpperCase()}`;
          break;
        case 'date':
          orderBy = `ORDER BY d.last_modified ${sort.order.toUpperCase()}`;
          break;
        case 'size':
          orderBy = `ORDER BY d.size ${sort.order.toUpperCase()}`;
          break;
        case 'relevance':
        default:
          // Simple relevance scoring - in practice would be more sophisticated
          if (searchTerm.trim()) {
            orderBy = `ORDER BY (
              CASE WHEN d.name ILIKE '%${searchTerm}%' THEN 3 ELSE 0 END +
              CASE WHEN dc.preview ILIKE '%${searchTerm}%' THEN 2 ELSE 0 END +
              CASE WHEN ARRAY_TO_STRING(d.tags, ' ') ILIKE '%${searchTerm}%' THEN 1 ELSE 0 END +
              d.usage_count * 0.1
            ) ${sort.order.toUpperCase()}`;
          } else {
            orderBy = `ORDER BY d.usage_count ${sort.order.toUpperCase()}`;
          }
          break;
      }
    }
    
    // Build pagination
    const limit = pagination?.limit || 50;
    const offset = ((pagination?.page || 1) - 1) * limit;
    const limitClause = `LIMIT ${limit} OFFSET ${offset}`;
    
    // Main search query
    const searchQuery = `
      SELECT 
        d.*,
        dc.preview,
        dc.full_text,
        dc.embeddings,
        COUNT(*) OVER() as total_count
      FROM documents d
      LEFT JOIN document_content dc ON d.id = dc.document_id
      ${whereClause}
      ${orderBy}
      ${limitClause}
    `;
    
    const rows = await this.db.query(searchQuery, values);
    
    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
    const nodes = this.mapRowsToDocuments(rows);
    
    // Calculate relevance scores
    if (searchTerm.trim()) {
      nodes.forEach(node => {
        let score = 0;
        const term = searchTerm.toLowerCase();
        
        if (node.name.toLowerCase().includes(term)) score += 0.5;
        if (node.path.toLowerCase().includes(term)) score += 0.3;
        if (node.content?.preview?.toLowerCase().includes(term)) score += 0.4;
        if (node.metadata.tags.some(tag => tag.toLowerCase().includes(term))) score += 0.2;
        
        // Normalize score
        node.metadata.relevanceScore = Math.min(1, score);
      });
    }
    
    // Get facets
    const facets = await this.getFacets(conditions, values.slice(0, paramIndex - 1));
    
    return {
      nodes,
      totalCount,
      facets,
      searchTime: 0, // Will be set by caller
    };
  }

  async facetedSearch(query: SearchQuery): Promise<SearchResult & {
    facets: {
      documentTypes: Record<string, number>;
      tags: Record<string, number>;
      sizeRanges: Record<string, number>;
      dateRanges: Record<string, number>;
    };
  }> {
    const result = await this.search(query);
    const extendedFacets = await this.getExtendedFacets();
    
    return {
      ...result,
      facets: {
        ...result.facets,
        ...extendedFacets,
      },
    };
  }

  async getSuggestions(query: string, limit: number = 10): Promise<string[]> {
    // Get suggestions from search history
    const historyQuery = `
      SELECT DISTINCT query
      FROM search_history
      WHERE query ILIKE $1
      AND LENGTH(query) > 2
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const historyRows = await this.db.query(historyQuery, [`%${query}%`, limit]);
    const historySuggestions = historyRows.map(row => row.query);
    
    // Get suggestions from document names and tags
    const documentQuery = `
      SELECT DISTINCT name as suggestion
      FROM documents
      WHERE name ILIKE $1
      UNION
      SELECT DISTINCT UNNEST(tags) as suggestion
      FROM documents
      WHERE UNNEST(tags) ILIKE $1
      ORDER BY suggestion
      LIMIT $2
    `;
    
    const documentRows = await this.db.query(documentQuery, [`%${query}%`, limit]);
    const documentSuggestions = documentRows.map(row => row.suggestion);
    
    // Combine and deduplicate
    const allSuggestions = [...new Set([...historySuggestions, ...documentSuggestions])];
    
    return allSuggestions.slice(0, limit);
  }

  async logSearch(query: SearchQuery, resultCount: number, executionTime: number): Promise<void> {
    const logQuery = `
      INSERT INTO search_history (query, filters, results_count, execution_time_ms)
      VALUES ($1, $2, $3, $4)
    `;
    
    await this.db.query(logQuery, [
      query.query,
      JSON.stringify(query.filters || {}),
      resultCount,
      executionTime,
    ]);
  }

  async getSearchAnalytics(): Promise<{
    topQueries: { query: string; count: number }[];
    searchVolume: { date: string; count: number }[];
    averageResultCount: number;
  }> {
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
    
    const topQueriesRows = await this.db.query(topQueriesQuery);
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
      ORDER BY date
    `;
    
    const volumeRows = await this.db.query(volumeQuery);
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
    
    const avgRows = await this.db.query(avgQuery);
    const averageResultCount = parseFloat(avgRows[0]?.average || '0');
    
    return {
      topQueries,
      searchVolume,
      averageResultCount,
    };
  }

  async getPopularSearches(limit: number): Promise<{ query: string; count: number }[]> {
    const query = `
      SELECT query, COUNT(*) as count
      FROM search_history
      WHERE created_at > NOW() - INTERVAL '7 days'
      AND LENGTH(query) > 2
      GROUP BY query
      ORDER BY count DESC
      LIMIT $1
    `;
    
    const rows = await this.db.query(query, [limit]);
    return rows.map(row => ({
      query: row.query,
      count: parseInt(row.count),
    }));
  }

  async findSimilarDocuments(documentId: string, limit: number): Promise<DocumentNode[]> {
    // Delegate to DocumentService
    return this.documentService.getRelatedDocuments(documentId, limit);
  }

  private async getFacets(conditions: string[], values: any[]): Promise<{
    documentTypes: Record<string, number>;
    tags: Record<string, number>;
  }> {
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Document types facet
    const typesQuery = `
      SELECT document_type, COUNT(*) as count
      FROM documents d
      ${whereClause}
      GROUP BY document_type
      ORDER BY count DESC
    `;
    
    const typesRows = await this.db.query(typesQuery, values);
    const documentTypes: Record<string, number> = {};
    typesRows.forEach(row => {
      documentTypes[row.document_type] = parseInt(row.count);
    });
    
    // Tags facet
    const tagsQuery = `
      SELECT UNNEST(tags) as tag, COUNT(*) as count
      FROM documents d
      ${whereClause}
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 20
    `;
    
    const tagsRows = await this.db.query(tagsQuery, values);
    const tags: Record<string, number> = {};
    tagsRows.forEach(row => {
      tags[row.tag] = parseInt(row.count);
    });
    
    return { documentTypes, tags };
  }

  private async getExtendedFacets(): Promise<{
    sizeRanges: Record<string, number>;
    dateRanges: Record<string, number>;
  }> {
    // Size ranges
    const sizeQuery = `
      SELECT 
        CASE 
          WHEN size < 1024 THEN 'Small (<1KB)'
          WHEN size < 1024 * 1024 THEN 'Medium (1KB-1MB)'
          WHEN size < 1024 * 1024 * 10 THEN 'Large (1-10MB)'
          ELSE 'Very Large (>10MB)'
        END as size_range,
        COUNT(*) as count
      FROM documents
      GROUP BY size_range
      ORDER BY 
        CASE 
          WHEN size_range = 'Small (<1KB)' THEN 1
          WHEN size_range = 'Medium (1KB-1MB)' THEN 2
          WHEN size_range = 'Large (1-10MB)' THEN 3
          ELSE 4
        END
    `;
    
    const sizeRows = await this.db.query(sizeQuery);
    const sizeRanges: Record<string, number> = {};
    sizeRows.forEach(row => {
      sizeRanges[row.size_range] = parseInt(row.count);
    });
    
    // Date ranges
    const dateQuery = `
      SELECT 
        CASE 
          WHEN last_modified > NOW() - INTERVAL '1 day' THEN 'Today'
          WHEN last_modified > NOW() - INTERVAL '7 days' THEN 'This Week'
          WHEN last_modified > NOW() - INTERVAL '30 days' THEN 'This Month'
          WHEN last_modified > NOW() - INTERVAL '365 days' THEN 'This Year'
          ELSE 'Older'
        END as date_range,
        COUNT(*) as count
      FROM documents
      GROUP BY date_range
      ORDER BY 
        CASE 
          WHEN date_range = 'Today' THEN 1
          WHEN date_range = 'This Week' THEN 2
          WHEN date_range = 'This Month' THEN 3
          WHEN date_range = 'This Year' THEN 4
          ELSE 5
        END
    `;
    
    const dateRows = await this.db.query(dateQuery);
    const dateRanges: Record<string, number> = {};
    dateRows.forEach(row => {
      dateRanges[row.date_range] = parseInt(row.count);
    });
    
    return { sizeRanges, dateRanges };
  }

  private mapRowsToDocuments(rows: any[]): DocumentNode[] {
    return rows.map(row => ({
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
}
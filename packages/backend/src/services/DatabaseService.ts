import pg from 'pg';

const { Pool } = pg;

export class DatabaseService {
  private pool: pg.Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'knowledge_tree',
      user: process.env.DB_USER || 'dev_user',
      password: process.env.DB_PASSWORD || 'dev_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Initialize database on startup
    this.initialize();
  }

  async query(text: string, params?: any[]): Promise<any[]> {
    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query executed in ${duration}ms:`, text);
      }
      
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  async transaction<T>(callback: (query: (text: string, params?: any[]) => Promise<any[]>) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const transactionQuery = (text: string, params?: any[]) => {
        return client.query(text, params).then(result => result.rows);
      };
      
      const result = await callback(transactionQuery);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async initialize(): Promise<void> {
    try {
      // Test connection
      await this.query('SELECT 1');
      console.log('✅ Database connection established');
      
      // Ensure database is up to date
      await this.runMigrations();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    // Check if migrations table exists
    const migrationTableExists = await this.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (!migrationTableExists[0].exists) {
      // Create migrations table
      await this.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('📄 Created migrations table');
    }

    // List of migrations to run
    const migrations = [
      {
        name: '001_add_search_indexes',
        sql: `
          -- Add search indexes if they don't exist
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_name_trgm ON documents USING gin(name gin_trgm_ops);
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_content_preview_trgm ON document_content USING gin(preview gin_trgm_ops);
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_content_fulltext ON document_content USING gin(to_tsvector('english', full_text));
        `
      },
      {
        name: '002_add_analytics_tables',
        sql: `
          -- Create analytics tables if they don't exist
          CREATE TABLE IF NOT EXISTS analytics_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            event_type VARCHAR(50) NOT NULL,
            document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
            user_id VARCHAR(255),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
          CREATE INDEX IF NOT EXISTS idx_analytics_events_document ON analytics_events(document_id);
          CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
        `
      }
    ];

    for (const migration of migrations) {
      const applied = await this.query(
        'SELECT 1 FROM migrations WHERE name = $1',
        [migration.name]
      );

      if (applied.length === 0) {
        try {
          await this.query(migration.sql);
          await this.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migration.name]
          );
          console.log(`✅ Applied migration: ${migration.name}`);
        } catch (error) {
          console.error(`❌ Failed to apply migration ${migration.name}:`, error);
          // Don't throw - let app continue with basic functionality
        }
      }
    }
  }

  // Utility methods
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    connections: {
      total: number;
      idle: number;
      waiting: number;
    };
  }> {
    try {
      await this.query('SELECT 1');
      
      return {
        status: 'healthy',
        connections: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connections: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount,
        },
      };
    }
  }

  async getStats(): Promise<{
    documentsCount: number;
    searchHistoryCount: number;
    contextSessionsCount: number;
    collectionsCount: number;
  }> {
    const stats = await this.query(`
      SELECT 
        (SELECT COUNT(*) FROM documents) as documents_count,
        (SELECT COUNT(*) FROM search_history) as search_history_count,
        (SELECT COUNT(*) FROM context_sessions) as context_sessions_count,
        (SELECT COUNT(*) FROM collections WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections')) as collections_count
    `);

    return {
      documentsCount: parseInt(stats[0].documents_count || '0'),
      searchHistoryCount: parseInt(stats[0].search_history_count || '0'),
      contextSessionsCount: parseInt(stats[0].context_sessions_count || '0'),
      collectionsCount: parseInt(stats[0].collections_count || '0'),
    };
  }
}
import type { DocumentNode } from '@shared/types';
import { DatabaseService } from './DatabaseService.js';

export class DocumentService {
  constructor(private db = new DatabaseService()) {}

  async getAllDocuments(): Promise<DocumentNode[]> {
    const query = `
      SELECT 
        d.*,
        dc.preview,
        dc.full_text,
        dc.embeddings
      FROM documents d
      LEFT JOIN document_content dc ON d.id = dc.document_id
      ORDER BY d.path
    `;
    
    const rows = await this.db.query(query);
    return this.mapRowsToDocuments(rows);
  }

  async getDocumentById(id: string): Promise<DocumentNode | null> {
    const query = `
      SELECT 
        d.*,
        dc.preview,
        dc.full_text,
        dc.embeddings
      FROM documents d
      LEFT JOIN document_content dc ON d.id = dc.document_id
      WHERE d.id = $1
    `;
    
    const rows = await this.db.query(query, [id]);
    const documents = this.mapRowsToDocuments(rows);
    
    if (documents.length === 0) return null;
    
    // Increment usage count
    await this.incrementUsageCount(id);
    
    return documents[0];
  }

  async createDocument(data: Omit<DocumentNode, 'id'>): Promise<DocumentNode> {
    const id = crypto.randomUUID();
    
    // Insert document
    const documentQuery = `
      INSERT INTO documents (
        id, name, type, path, parent_id, size, last_modified, 
        document_type, tags, relevance_score, usage_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const documentValues = [
      id,
      data.name,
      data.type,
      data.path,
      data.parentId || null,
      data.metadata.size,
      data.metadata.lastModified,
      data.metadata.documentType,
      data.metadata.tags,
      data.metadata.relevanceScore || null,
      data.metadata.usageCount,
    ];
    
    await this.db.query(documentQuery, documentValues);
    
    // Insert content if provided
    if (data.content) {
      const contentQuery = `
        INSERT INTO document_content (document_id, preview, full_text, embeddings)
        VALUES ($1, $2, $3, $4)
      `;
      
      const contentValues = [
        id,
        data.content.preview,
        data.content.fullText || null,
        data.content.embeddings || null,
      ];
      
      await this.db.query(contentQuery, contentValues);
    }
    
    return this.getDocumentById(id) as Promise<DocumentNode>;
  }

  async updateDocument(id: string, updates: Partial<DocumentNode>): Promise<DocumentNode | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Build dynamic update query
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    
    if (updates.type !== undefined) {
      setClauses.push(`type = $${paramIndex++}`);
      values.push(updates.type);
    }
    
    if (updates.path !== undefined) {
      setClauses.push(`path = $${paramIndex++}`);
      values.push(updates.path);
    }
    
    if (updates.parentId !== undefined) {
      setClauses.push(`parent_id = $${paramIndex++}`);
      values.push(updates.parentId);
    }
    
    if (updates.metadata) {
      const { metadata } = updates;
      
      if (metadata.size !== undefined) {
        setClauses.push(`size = $${paramIndex++}`);
        values.push(metadata.size);
      }
      
      if (metadata.lastModified !== undefined) {
        setClauses.push(`last_modified = $${paramIndex++}`);
        values.push(metadata.lastModified);
      }
      
      if (metadata.documentType !== undefined) {
        setClauses.push(`document_type = $${paramIndex++}`);
        values.push(metadata.documentType);
      }
      
      if (metadata.tags !== undefined) {
        setClauses.push(`tags = $${paramIndex++}`);
        values.push(metadata.tags);
      }
      
      if (metadata.relevanceScore !== undefined) {
        setClauses.push(`relevance_score = $${paramIndex++}`);
        values.push(metadata.relevanceScore);
      }
    }
    
    if (setClauses.length === 0) {
      return this.getDocumentById(id);
    }
    
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE documents 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await this.db.query(query, values);
    
    if (result.length === 0) return null;
    
    // Update content if provided
    if (updates.content) {
      const contentQuery = `
        INSERT INTO document_content (document_id, preview, full_text, embeddings)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (document_id)
        DO UPDATE SET 
          preview = EXCLUDED.preview,
          full_text = EXCLUDED.full_text,
          embeddings = EXCLUDED.embeddings,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      const contentValues = [
        id,
        updates.content.preview,
        updates.content.fullText || null,
        updates.content.embeddings || null,
      ];
      
      await this.db.query(contentQuery, contentValues);
    }
    
    return this.getDocumentById(id);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const query = `DELETE FROM documents WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    
    return result.length > 0;
  }

  async incrementUsageCount(id: string): Promise<void> {
    const query = `
      UPDATE documents 
      SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await this.db.query(query, [id]);
  }

  async getDocumentAnalytics(id: string): Promise<{
    usageCount: number;
    lastAccessed: string;
    contextUsage: number;
    relatedDocuments: string[];
  }> {
    const query = `
      SELECT 
        usage_count,
        updated_at as last_accessed,
        (
          SELECT COUNT(*)
          FROM context_sessions cs
          WHERE $1 = ANY(cs.included_nodes) OR $1 = ANY(cs.pinned_nodes)
        ) as context_usage
      FROM documents 
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [id]);
    
    if (result.length === 0) {
      throw new Error('Document not found');
    }
    
    const row = result[0];
    const related = await this.getRelatedDocuments(id, 5);
    
    return {
      usageCount: row.usage_count,
      lastAccessed: row.last_accessed,
      contextUsage: row.context_usage,
      relatedDocuments: related.map(doc => doc.id),
    };
  }

  async getRelatedDocuments(id: string, limit: number = 10): Promise<DocumentNode[]> {
    // This is a simplified version - in practice would use more sophisticated similarity
    const query = `
      WITH target_doc AS (
        SELECT tags, document_type, parent_id
        FROM documents 
        WHERE id = $1
      ),
      similar_docs AS (
        SELECT d.*, 
          CASE 
            WHEN d.parent_id = target_doc.parent_id THEN 3
            WHEN d.document_type = target_doc.document_type THEN 2
            WHEN d.tags && target_doc.tags THEN 1
            ELSE 0
          END as similarity_score
        FROM documents d, target_doc
        WHERE d.id != $1
        AND (
          d.parent_id = target_doc.parent_id OR
          d.document_type = target_doc.document_type OR
          d.tags && target_doc.tags
        )
      )
      SELECT 
        sd.*,
        dc.preview,
        dc.full_text,
        dc.embeddings
      FROM similar_docs sd
      LEFT JOIN document_content dc ON sd.id = dc.document_id
      ORDER BY sd.similarity_score DESC, sd.usage_count DESC
      LIMIT $2
    `;
    
    const rows = await this.db.query(query, [id, limit]);
    return this.mapRowsToDocuments(rows);
  }

  private mapRowsToDocuments(rows: any[]): DocumentNode[] {
    const documentMap = new Map<string, DocumentNode>();
    
    for (const row of rows) {
      const doc: DocumentNode = {
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
      };
      
      if (row.preview || row.full_text || row.embeddings) {
        doc.content = {
          preview: row.preview,
          fullText: row.full_text,
          embeddings: row.embeddings,
        };
      }
      
      documentMap.set(doc.id, doc);
    }
    
    // Build tree structure
    const rootDocs: DocumentNode[] = [];
    const childrenMap = new Map<string, DocumentNode[]>();
    
    for (const doc of documentMap.values()) {
      if (!doc.parentId) {
        rootDocs.push(doc);
      } else {
        if (!childrenMap.has(doc.parentId)) {
          childrenMap.set(doc.parentId, []);
        }
        childrenMap.get(doc.parentId)!.push(doc);
      }
    }
    
    // Assign children to parents
    function assignChildren(doc: DocumentNode) {
      const children = childrenMap.get(doc.id);
      if (children) {
        doc.children = children.sort((a, b) => a.name.localeCompare(b.name));
        doc.children.forEach(assignChildren);
      }
    }
    
    rootDocs.forEach(assignChildren);
    
    // Return flattened array for API
    return Array.from(documentMap.values());
  }
}
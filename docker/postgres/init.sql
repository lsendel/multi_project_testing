-- Initialize Knowledge Tree Database Schema

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('folder', 'document')),
    path TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    size BIGINT DEFAULT 0,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    document_type VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    relevance_score FLOAT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document content table (separate for performance)
CREATE TABLE document_content (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    preview TEXT,
    full_text TEXT,
    embeddings FLOAT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Context sessions table
CREATE TABLE context_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_name VARCHAR(255),
    included_nodes UUID[] DEFAULT '{}',
    pinned_nodes UUID[] DEFAULT '{}',
    excluded_nodes UUID[] DEFAULT '{}',
    token_usage JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Search history table
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_documents_parent_id ON documents(parent_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_path ON documents USING gin(path gin_trgm_ops);
CREATE INDEX idx_documents_tags ON documents USING gin(tags);
CREATE INDEX idx_documents_last_modified ON documents(last_modified DESC);
CREATE INDEX idx_document_content_full_text ON document_content USING gin(to_tsvector('english', full_text));
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_content_updated_at BEFORE UPDATE ON document_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_context_sessions_updated_at BEFORE UPDATE ON context_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO documents (name, type, path, document_type, tags) VALUES
    ('Root', 'folder', '/', 'folder', '{}'),
    ('Documentation', 'folder', '/documentation', 'folder', '{documentation}'),
    ('API Docs', 'document', '/documentation/api-docs.md', 'markdown', '{documentation, api}'),
    ('User Guide', 'document', '/documentation/user-guide.md', 'markdown', '{documentation, guide}'),
    ('Projects', 'folder', '/projects', 'folder', '{projects}'),
    ('Project A', 'folder', '/projects/project-a', 'folder', '{projects, active}'),
    ('README', 'document', '/projects/project-a/README.md', 'markdown', '{projects, readme}');

-- Insert sample content
INSERT INTO document_content (document_id, preview, full_text) 
SELECT 
    id, 
    'Sample preview for ' || name,
    'This is sample full text content for ' || name || '. Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
FROM documents WHERE type = 'document';

-- Insert sample user preferences
INSERT INTO user_preferences (user_id, preferences) VALUES
    ('default_user', '{
        "view": {
            "defaultExpansionLevel": 2,
            "sortBy": "name",
            "viewMode": "tree",
            "showMetadata": true
        },
        "behavior": {
            "autoIncludeRelated": false,
            "contextInclusionDefault": "manual",
            "enableAnimations": true
        },
        "accessibility": {
            "highContrast": false,
            "reducedMotion": false,
            "fontSize": "medium"
        }
    }');
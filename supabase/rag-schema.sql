-- ========================================================
-- NEXA Intelligence - RAG & Knowledge Vector Extension
-- Knowledge Engine: Sergio Flórez & Abogados
-- Target Database: Supabase PostgreSQL with pgvector
-- ========================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. KNOWLEDGE DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    knowledge_area TEXT NOT NULL,
    source_name TEXT NOT NULL DEFAULT 'Sergio Flórez & Abogados',
    file_name TEXT NOT NULL,
    storage_path TEXT,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    file_size INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'UPLOADED', -- 'UPLOADED', 'PROCESSING', 'INDEXED', 'FAILED'
    page_count INTEGER NOT NULL DEFAULT 0,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. KNOWLEDGE CHUNKS TABLE (1536 dims for OpenAI text-embedding-3-small)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_kdocs_org ON knowledge_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_kdocs_status ON knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_kchunks_doc ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_kchunks_embedding_hnsw 
    ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- 5. VECTOR SIMILARITY SEARCH RPC
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.30,
    match_count INT DEFAULT 5,
    filter_knowledge_area TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title TEXT,
    knowledge_area TEXT,
    source_name TEXT,
    content TEXT,
    page_number INT,
    chunk_index INT,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.document_id,
        kd.title AS document_title,
        kd.knowledge_area,
        kd.source_name,
        kc.content,
        kc.page_number,
        kc.chunk_index,
        (1 - (kc.embedding <=> query_embedding))::FLOAT AS similarity
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kc.document_id = kd.id
    WHERE kd.status = 'INDEXED'
      AND (filter_knowledge_area IS NULL OR kd.knowledge_area = filter_knowledge_area)
      AND (1 - (kc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY kc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 6. STORAGE BUCKET FOR DOCUMENTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-documents', 'knowledge-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "POC public knowledge_documents" ON knowledge_documents;
    CREATE POLICY "POC public knowledge_documents" ON knowledge_documents FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "POC public knowledge_chunks" ON knowledge_chunks;
    CREATE POLICY "POC public knowledge_chunks" ON knowledge_chunks FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "POC public storage knowledge-documents" ON storage.objects;
    CREATE POLICY "POC public storage knowledge-documents" ON storage.objects
    FOR ALL USING (bucket_id = 'knowledge-documents') WITH CHECK (bucket_id = 'knowledge-documents');
END $$;

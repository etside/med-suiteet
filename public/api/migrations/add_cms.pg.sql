-- PostgreSQL: CMS content (pg-api.php, optional on Neon)
CREATE TABLE IF NOT EXISTS cms_content (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT,
  category VARCHAR(100) DEFAULT 'announcement',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  excerpt TEXT,
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_status ON cms_content (status);
CREATE INDEX IF NOT EXISTS idx_cms_category ON cms_content (category);

-- CMS content (MySQL) — run once: mysql -u user -p dbname < public/api/migrations/add_cms.sql
CREATE TABLE IF NOT EXISTS cms_content (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content MEDIUMTEXT,
  category VARCHAR(100) DEFAULT 'announcement',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  excerpt TEXT,
  author_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_status (status),
  INDEX idx_cms_category (category)
) ENGINE=InnoDB;

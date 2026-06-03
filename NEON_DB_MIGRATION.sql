-- Neon DB MySQL Migration Guide for Medsuite-eT v3.0
-- Enhanced features: Biometric auth, PIN login, Content Management System, Analytics

-- ============================================
-- 1. User Authentication Enhancements
-- ============================================

-- Add biometric support to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  biometric_enrolled BOOLEAN DEFAULT FALSE COMMENT 'Whether biometric is enrolled';

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  biometric_data LONGBLOB COMMENT 'Encrypted biometric template';

-- Add PIN support to users table  
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  pin_hash VARCHAR(255) COMMENT 'bcrypt hashed PIN';

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  pin_attempts INT DEFAULT 0 COMMENT 'Failed PIN attempts counter';

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  pin_locked_until TIMESTAMP NULL COMMENT 'PIN lock expiration';

-- Create authentication logs table
CREATE TABLE IF NOT EXISTS auth_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  auth_method ENUM('password', 'pin', 'biometric') NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_method_created (auth_method, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Content Management System (CMS)
-- ============================================

CREATE TABLE IF NOT EXISTS cms_content (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content LONGTEXT NOT NULL,
  category ENUM('blog', 'announcement', 'help', 'faq') NOT NULL,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  author_id BIGINT,
  excerpt TEXT,
  featured BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_category_status (category, status),
  INDEX idx_created (created_at),
  INDEX idx_featured (featured),
  FULLTEXT INDEX ft_search (title, content, excerpt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id BIGINT NOT NULL,
  author_id BIGINT,
  comment TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES cms_content(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_content_status (content_id, status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. User Onboarding & Feature Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS user_onboarding (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNIQUE NOT NULL,
  completed_steps TEXT COMMENT 'JSON array of completed step IDs',
  current_step INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feature_usage (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  usage_count INT DEFAULT 1,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_feature (user_id, feature_name),
  INDEX idx_feature (feature_name),
  INDEX idx_last_used (last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. Enhanced Product Analytics
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  sku VARCHAR(100) UNIQUE COMMENT 'Stock Keeping Unit';

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  barcode VARCHAR(255) UNIQUE COMMENT 'Barcode/EAN';

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  views_count INT DEFAULT 0 COMMENT 'Product view count';

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  rating DECIMAL(3,2) DEFAULT 0 COMMENT 'Average rating';

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  rating_count INT DEFAULT 0 COMMENT 'Number of ratings';

-- Create product analytics table
CREATE TABLE IF NOT EXISTS product_analytics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  date DATE NOT NULL,
  views INT DEFAULT 0,
  purchases INT DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_date (product_id, date),
  INDEX idx_date (date),
  INDEX idx_product_date (product_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. Sales Analytics & Revenue Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS sales_analytics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  total_sales INT DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  average_order_value DECIMAL(12,2) DEFAULT 0,
  top_product_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date (date),
  INDEX idx_date (date),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. System Configuration & Settings
-- ============================================

CREATE TABLE IF NOT EXISTS system_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value LONGTEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configurations
INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES
('app_name', 'Medsuite-eT', 'Application name'),
('app_version', '3.0.0', 'Application version'),
('biometric_enabled', 'true', 'Enable biometric authentication'),
('pin_enabled', 'true', 'Enable PIN authentication'),
('pin_length', '4', 'PIN length requirement'),
('pin_lockout_minutes', '5', 'Minutes to lock account after failed attempts'),
('pin_max_attempts', '3', 'Maximum failed PIN attempts before lockout'),
('two_factor_enabled', 'false', 'Enable 2FA requirement'),
('shop_enabled', 'true', 'Enable online shop'),
('cms_enabled', 'true', 'Enable CMS'),
('analytics_enabled', 'true', 'Enable detailed analytics');

-- ============================================
-- 7. Indexes for Performance
-- ============================================

-- Optimize existing tables
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_user_created (user_id, created_at);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_status_created (status, created_at);

ALTER TABLE sales ADD INDEX IF NOT EXISTS idx_user_created (user_id, created_at);
ALTER TABLE sales ADD INDEX IF NOT EXISTS idx_created (created_at);

ALTER TABLE inventory ADD INDEX IF NOT EXISTS idx_product_user (product_id, user_id);

-- ============================================
-- 8. Audit Logging
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(255),
  record_id BIGINT,
  changes JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_action (user_id, action),
  INDEX idx_table (table_name),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Neon DB Specific Optimizations
-- ============================================

-- Enable query statistics for Neon
-- Note: Execute these in Neon dashboard if needed
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Update table statistics
ANALYZE TABLE users;
ANALYZE TABLE orders;
ANALYZE TABLE products;
ANALYZE TABLE sales;
ANALYZE TABLE cms_content;
ANALYZE TABLE auth_logs;
ANALYZE TABLE product_analytics;
ANALYZE TABLE sales_analytics;

-- ============================================
-- Migration Complete
-- ============================================

-- Verify all tables created
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
ORDER BY TABLE_NAME;

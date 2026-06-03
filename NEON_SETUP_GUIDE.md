# Neon PostgreSQL Database Setup Guide

## 📋 Overview

This guide walks through setting up Medsuite-eT with Neon PostgreSQL to enable advanced features like biometric authentication, PIN login, and CMS.

---

## 🚀 Step 1: Create Neon Database

### 1.1 Sign up for Neon
1. Visit https://console.neon.tech
2. Click "Sign up"
3. Create account with GitHub or email
4. Create a new project named "medsuite-et"

### 1.2 Get Connection Details
After creating project, you'll see:
```
Host: [project-id].neon.tech
Database: neondb
User: postgres
Password: [auto-generated]
```

**Save these credentials securely** — you'll need them next.

---

## 🔧 Step 2: Configure Backend

### 2.1 Update config.php

```bash
cd public/api
cp config.neon.php config.php
```

### 2.2 Set Environment Variables

Edit `config.php`:
```php
return [
    'db_type' => 'postgresql',
    'db_host' => 'your-project-id.neon.tech',
    'db_port' => '5432',
    'db_name' => 'neondb',
    'db_user' => 'postgres',
    'db_pass' => 'your-password-here',
    'jwt_secret' => 'change-to-long-random-string',
];
```

Or use environment variables:
```bash
export NEON_HOST="your-project-id.neon.tech"
export NEON_PORT="5432"
export NEON_DB="neondb"
export NEON_USER="postgres"
export NEON_PASS="your-password"
export JWT_SECRET="super-secret-key"
```

### 2.3 Test Connection

```bash
php -r "
require 'config.php';
\$config = require 'config.php';
try {
    \$dsn = 'pgsql:host=' . \$config['db_host'] . ';dbname=' . \$config['db_name'];
    \$pdo = new PDO(\$dsn, \$config['db_user'], \$config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo \"✓ Connected to PostgreSQL\\n\";
} catch (Exception \$e) {
    echo \"✗ Connection failed: \" . \$e->getMessage();
}
"
```

---

## 📊 Step 3: Run Database Migration

### 3.1 Connect to Neon Database

**Option A: Using psql (PostgreSQL CLI)**

```bash
# Install psql if needed
# macOS: brew install postgresql
# Ubuntu: apt install postgresql-client
# Windows: Download from postgresql.org

psql -h [your-host].neon.tech -U postgres -d neondb
```

**Option B: Using Neon Web Console**

1. Go to https://console.neon.tech
2. Select your project
3. Go to "SQL Editor"
4. Create new query

### 3.2 Run Migration Script

Copy content from `NEON_DB_MIGRATION.sql` and execute:

```sql
-- Copy all SQL from NEON_DB_MIGRATION.sql and paste here
```

Or via command line:

```bash
psql -h [your-host].neon.tech -U postgres -d neondb -f NEON_DB_MIGRATION.sql
```

### 3.3 Verify Tables Created

```sql
-- List all tables
\dt

-- Check specific tables
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
```

**Expected tables:**
```
users
profiles
products
inventory
sales
orders
auth_logs
cms_content
cms_comments
user_onboarding
feature_usage
product_analytics
sales_analytics
system_config
audit_logs
```

---

## 🔐 Step 4: Enable Advanced Authentication

### 4.1 Enable Biometric Support

```sql
UPDATE system_config 
SET config_value = 'true' 
WHERE config_key = 'biometric_enabled';
```

### 4.2 Enable PIN Login

```sql
UPDATE system_config 
SET config_value = 'true' 
WHERE config_key = 'pin_enabled';
```

### 4.3 Create Admin User with All Features

```sql
INSERT INTO users (email, password_hash, role, biometric_enrolled, pin_hash)
VALUES (
    'admin@medsuite.app',
    '$2y$10$...', -- bcrypt hash of password
    'super_admin',
    false,
    '$2y$10$...'  -- bcrypt hash of PIN 1234
);
```

---

## 🔌 Step 5: Update Frontend API Endpoint

Edit `src/lib/api.ts`:

```typescript
export const API_BASE_URL = process.env.VITE_API_BASE || 
    'https://your-domain.com/api';

// Or for direct PostgreSQL backend:
export const API_BASE_URL = 'https://your-server.com/public/api/pg-api.php';
```

---

## ✅ Step 6: Test Features

### Test Password Login
```bash
curl -X POST http://localhost:5173/api/auth_login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medsuite.app",
    "password": "YourPassword123"
  }'
```

### Test PIN Login
```bash
curl -X POST http://localhost:5173/api/auth_pin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medsuite.app",
    "pin": "1234"
  }'
```

### Test Biometric Enrollment
```bash
curl -X POST http://localhost:5173/api/auth_enroll_biometric \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "credential": {
      "id": "...",
      "rawId": "...",
      "response": {}
    }
  }'
```

---

## 🛠️ Troubleshooting

### Connection Refused
```
Error: could not connect to server
```
**Solution:**
- Check host is correct (includes .neon.tech)
- Verify password is correct
- Check Neon dashboard for IP whitelist settings
- Ensure SSL mode is set correctly

### SSL Connection Error
```
Error: SSL/TLS connection error
```
**Solution:**
Add `sslmode=require` to your DSN:
```php
$dsn = "pgsql:host={$host};port=5432;dbname={$name};sslmode=require";
```

### Table Already Exists
```
Error: relation "users" already exists
```
**Solution:**
Drop and recreate:
```sql
DROP TABLE IF EXISTS users CASCADE;
```

Then re-run migration.

### Authentication Fails After Migration
- Verify user exists: `SELECT * FROM users;`
- Check password hash: `SELECT email, password_hash FROM users;`
- Test token verification works

---

## 📈 Performance Tuning

### 1. Add Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_sales_date ON sales(created_at DESC);
CREATE INDEX idx_products_sku ON products(sku);
```

### 2. Analyze Tables
```sql
ANALYZE users;
ANALYZE sales;
ANALYZE orders;
```

### 3. Enable Query Planning
```sql
SET log_statement = 'all';
SET log_duration = 'on';
```

---

## 🔄 Backup & Restore

### Backup Database
```bash
pg_dump -h [host].neon.tech -U postgres -d neondb > backup.sql
```

### Restore Database
```bash
psql -h [host].neon.tech -U postgres -d neondb < backup.sql
```

---

## 📊 Database Stats

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('neondb'));

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check row counts
SELECT
    tablename,
    (SELECT count(*) FROM pg_class WHERE relname = tablename) as rows
FROM pg_tables
WHERE schemaname = 'public';
```

---

## 🚀 Next Steps

1. **Test locally** with Docker PostgreSQL first
2. **Deploy to staging** before production
3. **Run performance tests** with expected load
4. **Configure monitoring** and alerting
5. **Setup automated backups** with Neon

---

## 📚 Resources

- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **Medsuite API**: See `API_DOCUMENTATION.md`
- **Database Schema**: See `NEON_DB_MIGRATION.sql`

---

## ✨ Features Enabled with PostgreSQL

✓ Biometric Authentication (WebAuthn)  
✓ PIN-based Login  
✓ Advanced CMS with Full-Text Search  
✓ Analytics & Reporting  
✓ Audit Logging  
✓ Better Performance with JSON Support  
✓ More Concurrent Users  
✓ Enhanced Security Features  

---

**Neon Setup Guide v1.0**  
**Last Updated**: June 2024

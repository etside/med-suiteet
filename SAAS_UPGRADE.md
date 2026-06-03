# Medsuite-eT SaaS Upgrade (v2.1)

## What changed

### PWA & mobile
- Single manifest (`public/manifest.json`) with SVG icons — no missing PNG assets
- API requests use **NetworkOnly** in the service worker (no stale auth/data cache)
- Accessible viewport (`viewport-fit=cover`, zoom allowed)
- Offline banner when the network drops
- Apple touch icon + favicon use `/logo.svg`

### Security & routing
- **Role-based routes**: staff/admin pages redirect customers to `/dashboard`
- Netlify login uses **bcrypt** (legacy plaintext auto-upgrades on login)
- Security headers on Netlify (`X-Frame-Options`, `Referrer-Policy`, etc.)
- Removed hardcoded demo password from the login form

### API unification
- Netlify functions accept `auth_login`, `auth_signup`, `auth_me` (same as PHP client)
- Health check shape aligned with PHP
- MySQL `cms_content` endpoint + migration (`public/api/migrations/add_cms.sql`)
- JWT `verify_token` / UUID user IDs fixed for MySQL

### Biometric (WebAuthn) on MySQL
- Run `public/api/migrations/add_biometric.sql`
- Enroll in **Profile → Biometric Authentication** (admin only)
- Sign in via **Biometric** tab on `/auth`

### Configuration
- See `.env.example` for `VITE_API_BASE`, `VITE_ENABLE_PIN_AUTH`, etc.

## Recommended production setup

1. **Frontend**: Netlify or cPanel static hosting (`npm run build`)
2. **API**: Host `public/api/` on PHP 8 + MySQL 8
3. Set `VITE_API_BASE=https://your-api.example.com/api/index.php` in Netlify env
4. Run migrations: `add_cms.sql` if using CMS
5. Seed admin: `php public/api/seed-admin.php you@pharmacy.com SecurePass123`

## Local dev

```bash
npm run dev
# App: http://localhost:8080
# API: proxied to PHP :8090
```

## Bulk product import (Excel)

```bash
# Replace catalog from Med-products.xlsx (clears existing products + order line items)
npm run import:products -- /path/to/Med-products.xlsx --replace

# Append without clearing (default)
npm run import:products -- /path/to/Med-products.xlsx
```

Applies `add_manufacturer.sql` automatically when needed. Maps strength, dosage form, drug class, and indication into `description`.

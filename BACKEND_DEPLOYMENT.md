# Deploy PHP Backend to Render (Free Tier)

## Why Separate Backend?
- Netlify = Frontend only (static + JS functions)
- PHP needs separate hosting
- Render/Railway/Heroku support PHP with MySQL

## Quick Deploy to Render.com

### 1. Create Render Account
- Go to [Render.com](https://render.com)
- Sign up with GitHub

### 2. Deploy Your PHP Backend

Click: **New +** → **Web Service**

**Repository**: https://github.com/etside/med-suiteet
**Build Command**: 
```bash
composer install 2>/dev/null; true
```

**Start Command**:
```bash
php -S 0.0.0.0:${PORT:-8090} -t public/api
```

**Root Directory**: Leave empty

### 3. Add Environment Variables

In Render dashboard, go to **Environment**:

```
DB_HOST=your-mysql-host.com
DB_PORT=3306
DB_NAME=medsuite
DB_USER=medsuite
DB_PASS=medsuite_pass_123
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 4. Deploy & Get URL
Render gives you: `https://your-service.onrender.com`

### 5. Update Netlify Environment

Go to **Netlify → Site settings → Build & deploy → Environment**

Update:
```
VITE_API_URL=https://your-service.onrender.com/api/index.php
```

Trigger redeploy.

### 6. Update Backend CORS

In `public/api/config.php`, add at the top:

```php
<?php
// Allow Netlify frontend
header('Access-Control-Allow-Origin: https://med-et.netlify.app');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ... rest of config.php
```

## Alternative: Railway.app
[Railway.app](https://railway.app) is easier for PHP:

1. Click **Create New Project**
2. Click **Deploy from GitHub**
3. Select **med-suiteet** repo
4. Add **MySQL** plugin
5. Get environment variables from Railway dashboard
6. Deploy

Gets you a URL like: `https://med-suiteet-prod.railway.app`

## Alternative: Heroku (Paid)
- Same approach as Render
- More reliable
- Paid tier ($7+/month)

## Final Setup

Once backend is deployed, your architecture looks like:

```
User Browser
    ↓
Netlify Frontend (med-et.netlify.app)
    ↓
Render/Railway Backend (your-backend.onrender.com)
    ↓
MySQL Database
```

All with **automatic CORS** handling ✅

---

**Ready to deploy to Render or Railway?**

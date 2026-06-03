# Environment Variables Guide

## Frontend Environment Variables

The frontend uses environment variables prefixed with `VITE_` (Vite convention).

### Available Variables

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `VITE_API_URL` | PHP backend API endpoint | `/api/index.php` | `https://api.example.com/index.php` |

## Local Development Setup

### 1. Create `.env` file
```bash
cp .env.example .env
```

### 2. Configure for your setup

**Option A: Backend on same server (recommended for simple setup)**
```env
VITE_API_URL=/api/index.php
```

**Option B: Backend on different domain (for microservices)**
```env
VITE_API_URL=https://api.yourserver.com/api/index.php
```

### 3. Run dev server
```bash
npm run dev
```

## Netlify Deployment Configuration

### Option 1: Using Environment Variables (Recommended)

1. **Log in to Netlify**:
   - Go to your site dashboard
   - Settings → Environment variables

2. **Add environment variable**:
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend API URL (see options below)
   - Click Save

3. **Trigger redeploy**:
   - Go to Deploys
   - Click "Trigger deploy" to rebuild with new variables

### Option 2: Using Netlify UI

1. In Netlify Site settings → Build & deploy → Environment
2. Click "Edit variables"
3. Add `VITE_API_URL` with your backend URL

### Backend URL Options for Netlify

**Option A: Same Domain (Backend served from same Netlify site)**
```
VITE_API_URL=/api/index.php
```
✅ Requires: Backend files in `public/api/`
✅ Benefits: No CORS issues, simple setup
❌ Limitation: Mixes frontend & backend

**Option B: Different Netlify Site**
```
VITE_API_URL=https://your-backend-site.netlify.app/api/index.php
```
✅ Benefits: Separate frontend/backend deployments
⚠️ Note: Requires CORS configuration in PHP backend

**Option C: External Backend Server**
```
VITE_API_URL=https://your-server.com:8090/api/index.php
```
✅ Benefits: Keep existing PHP server
⚠️ Note: Requires CORS headers in config.php

**Option D: Vercel or Other Platform**
```
VITE_API_URL=https://your-api.vercel.app/api/index.php
```
✅ Benefits: Scalable backend infrastructure
⚠️ Note: Requires CORS configuration

## Backend Configuration

### PHP Backend CORS Setup (if frontend & backend on different domains)

In `public/api/config.php`, add CORS headers:
```php
// Allow cross-origin requests
header('Access-Control-Allow-Origin: https://your-netlify-site.netlify.app');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
```

## Environment Variables in GitHub Actions

For automatic Netlify deployments via GitHub Actions, set:

1. **In GitHub repo Settings → Secrets**:
   - `NETLIFY_AUTH_TOKEN` - Your Netlify personal access token
   - `NETLIFY_SITE_ID` - Your Netlify site ID

2. **In GitHub repo Settings → Variables**:
   - `VITE_API_URL` - Your API endpoint (or use Netlify env variables)

The GitHub Actions workflow will use these during builds.

## Build-Time vs Runtime Variables

⚠️ **Important**: Vite environment variables are embedded at **build time**, not runtime.

This means:
- ✅ You can change them during build (in Netlify Site settings)
- ❌ You cannot change them after deployment without rebuilding
- 🔄 To deploy with different API endpoints, set env variables **before** triggering deploy

## Troubleshooting

### 404 errors or failed API calls
- Check `VITE_API_URL` in Netlify env variables
- Verify backend is running at that URL
- Check browser console for actual API URL being used
- Enable CORS if using different domain

### Variable not being used
- Make sure you triggered a **new deploy** after adding/changing variables
- Verify variable name starts with `VITE_`
- Check that variable name matches the code: `import.meta.env.VITE_API_URL`

### How to verify variables
Open browser DevTools Console and run:
```javascript
// Check what API URL the app is using
console.log(import.meta.env)
```

## Examples

### Local Development
```env
# .env
VITE_API_URL=/api/index.php
```

### Netlify with Local Backend
```
VITE_API_URL=https://your-backend.com:8090/api/index.php
```

### Netlify with GitHub Actions Auto-Deploy
```
# Netlify Site Settings → Environment variables
VITE_API_URL=https://your-api.example.com/api/index.php
```

Then on push to `master`, GitHub Actions builds and deploys automatically with these variables.

## Security Notes

⚠️ Never commit `.env` files with sensitive data
✅ Use `.env.example` for template
✅ Add `.env` to `.gitignore` (already done)
✅ Store sensitive backend URLs in Netlify environment variables, not in code
✅ Use HTTPS for all API URLs in production

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

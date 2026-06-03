# Netlify Deployment Guide

## Quick Start

### Option 1: Deploy Directly with Netlify CLI

1. **Login to Netlify**:
   ```bash
   netlify login
   ```
   This opens your browser to authenticate.

2. **Deploy**:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Option 2: Connect GitHub Repository to Netlify

1. Visit [Netlify.com](https://netlify.com)
2. Click **"New site from Git"**
3. Choose **GitHub** as your Git provider
4. Select **etside/med-suiteet** repository
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **Deploy site**

### Option 3: GitHub Actions Automatic Deployment

This repository includes a GitHub Actions workflow that automatically deploys to Netlify on every push to `master`.

**Setup required**:
1. Get your Netlify Site ID and Auth Token:
   ```bash
   netlify status
   ```

2. Add secrets to GitHub:
   - Go to Settings → Secrets and Variables → Actions
   - Add `NETLIFY_SITE_ID` (find it in Netlify Site settings)
   - Add `NETLIFY_AUTH_TOKEN` (create at Netlify: User settings → Applications → Personal access tokens)

3. Push to master branch - automatic deployment starts!

## Deployment Details

- **Build Command**: `npm run build`
- **Publish Directory**: `dist/`
- **Environment**: Node.js 18+
- **Build Time**: ~12 seconds

## Configuration

The deployment is configured via:
- **netlify.toml** - Netlify-specific settings, redirects, and headers
- **public/_redirects** - URL redirect rules for SPA routing
- **.github/workflows/netlify.yml** - GitHub Actions workflow

## Features Configured

✅ Single Page Application (SPA) routing - all routes redirect to index.html
✅ Cache optimization - assets cached for 1 year, HTML/SW with no cache
✅ PWA Service Worker support
✅ Manifest file configuration
✅ Production deployment on master branch pushes

## After Deployment

Your site will be live at: **https://[your-site-name].netlify.app**

### API Configuration

Update your frontend to point to the correct API endpoint:
- Local: `http://127.0.0.1:8090`
- Production: Update `src/lib/api.ts` with your Netlify site's API URL or use relative paths

## Troubleshooting

**404 errors on page refresh?**
- The `_redirects` file ensures all routes go to index.html ✓

**Build fails?**
- Check Node.js version matches (18+)
- Ensure `npm ci` installs dependencies correctly
- View logs in Netlify or GitHub Actions

**Need to deploy a different branch?**
- Push to `master` branch for production
- Create PR for preview deployments (if configured)

## Links

- **Repository**: https://github.com/etside/med-suiteet
- **Netlify Site**: [Check GitHub Actions logs for deployed URL]
- **Build Status**: https://github.com/etside/med-suiteet/actions

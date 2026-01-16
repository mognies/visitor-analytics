# Deployment Guide for Immedio Lead Analytics

This guide covers deploying the Immedio Lead Analytics system to Vercel.

## Overview

The system consists of two main parts:
1. **Console App** (Next.js) - Analytics dashboard and API
2. **Sample Site** (Static HTML) - Demo site with SDK integration

## Prerequisites

- Vercel account
- Firecrawl API key (for page import feature)

## Environment Variables

### Console App

Set these environment variables in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `API_KEY` | Secret key for SDK authentication | `your-secure-random-key-123` |
| `FIRECRAWL_API_KEY` | API key from firecrawl.dev | `fc-xxxxxxxxxxxxx` |

### Sample Site

Set these environment variables in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `IMMEDIO_API_ENDPOINT` | Console app API URL | `https://your-console.vercel.app/api` |
| `IMMEDIO_API_KEY` | Must match console's API_KEY | `your-secure-random-key-123` |
| `IMMEDIO_FLUSH_INTERVAL` | Data send interval (ms) | `10000` |

## Deployment Steps

### 1. Deploy Console App

```bash
cd console
vercel
```

When prompted:
- Set up and deploy: Yes
- Which scope: Select your account
- Link to existing project: No (first time)
- Project name: immedio-console (or your choice)
- Directory: `./` (current directory)
- Override settings: No

After deployment, add environment variables in Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `API_KEY` and `FIRECRAWL_API_KEY`
4. Redeploy to apply changes

Note the deployment URL (e.g., `https://immedio-console.vercel.app`)

### 2. Build SDK

Before deploying the sample site, build the SDK:

```bash
cd ../sdk
bun run build
```

### 3. Deploy Sample Site

```bash
cd ../sample-site
vercel
```

When prompted:
- Set up and deploy: Yes
- Which scope: Select your account
- Link to existing project: No (first time)
- Project name: immedio-sample-site (or your choice)
- Directory: `./` (current directory)
- Override settings: No

After deployment, add environment variables in Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - `IMMEDIO_API_ENDPOINT`: Your console app URL + `/api` (e.g., `https://immedio-console.vercel.app/api`)
   - `IMMEDIO_API_KEY`: Same value as console's `API_KEY`
   - `IMMEDIO_FLUSH_INTERVAL`: `10000` (or your preferred interval)

### 4. Configure Build Settings

For the sample-site project in Vercel:

1. Go to Project Settings → General
2. Build & Development Settings:
   - **Build Command**: `bun run build`
   - **Output Directory**: `./` (current directory)
   - **Install Command**: `bun install`

## Vercel Configuration Files

Both projects include `vercel.json` for optimal configuration.

## Local Development

### Console App

```bash
cd console
cp .env.example .env
# Edit .env with your values
bun run dev
```

### Sample Site

```bash
cd sample-site
# Set environment variables
export IMMEDIO_API_ENDPOINT="http://localhost:3000/api"
export IMMEDIO_API_KEY="demo-api-key"
export IMMEDIO_FLUSH_INTERVAL="10000"

bun run dev
```

## Database

The console app uses SQLite with Drizzle ORM. On Vercel, the database will be created in the temporary filesystem (`/tmp`). 

**Note**: Data will be lost on redeploys. For production use, consider:
- Vercel Postgres
- PlanetScale
- Supabase
- Any other persistent database

To migrate to a different database, update `console/db/index.ts` and `console/drizzle.config.ts`.

## Security Notes

1. **Never commit `.env` files** - They contain sensitive keys
2. **Use strong API keys** - Generate random, secure keys
3. **Keep API keys in sync** - Sample site and console must use the same key
4. **CORS is open** - Current setup allows all origins (`*`). For production, restrict to your domains.

## Troubleshooting

### Sample Site: SDK not sending data

1. Check browser console for errors
2. Verify `IMMEDIO_API_ENDPOINT` matches your console URL
3. Verify `IMMEDIO_API_KEY` matches console's `API_KEY`
4. Check CORS settings in console API routes

### Console: API authentication errors

1. Verify environment variables are set in Vercel
2. Redeploy after adding/changing env vars
3. Check API_KEY matches between console and sample site

### Build failures

1. Ensure SDK is built before deploying sample site
2. Check build logs in Vercel dashboard
3. Verify all dependencies are in package.json

## Monitoring

- View analytics at: `https://your-console.vercel.app`
- View sample site at: `https://your-sample-site.vercel.app`
- Monitor Vercel logs in dashboard for errors

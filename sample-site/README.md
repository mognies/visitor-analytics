# Sample Site - Visitor Analytics Demo

A demo e-commerce website showcasing the Visitor Analytics SDK integration.

## Features

- 🎨 Modern, responsive design built with Astro
- 📊 Visitor Analytics SDK integrated on all pages
- 🔄 Navigation between pages: Home, Products, Case Studies, About, Blog, Contact
- 📱 Mobile-friendly layout
- ⚡ Static site generation for fast performance

## Local Development

```bash
bun install
bun run dev
```

Open [http://localhost:4321](http://localhost:4321)

## Building for Production

```bash
# Build the SDK first (from project root)
cd ../sdk
bun run build

# Build the sample site
cd ../sample-site
bun run build
```

The built files will be in the `dist/` directory, including the bundled SDK at `dist/analytics-sdk.js`.

## Deploying to Netlify

### 1. Build Settings

In Netlify dashboard, configure:

- **Build command**: `cd sample-site && bun install && bun run build`
- **Publish directory**: `sample-site/dist`
- **Base directory**: (leave empty)

### 2. Environment Variables

Set these in Netlify dashboard (Site settings → Environment variables):

```
PUBLIC_ANALYTICS_API_ENDPOINT=https://your-console-app.vercel.app/api
PUBLIC_ANALYTICS_API_KEY=your-production-api-key
PUBLIC_ANALYTICS_FLUSH_INTERVAL=30000
PUBLIC_ANALYTICS_SDK_URL=/analytics-sdk.js
```

**Important**:
- `PUBLIC_ANALYTICS_SDK_URL` should be `/analytics-sdk.js` (absolute path from site root)
- The SDK file is automatically copied to the dist directory during build
- `PUBLIC_ANALYTICS_API_ENDPOINT` should point to your deployed console app's API

### 3. Deploy

Push to your repository and Netlify will automatically build and deploy.

## Environment Variables Reference

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `PUBLIC_ANALYTICS_API_ENDPOINT` | API endpoint for analytics data | `http://localhost:3000/api` | `https://your-app.vercel.app/api` |
| `PUBLIC_ANALYTICS_API_KEY` | API key for authentication | `demo-api-key` | Your production key |
| `PUBLIC_ANALYTICS_FLUSH_INTERVAL` | How often to send data (ms) | `10000` | `30000` |
| `PUBLIC_ANALYTICS_SDK_URL` | SDK script URL | `../sdk/dist/analytics-sdk.js` | `/analytics-sdk.js` |

## How It Works

1. Each page includes the Visitor Analytics SDK via dynamic import
2. SDK automatically tracks:
   - Page path (e.g., `/products`)
   - Time spent on each page
   - Visitor ID (stored in localStorage)
3. Data is sent to the console backend API
4. View analytics in the console dashboard

## Testing Analytics

1. Start the console backend:
   ```bash
   cd ../console
   turso dev --db-file analytics.db  # In separate terminal
   bun run dev
   ```

2. Start the sample site:
   ```bash
   cd sample-site
   bun run dev
   ```

3. Browse through different pages and spend varying amounts of time

4. Check the analytics dashboard at [http://localhost:3000](http://localhost:3000)

5. You should see:
   - Path analytics showing which pages were visited
   - Duration metrics for each page
   - Visitor and visit counts

## Tech Stack

- **Framework**: Astro 5
- **Runtime**: Bun
- **Analytics**: Visitor Analytics SDK

## License

UNLICENSED

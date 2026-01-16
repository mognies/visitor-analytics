# Visitor Analytics Console

Next.js application for analyzing customer interests based on page visit duration.

## Features

- 📊 Real-time analytics dashboard
- 💾 Turso database (libSQL) with Drizzle ORM
- 📈 Path-based duration tracking
- 🔄 Auto-refresh every 30 seconds
- 🎯 Visitor and visit metrics
- 🔥 Firecrawl integration for website import
- 📄 Page metadata tracking (title, description)

## Getting Started

### Installation

```bash
bun install
```

### Database Setup

This application uses [Turso](https://turso.tech/) (libSQL) for both development and production.

#### 1. Install Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Or with Homebrew
brew install tursodatabase/tap/turso
```

#### 2. Sign up and authenticate

```bash
turso auth signup
```

#### 3. Create a database

```bash
# For production
turso db create visitor-analytics

# Get credentials
turso db show visitor-analytics --url
turso db tokens create visitor-analytics
```

#### 4. For local development

```bash
# Start local Turso instance
turso dev --db-file analytics.db
# This will output: Database URL: http://127.0.0.1:8080
```

Add to `.env.local`:
```env
# For local development with `turso dev`
TURSO_DATABASE_URL=http://127.0.0.1:8080

# For production (get from `turso db show`)
# TURSO_DATABASE_URL=libsql://visitor-analytics-your-name.turso.io
# TURSO_AUTH_TOKEN=your-auth-token-here
```

#### 5. Generate and apply migrations

```bash
bun run db:generate
bun run db:migrate
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the analytics dashboard.

### Environment Variables

Create a `.env.local` file:

```env
# Turso Database Configuration
# For local development with `turso dev`
TURSO_DATABASE_URL=http://127.0.0.1:8080

# For production (get from `turso db show` and `turso db tokens create`)
# TURSO_DATABASE_URL=libsql://visitor-analytics-your-name.turso.io
# TURSO_AUTH_TOKEN=your-auth-token-here

# API Key for SDK authentication
API_KEY=your-secret-api-key

# Firecrawl API Key (get from https://firecrawl.dev)
FIRECRAWL_API_KEY=your-firecrawl-api-key
```

**Note**:
- You need a Firecrawl API key to use the page import feature. Sign up at [https://firecrawl.dev](https://firecrawl.dev) to get your API key.
- For local development, run `turso dev --db-file analytics.db` in a separate terminal before starting the dev server.

## API Endpoints

### POST /api/durations

Receives path duration data from the SDK.

**Authentication**: Bearer token

**Request Body**:
```json
{
  "durations": [
    {
      "path": "/about",
      "duration": 5000,
      "timestamp": 1234567890,
      "visitorId": "visitor-id"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "count": 1
}
```

### GET /api/analytics

Retrieves analytics data for the dashboard.

**Response**:
```json
{
  "pathAnalytics": [
    {
      "path": "/about",
      "totalDuration": 50000,
      "avgDuration": 5000,
      "visitCount": 10,
      "uniqueVisitors": 5
    }
  ],
  "overallStats": {
    "totalVisits": 100,
    "uniqueVisitors": 50,
    "totalDuration": 500000,
    "avgDuration": 5000
  }
}
```

### POST /api/import

Imports pages from a website using Firecrawl.

**Request Body**:
```json
{
  "url": "https://example.com",
  "maxPages": 100
}
```

**Response**:
```json
{
  "success": true,
  "count": 42,
  "changes": 42
}
```

### GET /api/pages

Retrieves imported pages with their analytics.

**Response**:
```json
{
  "pages": [
    {
      "id": 1,
      "url": "https://example.com/about",
      "path": "/about",
      "title": "About Us",
      "description": "Learn more about our company",
      "importedAt": 1234567890,
      "baseUrl": "https://example.com",
      "totalDuration": 50000,
      "avgDuration": 5000,
      "visitCount": 10,
      "uniqueVisitors": 5
    }
  ]
}
```

## Dashboard Metrics

### Overall Stats
- **Total Visits**: Total number of page visits tracked
- **Unique Visitors**: Number of unique visitors
- **Total Duration**: Cumulative time spent across all paths
- **Avg Duration**: Average time spent per visit

### Path Analytics Table
- **Path**: URL path
- **Total Duration**: Total time spent on this path
- **Avg Duration**: Average time per visit
- **Visit Count**: Number of visits to this path
- **Unique Visitors**: Unique visitors to this path

## Database

Using Turso (libSQL) with Drizzle ORM for scalability and edge deployment.

### Schema

```typescript
interface PathDuration {
  id: number;
  path: string;
  duration: number; // milliseconds
  timestamp: number;
  visitorId: string;
  createdAt: number;
}

interface Page {
  id: number;
  url: string;
  path: string;
  title: string | null;
  description: string | null;
  importedAt: number;
  baseUrl: string;
}
```

### Useful Commands

```bash
# Open Drizzle Studio (database GUI)
bun run db:studio

# Generate new migration after schema changes
bun run db:generate
```

## Production Build

```bash
bun run build
bun run start
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Turso (libSQL) with Drizzle ORM
- **Styling**: Tailwind CSS 4
- **Runtime**: Bun
- **Crawler**: Firecrawl

## License

MIT

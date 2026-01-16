# Immedio Analytics Console

Next.js application for analyzing customer interests based on page visit duration.

## Features

- 📊 Real-time analytics dashboard
- 💾 SQLite database with Drizzle ORM
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

Generate and apply database migrations:

```bash
bun run db:generate
```

The SQLite database will be created automatically when you start the server.

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the analytics dashboard.

### Environment Variables

Create a `.env.local` file:

```env
# API Key for SDK authentication
API_KEY=your-secret-api-key

# Firecrawl API Key (get from https://firecrawl.dev)
FIRECRAWL_API_KEY=your-firecrawl-api-key
```

**Note**: You need a Firecrawl API key to use the page import feature. Sign up at [https://firecrawl.dev](https://firecrawl.dev) to get your API key.

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

Using SQLite with Drizzle ORM for simplicity and performance.

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
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS 4
- **Runtime**: Bun
- **Crawler**: Firecrawl

## License

MIT

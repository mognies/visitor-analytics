# Visitor Analytics Visitor Analytics

A customer interest analytics system that tracks visitor engagement based on page visit duration.

## 📁 Project Structure

```
visitor-analytics-visitor-analytics/
├── sdk/              # Browser SDK for tracking page visits
├── console/          # Next.js dashboard for analytics visualization
├── sample-site/      # Demo website with SDK integration
└── DEPLOYMENT.md     # Deployment guide for Vercel
```

## 🚀 Features

- **Path-based tracking**: Track user engagement by page path
- **Visitor analytics**: Analyze individual visitor journeys
- **Real-time dashboard**: Beautiful UI with auto-refresh
- **Page import**: Import website pages using Firecrawl
- **Environment-based config**: Easy deployment with environment variables

## 🛠️ Tech Stack

- **SDK**: TypeScript, IndexedDB (Dexie), Bun
- **Console**: Next.js 16, Tailwind CSS 4, Drizzle ORM, SQLite
- **Sample Site**: Static HTML with SDK integration

## 📦 Installation

```bash
# Install all dependencies
bun install

# Install SDK dependencies
cd sdk
bun install

# Install console dependencies
cd ../console
bun install

# Install sample-site dependencies
cd ../sample-site
bun install
```

## 🏃 Development

### 1. Build SDK

```bash
cd sdk
bun run build
```

### 2. Start Console App

```bash
cd console
cp .env.example .env
# Edit .env with your values
bun run dev
```

Console will run at http://localhost:3000

### 3. Start Sample Site

```bash
cd sample-site
bun run dev
```

Sample site will run at http://localhost:8000

## 🌍 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

### Quick Deploy

1. **Console App**:
   ```bash
   cd console
   vercel
   ```
   Set environment variables: `API_KEY`, `FIRECRAWL_API_KEY`

2. **Sample Site**:
   ```bash
   cd sample-site
   vercel
   ```
   Set environment variables: `ANALYTICS_API_ENDPOINT`, `ANALYTICS_API_KEY`, `ANALYTICS_FLUSH_INTERVAL`

## 🔐 Environment Variables

### Console App (.env)

```bash
API_KEY=your-secure-api-key
FIRECRAWL_API_KEY=your-firecrawl-api-key
```

### Sample Site

```bash
ANALYTICS_API_ENDPOINT=https://your-console.vercel.app/api
ANALYTICS_API_KEY=your-secure-api-key
ANALYTICS_FLUSH_INTERVAL=10000
```

See `.env.example` files for more details.

## 📊 Usage

### SDK Integration

Add to your HTML pages:

```html
<script src="env.js"></script>
<script type="module">
  import { init } from './path/to/sdk/dist/index.js';
  import { config } from './config.js';
  
  await init(config);
</script>
```

### Dashboard Features

- **Analytics Tab**: Overall stats and path-level analytics
- **Visitors Tab**: Individual visitor journeys and behavior
- **Pages Tab**: Import and manage tracked pages

## 🎨 Version Control

This project uses [Jujutsu (jj)](https://github.com/martinvonz/jj) for version control. See CLAUDE.md for workflow details.

## 📝 License

This project is for demonstration purposes.

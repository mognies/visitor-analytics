# Visitor Analytics SDK

Web SDK for tracking visitor path duration.

## Features

- 📊 Automatic path duration tracking
- 🧩 Page block visibility duration tracking
- 💾 Local storage with IndexedDB (via Dexie)
- 📦 Batch data sending to reduce API calls
- ⚡ Lightweight and performant
- 🎯 TypeScript support

## Installation

```bash
bun add @visitor-analytics/sdk
```

## Quick Start

```typescript
import { init } from "@visitor-analytics/sdk";

// Initialize the tracker
await init({
  apiEndpoint: "https://api.yourdomain.com",
  apiKey: "your-api-key",
});
```

## Configuration Options

```typescript
interface TrackerConfig {
  apiEndpoint: string; // Your API endpoint URL
  apiKey: string; // Your API key
  flushInterval?: number; // Interval to flush data in ms (default: 30s)
}
```

```typescript
interface PageBlock {
  id: number | string;
  blockName: string;
  blockSummary: string;
  blockDom: string; // ID or class name
}
```

## How It Works

1. **Visitor Identification**: Each visitor gets a unique ID stored in localStorage
2. **Path Duration Tracking**: Automatically tracks how long visitors spend on each path
3. **Local Storage**: Path durations are stored locally in IndexedDB using Dexie
4. **Batch Sending**: Data is sent to your API in batches to minimize requests
5. **Automatic Cleanup**: Successfully sent data is removed from local storage
6. **Unload Safety**: On page hide/unload, data is sent via `navigator.sendBeacon`

## Data Format

### Path Duration

```typescript
interface PathDuration {
  id?: number;
  path: string;
  duration: number; // in milliseconds
  timestamp: number;
  visitorId: string;
}
```

### Block Duration

```typescript
interface BlockDuration {
  id?: number;
  blockId: number | string;
  path: string;
  duration: number; // in milliseconds
  timestamp: number;
  visitorId: string;
}
```

### API Endpoint

The SDK sends data to `{apiEndpoint}/durations` with the following format:

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

The SDK sends block visibility durations to `{apiEndpoint}/block-durations`:

```json
{
  "durations": [
    {
      "blockId": 123,
      "path": "/about",
      "duration": 2500,
      "timestamp": 1234567890,
      "visitorId": "visitor-id"
    }
  ]
}
```

### Fetching Page Blocks

The SDK fetches blocks from:

```
{apiEndpoint}/page-blocks?path=/your/path
```

The response should be a JSON array of `PageBlock`.

## Advanced Usage

### Force Flush

```typescript
import { flush } from "@visitor-analytics/sdk";

// Force send all pending data
await flush();
```

### Destroy Tracker

```typescript
import { destroy } from "@visitor-analytics/sdk";

// Clean up and destroy tracker
destroy();
```

### Using the Tracker Instance

```typescript
import { AnalyticsTracker } from "@visitor-analytics/sdk";

const tracker = new AnalyticsTracker({
  apiEndpoint: "https://api.yourdomain.com",
  apiKey: "your-api-key",
});

await tracker.init();

// Optional: update page blocks for SPA route changes
tracker.setPageBlocks([
  {
    id: 1,
    blockName: "Hero",
    blockSummary: "Top hero section",
    blockDom: "hero",
  },
]);

// Manually flush data
await tracker.flush();

// Clean up
tracker.destroy();
```

## Browser Support

- Modern browsers with IndexedDB support
- Chrome, Firefox, Safari, Edge (latest versions)

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Type check
bun run typecheck
```

## License

MIT

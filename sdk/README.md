# Immedio Lead Analytics SDK

Web SDK for tracking visitor path duration.

## Features

- 📊 Automatic path duration tracking
- 💾 Local storage with IndexedDB (via Dexie)
- 📦 Batch data sending to reduce API calls
- ⚡ Lightweight and performant
- 🎯 TypeScript support

## Installation

```bash
bun add @immedio/analytics-sdk
```

## Quick Start

```typescript
import { init } from '@immedio/analytics-sdk';

// Initialize the tracker
await init({
  apiEndpoint: 'https://api.yourdomain.com',
  apiKey: 'your-api-key',
});
```

## Configuration Options

```typescript
interface ImmedioConfig {
  apiEndpoint: string;      // Your API endpoint URL
  apiKey: string;           // Your API key
  flushInterval?: number;   // Interval to flush data in ms (default: 30s)
}
```

## How It Works

1. **Visitor Identification**: Each visitor gets a unique ID stored in localStorage
2. **Path Duration Tracking**: Automatically tracks how long visitors spend on each path
3. **Local Storage**: Path durations are stored locally in IndexedDB using Dexie
4. **Batch Sending**: Data is sent to your API in batches to minimize requests
5. **Automatic Cleanup**: Successfully sent data is removed from local storage

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

## Advanced Usage

### Force Flush

```typescript
import { flush } from '@immedio/analytics-sdk';

// Force send all pending data
await flush();
```

### Destroy Tracker

```typescript
import { destroy } from '@immedio/analytics-sdk';

// Clean up and destroy tracker
destroy();
```

### Using the Tracker Instance

```typescript
import { ImmedioTracker } from '@immedio/analytics-sdk';

const tracker = new ImmedioTracker({
  apiEndpoint: 'https://api.yourdomain.com',
  apiKey: 'your-api-key',
});

await tracker.init();

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

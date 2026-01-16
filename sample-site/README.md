# Sample E-Commerce Site

A demo website to showcase the Immedio Analytics SDK integration.

## Pages

- **Home** (`index.html`) - Landing page with hero and features
- **Products** (`products.html`) - Product catalog with 6 items
- **About** (`about.html`) - Company information and team
- **Blog** (`blog.html`) - Blog posts and articles
- **Contact** (`contact.html`) - Contact form and information

## Features

- 🎨 Modern, responsive design
- 📊 Immedio Analytics SDK integrated on all pages
- 🔄 Navigation between pages
- 📱 Mobile-friendly layout
- ⚡ Fast and lightweight

## Running the Sample Site

### Option 1: Using Bun (Recommended)

```bash
cd sample-site
bun --bun run server.js
```

### Option 2: Using Python

```bash
cd sample-site
python3 -m http.server 8000
```

### Option 3: Using npx

```bash
cd sample-site
npx serve
```

Then open http://localhost:8000 (or the appropriate port) in your browser.

## How It Works

1. Each page includes the Immedio Analytics SDK at the bottom
2. SDK automatically tracks:
   - Page path (e.g., `/products.html`)
   - Time spent on each page
   - Visitor ID (stored in localStorage)
3. Data is sent to the console backend at `http://localhost:3000/api/durations`
4. View analytics in the console dashboard

## Testing Analytics

1. Start the console backend:
   ```bash
   cd console
   bun run dev
   ```

2. Start the sample site (see above)

3. Browse through different pages and spend varying amounts of time

4. Check the analytics dashboard at http://localhost:3000

5. You should see:
   - Path analytics showing which pages were visited
   - Duration metrics for each page
   - Visitor and visit counts

## Customization

You can customize the SDK configuration in each HTML file:

```javascript
await init({
  apiEndpoint: 'http://localhost:3000/api',
  apiKey: 'demo-api-key',
  flushInterval: 10000, // Adjust flush interval
});
```

## SDK Integration

The SDK is integrated using ES modules:

```html
<script type="module">
  import { init } from '../sdk/dist/index.js';
  
  await init({
    apiEndpoint: 'http://localhost:3000/api',
    apiKey: 'demo-api-key',
    flushInterval: 10000,
  });
</script>
```

Make sure the SDK is built before running the sample site:

```bash
cd sdk
bun run build
```

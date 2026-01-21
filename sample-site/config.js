// Configuration loaded from environment variables or defaults
export const config = {
  apiEndpoint: window.ANALYTICS_API_ENDPOINT || "http://localhost:3000/api",
  apiKey: window.ANALYTICS_API_KEY || "demo-api-key",
  flushInterval: parseInt(window.ANALYTICS_FLUSH_INTERVAL || "10000", 10),
};

// SDK source URL (can be CDN or local)
export const sdkUrl = window.ANALYTICS_SDK_URL || "analytics-sdk.js";

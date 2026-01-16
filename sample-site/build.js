#!/usr/bin/env bun

import { writeFileSync, mkdirSync, copyFileSync, readdirSync } from "fs";
import { join } from "path";

// Read environment variables
const apiEndpoint =
  process.env.ANALYTICS_API_ENDPOINT || "http://localhost:3000/api";
const apiKey = process.env.ANALYTICS_API_KEY || "demo-api-key";
const flushInterval = process.env.ANALYTICS_FLUSH_INTERVAL || "10000";
const sdkUrl = process.env.ANALYTICS_SDK_URL || "../sdk/dist/analytics-sdk.js";

// Create dist directory
mkdirSync("dist", { recursive: true });

// Generate env.js with actual values
const envContent = `// Auto-generated at build time
window.ANALYTICS_API_ENDPOINT = "${apiEndpoint}";
window.ANALYTICS_API_KEY = "${apiKey}";
window.ANALYTICS_FLUSH_INTERVAL = "${flushInterval}";
window.ANALYTICS_SDK_URL = "${sdkUrl}";
`;

writeFileSync("dist/env.js", envContent);

// Copy HTML files to dist
const htmlFiles = readdirSync(".").filter((file) => file.endsWith(".html"));
htmlFiles.forEach((file) => {
  copyFileSync(file, join("dist", file));
});

// Copy config.js to dist
copyFileSync("config.js", "dist/config.js");

console.log("✅ Build completed:");
console.log(`   Output directory: dist/`);
console.log(`   HTML files: ${htmlFiles.length}`);
console.log(`   API Endpoint: ${apiEndpoint}`);
console.log(`   API Key: ${apiKey.substring(0, 4)}***`);
console.log(`   Flush Interval: ${flushInterval}ms`);
console.log(`   SDK URL: ${sdkUrl}`);

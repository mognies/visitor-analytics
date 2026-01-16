#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "fs";

// Read environment variables
const apiEndpoint = process.env.IMMEDIO_API_ENDPOINT || "http://localhost:3000/api";
const apiKey = process.env.IMMEDIO_API_KEY || "demo-api-key";
const flushInterval = process.env.IMMEDIO_FLUSH_INTERVAL || "10000";

// Generate env.js with actual values
const envContent = `// Auto-generated at build time
window.IMMEDIO_API_ENDPOINT = "${apiEndpoint}";
window.IMMEDIO_API_KEY = "${apiKey}";
window.IMMEDIO_FLUSH_INTERVAL = "${flushInterval}";
`;

writeFileSync("env.js", envContent);

console.log("✅ Environment variables configured:");
console.log(`   API Endpoint: ${apiEndpoint}`);
console.log(`   API Key: ${apiKey.substring(0, 4)}***`);
console.log(`   Flush Interval: ${flushInterval}ms`);

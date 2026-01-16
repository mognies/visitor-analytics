#!/usr/bin/env bun

const server = Bun.serve({
  port: 8000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;

    // Default to index.html
    if (filePath === "/") {
      filePath = "/index.html";
    }

    // Serve files from current directory and parent (for SDK)
    let file;
    try {
      if (filePath.startsWith("/sdk/")) {
        file = Bun.file(".." + filePath);
      } else {
        file = Bun.file("." + filePath);
      }

      if (await file.exists()) {
        return new Response(file);
      }
    } catch (error) {
      console.error(`Error serving ${filePath}:`, error);
    }

    // 404
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Sample site running at http://localhost:${server.port}`);
console.log(`📊 Make sure the console backend is running at http://localhost:3000`);
console.log(`\nPages:`);
console.log(`  http://localhost:${server.port}/index.html`);
console.log(`  http://localhost:${server.port}/products.html`);
console.log(`  http://localhost:${server.port}/about.html`);
console.log(`  http://localhost:${server.port}/blog.html`);
console.log(`  http://localhost:${server.port}/contact.html`);

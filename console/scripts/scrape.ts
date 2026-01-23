#!/usr/bin/env bun

/**
 * Local scrape script
 *
 * Usage:
 *   bun run scripts/scrape.ts <url> [maxPages]
 *
 * Example:
 *   bun run scripts/scrape.ts https://example.com 50
 */

import { FirecrawlClient } from "@mendable/firecrawl-js";
import * as dotenv from "dotenv";

import { db } from "../db";
import { pages } from "../db/schema";

// Load environment variables
dotenv.config({ path: ".env.local" });

interface CrawledPage {
  url: string;
  path: string;
  title: string;
  summary: string;
}

async function scrape(url: string, maxPages: number = 100) {
  console.log(`Starting scrape for: ${url}`);
  console.log(`Max pages: ${maxPages}`);

  // Validate URL
  let baseUrl: URL;
  try {
    baseUrl = new URL(url);
  } catch (e) {
    console.error("Invalid URL:", e);
    process.exit(1);
  }

  // Check for Firecrawl API key
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error("FIRECRAWL_API_KEY not found in environment variables");
    console.error("Please set FIRECRAWL_API_KEY in .env.local");
    process.exit(1);
  }

  // Initialize Firecrawl
  const app = new FirecrawlClient({ apiKey });

  try {
    console.log("\nStarting crawl (this will wait for completion)...");

    // Use app.crawl() which blocks until completion
    const crawlResult = await app.crawl(url, {
      limit: maxPages,
      scrapeOptions: {
        formats: ["summary", "html"],
      },
    });

    console.log(
      `\nCrawl completed! Total pages: ${crawlResult.data?.length || 0}`,
    );

    // Process the data
    if (crawlResult.data && crawlResult.data.length > 0) {
      console.log(`Processing ${crawlResult.data.length} pages...`);
      const crawledPages: CrawledPage[] = [];

      for (const page of crawlResult.data) {
        console.log(`Processing page ${page.metadata?.url}`);
        const pageUrl = page.metadata?.url || "";
        if (!pageUrl) continue;

        try {
          const parsedUrl = new URL(pageUrl);
          const pageRecord = {
            url: pageUrl,
            path: parsedUrl.pathname,
            title: (page.metadata?.title as string) || "",
            summary: page.summary ?? "",
          };
          crawledPages.push(pageRecord);

          await db
            .insert(pages)
            .values({
              ...pageRecord,
              baseUrl: baseUrl.toString(),
            })
            .onConflictDoUpdate({
              target: pages.url,
              set: {
                title: pages.title,
                summary: pages.summary,
                importedAt: Date.now(),
              },
            });
        } catch (e) {
          console.error(e);
          console.error(`Invalid URL in crawl results: ${pageUrl}`);
        }
      }
    }

    console.log("\n✓ Scrape completed successfully!\n");
  } catch (error) {
    console.error("\nError during scrape:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
    }

    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: bun run scripts/scrape.ts <url> [maxPages]");
  console.error("Example: bun run scripts/scrape.ts https://example.com 50");
  process.exit(1);
}

const url = args[0];
const maxPages = args[1] ? parseInt(args[1], 10) : 100;

if (isNaN(maxPages) || maxPages <= 0) {
  console.error("maxPages must be a positive number");
  process.exit(1);
}

// Run the scrape
scrape(url, maxPages);

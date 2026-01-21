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

import { google } from "@ai-sdk/google";
import { FirecrawlClient } from "@mendable/firecrawl-js";
import { generateText, Output } from "ai";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import z from "zod";

import { db } from "../db";
import { pageBlocks, pages } from "../db/schema";

// Load environment variables
dotenv.config({ path: ".env.local" });

interface CrawledPage {
  url: string;
  path: string;
  title: string;
  summary: string;
}

/**
 * Clean HTML by removing unnecessary tags and content to reduce token count
 */
function cleanHtml(html: string): string {
  return (
    html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove style tags and their content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      // Remove noscript tags
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
      // Remove img tags (not needed for block analysis)
      .replace(/<img\b[^>]*>/gi, "")
      // Remove svg tags and their content
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Remove head section (title already captured in metadata)
      .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "")
      // Remove inline style attributes
      .replace(/\sstyle="[^"]*"/gi, "")
      // Remove data-* attributes
      .replace(/\sdata-[a-z-]+="[^"]*"/gi, "")
      // Remove aria-* attributes (but keep IDs and classes for blockDOM)
      .replace(/\saria-[a-z-]+="[^"]*"/gi, "")
      // Remove role attributes
      .replace(/\srole="[^"]*"/gi, "")
      // Remove title attributes
      .replace(/\stitle="[^"]*"/gi, "")
      // Remove href attributes (URLs not needed for block analysis)
      .replace(/\shref="[^"]*"/gi, "")
      // Remove src attributes (URLs not needed for block analysis)
      .replace(/\ssrc="[^"]*"/gi, "")
      // Remove srcset attributes
      .replace(/\ssrcset="[^"]*"/gi, "")
      // Remove target, rel attributes
      .replace(/\s(target|rel)="[^"]*"/gi, "")
      // Remove whitespace between tags
      .replace(/>\s+</g, "><")
      // Compress remaining whitespace (including within text content)
      .replace(/\s+/g, " ")
      .trim()
      // Remove empty tags (run multiple times to handle nested empty tags)
      .replace(/<(\w+)\b[^>]*>\s*<\/\1>/gi, "")
      .replace(/<(\w+)\b[^>]*>\s*<\/\1>/gi, "")
      .replace(/<(\w+)\b[^>]*>\s*<\/\1>/gi, "")
  );
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

          const storedPage = await db.query.pages.findFirst({
            where: eq(pages.url, pageUrl),
          });

          console.log(`Analysing page ${page.metadata?.url}`);
          // Clean HTML to reduce token count
          const cleanedHtml = cleanHtml(page.html || "");
          console.log(
            `Original HTML length: ${page.html?.length || 0}, Cleaned: ${cleanedHtml.length}`,
          );
          console.log(cleanedHtml);

          // Generate analysis using Gemini
          const { output: blocks } = await generateText({
            model: google("gemini-3-flash-preview"),
            prompt: `以下のHTMLを、人間が自然にひとまとまりと認識するセクション/ブロック単位に分解し、日本語で出力してください。${cleanedHtml}`,
            output: Output.object({
              schema: z.array(
                z.object({
                  blockName: z.string(),
                  blockSummary: z.string(),
                  blockDOM: z.string().describe("ID or class name"),
                }),
              ),
            }),
          });
          console.log(blocks);

          if (storedPage && blocks.length > 0) {
            await db
              .delete(pageBlocks)
              .where(eq(pageBlocks.pageId, storedPage.id));

            await db.insert(pageBlocks).values(
              blocks.map((block) => ({
                pageId: storedPage.id,
                blockName: block.blockName,
                blockSummary: block.blockSummary,
                blockDom: block.blockDOM,
              })),
            );
          }
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

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pages } from "@/db/schema";
import FirecrawlApp from "@mendable/firecrawl-js";

interface CrawledPage {
  url: string;
  path: string;
  title: string;
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, maxPages = 100 } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let baseUrl: URL;
    try {
      baseUrl = new URL(url);
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Check for Firecrawl API key
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FIRECRAWL_API_KEY not configured" },
        { status: 500 },
      );
    }

    // Initialize Firecrawl
    const app = new FirecrawlApp({ apiKey });

    // Crawl the website
    const crawlJob = await app.crawl(url, {
      limit: maxPages,
      crawlEntireDomain: true,
      scrapeOptions: {
        formats: ["summary"],
      },
    });

    if (crawlJob.status === "failed") {
      throw new Error("Failed to crawl website");
    }

    // Process crawled pages
    const crawledPages: CrawledPage[] = [];

    if (crawlJob.data) {
      for (const page of crawlJob.data) {
        const pageUrl = page.metadata?.url || "";
        if (!pageUrl) continue;

        try {
          const parsedUrl = new URL(pageUrl);
          crawledPages.push({
            url: pageUrl,
            path: parsedUrl.pathname,
            title: (page.metadata?.title as string) || "",
            summary: page.summary ?? "",
          });
        } catch (e) {
          console.error(`Invalid URL in crawl results: ${pageUrl}`);
        }
      }
    }

    if (crawledPages.length === 0) {
      return NextResponse.json({ error: "No pages found" }, { status: 400 });
    }

    // Insert pages into database
    await db
      .insert(pages)
      .values(
        crawledPages.map((page) => ({
          url: page.url,
          path: page.path,
          title: page.title,
          summary: page.summary,
          baseUrl: baseUrl.origin,
        })),
      )
      .onConflictDoUpdate({
        target: pages.url,
        set: {
          title: pages.title,
          summary: pages.summary,
          importedAt: Date.now(),
        },
      });

    return NextResponse.json({
      success: true,
      count: crawledPages.length,
    });
  } catch (error) {
    console.error("Error importing pages:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crawlJobs } from "@/db/schema";
import { FirecrawlClient } from "@mendable/firecrawl-js";

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

    // Initialize Firecrawl (v2)
    const app = new FirecrawlClient({ apiKey });

    // Get the webhook URL (must be publicly accessible)
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://visitor-analytics.vercel.app"}/api/import/webhook`;

    // Start async crawl with webhook
    const crawlResponse = await app.startCrawl(url, {
      limit: maxPages,
      crawlEntireDomain: true,
      scrapeOptions: {
        formats: ["summary", "html"],
      },
      webhook: webhookUrl,
    });

    if (!crawlResponse.id) {
      throw new Error("Failed to start crawl job");
    }

    // Save job to database
    await db.insert(crawlJobs).values({
      id: crawlResponse.id,
      baseUrl: baseUrl.origin,
      status: "pending",
      maxPages,
    });

    return NextResponse.json({
      success: true,
      jobId: crawlResponse.id,
      message:
        "Crawl job started. Data will be imported automatically when complete.",
    });
  } catch (error) {
    console.error("Error starting crawl job:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

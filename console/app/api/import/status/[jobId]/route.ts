import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crawlJobs, pages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FirecrawlClient } from "@mendable/firecrawl-js";

interface CrawledPage {
  url: string;
  path: string;
  title: string;
  summary: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    // Check for Firecrawl API key
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FIRECRAWL_API_KEY not configured" },
        { status: 500 },
      );
    }

    // Get job from database
    const job = await db.query.crawlJobs.findFirst({
      where: eq(crawlJobs.id, jobId),
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Initialize Firecrawl
    const app = new FirecrawlClient({ apiKey });

    // Check crawl status
    const crawlStatus = await app.getCrawlStatus(jobId);

    // Update job status in database
    await db
      .update(crawlJobs)
      .set({
        status: crawlStatus.status,
        completed: crawlStatus.completed,
        total: crawlStatus.total,
      })
      .where(eq(crawlJobs.id, jobId));

    // If completed, import the data
    if (crawlStatus.status === "completed" && crawlStatus.data) {
      const crawledPages: CrawledPage[] = [];

      for (const page of crawlStatus.data) {
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

      if (crawledPages.length > 0) {
        // Insert pages into database
        await db
          .insert(pages)
          .values(
            crawledPages.map((page) => ({
              url: page.url,
              path: page.path,
              title: page.title,
              summary: page.summary,
              baseUrl: job.baseUrl,
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

        // Update job as completed
        await db
          .update(crawlJobs)
          .set({
            completedAt: Date.now(),
          })
          .where(eq(crawlJobs.id, jobId));

        console.log(`Imported ${crawledPages.length} pages for job ${jobId}`);
      }

      return NextResponse.json({
        success: true,
        status: crawlStatus.status,
        completed: crawlStatus.completed,
        total: crawlStatus.total,
        imported: crawledPages.length,
      });
    }

    // Still in progress
    return NextResponse.json({
      success: true,
      status: crawlStatus.status,
      completed: crawlStatus.completed,
      total: crawlStatus.total,
    });
  } catch (error) {
    console.error("Error checking crawl status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

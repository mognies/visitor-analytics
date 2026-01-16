import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crawlJobs, pages } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CrawledPage {
  url: string;
  path: string;
  title: string;
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { success, id, status, data } = body;

    console.log("Webhook received:", { success, id, status, dataLength: data?.length });

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    // Update job status
    await db
      .update(crawlJobs)
      .set({
        status: status || (success ? "completed" : "failed"),
        completedAt: Date.now(),
      })
      .where(eq(crawlJobs.id, id));

    // If crawl failed or no data, return early
    if (!success || !data || data.length === 0) {
      console.log("Crawl job failed or no data");
      return NextResponse.json({ success: true });
    }

    // Get job details to get the base URL
    const job = await db.query.crawlJobs.findFirst({
      where: eq(crawlJobs.id, id),
    });

    if (!job) {
      console.error("Job not found:", id);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Process crawled pages
    const crawledPages: CrawledPage[] = [];

    for (const page of data) {
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

      console.log(`Imported ${crawledPages.length} pages for job ${id}`);
    }

    return NextResponse.json({ success: true, imported: crawledPages.length });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { pages, pathDurations } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  try {
    // Get all pages with their analytics
    const pagesWithAnalytics = await db
      .select({
        id: pages.id,
        url: pages.url,
        path: pages.path,
        title: pages.title,
        description: pages.description,
        importedAt: pages.importedAt,
        baseUrl: pages.baseUrl,
        totalDuration: sql<number>`COALESCE(SUM(${pathDurations.duration}), 0)`.as(
          "total_duration"
        ),
        avgDuration: sql<number>`COALESCE(AVG(${pathDurations.duration}), 0)`.as(
          "avg_duration"
        ),
        visitCount: sql<number>`COUNT(${pathDurations.id})`.as("visit_count"),
        uniqueVisitors: sql<number>`COUNT(DISTINCT ${pathDurations.visitorId})`.as(
          "unique_visitors"
        ),
      })
      .from(pages)
      .leftJoin(pathDurations, eq(pages.path, pathDurations.path))
      .groupBy(pages.id)
      .orderBy(sql`total_duration DESC`);

    return NextResponse.json({ pages: pagesWithAnalytics });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

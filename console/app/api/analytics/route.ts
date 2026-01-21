import { NextResponse } from "next/server";
import { db } from "@/db";
import { pathDurations } from "@/db/schema";
import { sql } from "drizzle-orm";

// Dynamically import and initialize SDK
import("https://earnest-biscochitos-1a9469.netlify.app/analytics-sdk.js").then(
  ({ init }) => {
    init({
      apiEndpoint: "https://visitor-analytics.vercel.app/api",
      apiKey: "demo-api-key",
    });
  },
);

export async function GET() {
  try {
    // Get path analytics grouped by path
    const pathAnalytics = await db
      .select({
        path: pathDurations.path,
        totalDuration: sql<number>`SUM(${pathDurations.duration})`.as(
          "total_duration",
        ),
        avgDuration: sql<number>`AVG(${pathDurations.duration})`.as(
          "avg_duration",
        ),
        visitCount: sql<number>`COUNT(*)`.as("visit_count"),
        uniqueVisitors:
          sql<number>`COUNT(DISTINCT ${pathDurations.visitorId})`.as(
            "unique_visitors",
          ),
      })
      .from(pathDurations)
      .groupBy(pathDurations.path)
      .orderBy(sql`total_duration DESC`);

    // Get overall stats
    const overallStats = await db
      .select({
        totalVisits: sql<number>`COUNT(*)`.as("total_visits"),
        uniqueVisitors:
          sql<number>`COUNT(DISTINCT ${pathDurations.visitorId})`.as(
            "unique_visitors",
          ),
        totalDuration: sql<number>`SUM(${pathDurations.duration})`.as(
          "total_duration",
        ),
        avgDuration: sql<number>`AVG(${pathDurations.duration})`.as(
          "avg_duration",
        ),
      })
      .from(pathDurations)
      .then((rows) => rows[0]);

    return NextResponse.json({
      pathAnalytics,
      overallStats,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

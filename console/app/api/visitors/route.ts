import { NextResponse } from "next/server";
import { db } from "@/db";
import { pathDurations } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get visitor statistics
    const visitorStats = db
      .select({
        visitorId: pathDurations.visitorId,
        totalDuration: sql<number>`SUM(${pathDurations.duration})`.as(
          "total_duration"
        ),
        visitCount: sql<number>`COUNT(*)`.as("visit_count"),
        uniquePaths: sql<number>`COUNT(DISTINCT ${pathDurations.path})`.as(
          "unique_paths"
        ),
        firstVisit: sql<number>`MIN(${pathDurations.timestamp})`.as(
          "first_visit"
        ),
        lastVisit: sql<number>`MAX(${pathDurations.timestamp})`.as(
          "last_visit"
        ),
      })
      .from(pathDurations)
      .groupBy(pathDurations.visitorId)
      .orderBy(sql`total_duration DESC`)
      .all();

    // Get detailed path data for each visitor
    const visitorDetails = visitorStats.map((visitor) => {
      const paths = db
        .select({
          path: pathDurations.path,
          duration: pathDurations.duration,
          timestamp: pathDurations.timestamp,
        })
        .from(pathDurations)
        .where(sql`${pathDurations.visitorId} = ${visitor.visitorId}`)
        .orderBy(sql`${pathDurations.timestamp} DESC`)
        .all();

      return {
        ...visitor,
        paths,
      };
    });

    return NextResponse.json({
      visitors: visitorDetails,
      totalVisitors: visitorStats.length,
    });
  } catch (error) {
    console.error("Error fetching visitor analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

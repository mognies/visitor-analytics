import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { db } from "@/db";
import { pathDurations } from "@/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { visitorId } = await req.json();

    // Get visitor data
    let analyticsData;

    if (visitorId) {
      // Specific visitor analysis
      const visitor = db
        .select({
          visitorId: pathDurations.visitorId,
          totalDuration: sql<number>`SUM(${pathDurations.duration})`.as("total_duration"),
          visitCount: sql<number>`COUNT(*)`.as("visit_count"),
          uniquePaths: sql<number>`COUNT(DISTINCT ${pathDurations.path})`.as("unique_paths"),
        })
        .from(pathDurations)
        .where(sql`${pathDurations.visitorId} = ${visitorId}`)
        .get();

      const paths = db
        .select({
          path: pathDurations.path,
          duration: pathDurations.duration,
          timestamp: pathDurations.timestamp,
        })
        .from(pathDurations)
        .where(sql`${pathDurations.visitorId} = ${visitorId}`)
        .orderBy(sql`${pathDurations.timestamp} ASC`)
        .all();

      analyticsData = { visitor, paths };
    } else {
      // Overall analytics
      const pathAnalytics = db
        .select({
          path: pathDurations.path,
          totalDuration: sql<number>`SUM(${pathDurations.duration})`.as("total_duration"),
          avgDuration: sql<number>`AVG(${pathDurations.duration})`.as("avg_duration"),
          visitCount: sql<number>`COUNT(*)`.as("visit_count"),
          uniqueVisitors: sql<number>`COUNT(DISTINCT ${pathDurations.visitorId})`.as("unique_visitors"),
        })
        .from(pathDurations)
        .groupBy(pathDurations.path)
        .orderBy(sql`total_duration DESC`)
        .limit(20)
        .all();

      const overallStats = db
        .select({
          totalVisits: sql<number>`COUNT(*)`.as("total_visits"),
          uniqueVisitors: sql<number>`COUNT(DISTINCT ${pathDurations.visitorId})`.as("unique_visitors"),
          totalDuration: sql<number>`SUM(${pathDurations.duration})`.as("total_duration"),
          avgDuration: sql<number>`AVG(${pathDurations.duration})`.as("avg_duration"),
        })
        .from(pathDurations)
        .get();

      analyticsData = { pathAnalytics, overallStats };
    }

    // Create AI prompt based on data type
    const prompt = visitorId
      ? createVisitorAnalysisPrompt(analyticsData)
      : createOverallAnalysisPrompt(analyticsData);

    // Stream AI response
    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content:
            "You are an expert web analytics consultant. Analyze visitor behavior data and provide actionable insights. Be concise, specific, and focus on practical recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("AI insights error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate insights" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

function createVisitorAnalysisPrompt(data: any): string {
  const { visitor, paths } = data;

  if (!visitor || !paths || paths.length === 0) {
    return "No visitor data available for analysis.";
  }

  const pathSequence = paths
    .map((p: any, i: number) => {
      const duration = Math.floor(p.duration / 1000);
      return `${i + 1}. ${p.path} (${duration}s)`;
    })
    .join("\n");

  return `Analyze this visitor's journey:

Visitor Stats:
- Total time on site: ${Math.floor(visitor.totalDuration / 1000)}s
- Pages visited: ${visitor.visitCount}
- Unique pages: ${visitor.uniquePaths}

Page sequence (in chronological order):
${pathSequence}

Provide:
1. Journey analysis: What does their browsing pattern suggest about their intent?
2. Engagement quality: Are they deeply engaged or just browsing?
3. Key insights: What pages captured their attention most?
4. Recommendations: What should we optimize based on this behavior?

Keep it concise and actionable.`;
}

function createOverallAnalysisPrompt(data: any): string {
  const { pathAnalytics, overallStats } = data;

  if (!pathAnalytics || pathAnalytics.length === 0) {
    return "No analytics data available for analysis.";
  }

  const topPaths = pathAnalytics
    .slice(0, 10)
    .map((p: any, i: number) => {
      const totalMin = Math.floor(p.totalDuration / 60000);
      const avgSec = Math.floor(p.avgDuration / 1000);
      return `${i + 1}. ${p.path} - ${p.visitCount} visits, ${avgSec}s avg, ${p.uniqueVisitors} unique visitors`;
    })
    .join("\n");

  const totalMin = Math.floor(overallStats.totalDuration / 60000);
  const avgSec = Math.floor(overallStats.avgDuration / 1000);

  return `Analyze this website's visitor analytics:

Overall Stats:
- Total visits: ${overallStats.totalVisits}
- Unique visitors: ${overallStats.uniqueVisitors}
- Total time: ${totalMin} minutes
- Average time per page: ${avgSec} seconds

Top pages by total engagement:
${topPaths}

Provide:
1. Content performance: Which pages are performing best and why?
2. User engagement patterns: What does the data say about visitor behavior?
3. Optimization opportunities: What should be improved?
4. Recommended actions: Specific next steps to improve metrics.

Keep it concise and data-driven.`;
}

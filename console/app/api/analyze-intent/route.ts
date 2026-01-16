import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { inArray } from "drizzle-orm";

interface VisitorPath {
  path: string;
  duration: number;
  timestamp: number;
}

interface AnalyzeIntentRequest {
  visitorId: string;
  paths: VisitorPath[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeIntentRequest = await request.json();
    const { visitorId, paths } = body;

    if (!visitorId || !paths || paths.length === 0) {
      return NextResponse.json(
        { error: "visitorId and paths are required" },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Get unique paths
    const uniquePaths = [...new Set(paths.map((p) => p.path))];

    // Fetch page information from database
    const pageInfos = await db
      .select({
        path: pages.path,
        title: pages.title,
        summary: pages.summary,
      })
      .from(pages)
      .where(inArray(pages.path, uniquePaths));

    // Create a map of path -> page info
    const pageInfoMap = new Map(
      pageInfos.map((p) => [p.path, { title: p.title, summary: p.summary }])
    );

    // Group paths by date and calculate total duration per page
    const pathsByDate: Record<string, Record<string, number>> = {};
    const pathTotals: Record<string, number> = {};

    for (const path of paths) {
      const date = new Date(path.timestamp).toISOString().split("T")[0];
      if (!pathsByDate[date]) {
        pathsByDate[date] = {};
      }
      if (!pathsByDate[date][path.path]) {
        pathsByDate[date][path.path] = 0;
      }
      pathsByDate[date][path.path] += path.duration;

      if (!pathTotals[path.path]) {
        pathTotals[path.path] = 0;
      }
      pathTotals[path.path] += path.duration;
    }

    // Format duration
    const formatDuration = (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      }
      return `${seconds}s`;
    };

    // Build prompt
    let prompt = `Analyze the following visitor's behavior and determine their intent based on their browsing patterns.

Visitor ID: ${visitorId}

## Visit History by Date:

`;

    // Add date-based visit history
    for (const [date, pathDurations] of Object.entries(pathsByDate)) {
      prompt += `### ${date}\n`;
      for (const [path, duration] of Object.entries(pathDurations)) {
        const pageInfo = pageInfoMap.get(path);
        prompt += `- **${path}** (${formatDuration(duration)})\n`;
        if (pageInfo?.title) {
          prompt += `  Title: ${pageInfo.title}\n`;
        }
        if (pageInfo?.summary) {
          prompt += `  Summary: ${pageInfo.summary}\n`;
        }
      }
      prompt += "\n";
    }

    prompt += `## Total Time per Page:

`;

    // Add total time per page
    for (const [path, duration] of Object.entries(pathTotals)) {
      const pageInfo = pageInfoMap.get(path);
      prompt += `- **${path}**: ${formatDuration(duration)}\n`;
      if (pageInfo?.title) {
        prompt += `  Title: ${pageInfo.title}\n`;
      }
    }

    prompt += `

Based on this data, please:
1. Identify the visitor's primary intent or goal
2. Analyze their journey pattern (e.g., research, comparison, ready to purchase, learning)
3. Highlight key interests based on pages visited and time spent
4. Suggest what actions or content might be most relevant to them

Provide a concise analysis (2-3 paragraphs) that would help understand this visitor's intent.`;

    // Generate analysis using Gemini
    const { text } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      prompt,
    });

    return NextResponse.json({
      success: true,
      analysis: text,
      visitorId,
    });
  } catch (error) {
    console.error("Error analyzing intent:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze intent",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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
        { status: 400 },
      );
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" },
        { status: 500 },
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
      pageInfos.map((p) => [p.path, { title: p.title, summary: p.summary }]),
    );

    // Group paths by date
    const visitsByDate: Record<
      string,
      { path: string; duration: number; timestamp: number; index: number }[]
    > = {};

    for (const [index, path] of paths.entries()) {
      const date = new Date(path.timestamp).toISOString().split("T")[0];
      if (!visitsByDate[date]) {
        visitsByDate[date] = [];
      }
      visitsByDate[date].push({
        path: path.path,
        duration: path.duration,
        timestamp: path.timestamp,
        index,
      });
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
    let prompt = `以下の訪問者の行動を分析し、閲覧パターンに基づいて訪問意図を判断してください。

## 日付別の訪問履歴:

`;

    // Add date-based visit history
    const sortedDates = Object.keys(visitsByDate).sort();
    for (const date of sortedDates) {
      const visits = visitsByDate[date]
        .slice()
        .sort((a, b) => a.timestamp - b.timestamp || a.index - b.index);
      prompt += `### ${date}\n`;
      for (const visit of visits) {
        const path = visit.path;
        const duration = visit.duration;
        const pageInfo = pageInfoMap.get(path);
        prompt += `- **${path}** (${formatDuration(duration)})\n`;
        if (pageInfo?.title) {
          prompt += `  タイトル: ${pageInfo.title}\n`;
        }
        if (pageInfo?.summary) {
          prompt += `  概要: ${pageInfo.summary}\n`;
        }
      }
      prompt += "\n";
    }

    prompt += `

このデータに基づいて、以下の点を分析してください:
1. 訪問者の主な目的や意図を特定する
2. 訪問パターンを分析する（例: 情報収集、比較検討、購入意欲、学習目的など）
3. 訪問ページと滞在時間から主な関心事を明らかにする
4. この訪問者に最も関連性の高いアクションやコンテンツを提案する

この訪問者の意図を理解するのに役立つ、簡潔な分析を日本語で2-3段落で提供してください。
返事は不要で、分析結果のみを平文で返してください。`;

    console.log(prompt);
    // Generate analysis using Gemini
    const { text } = await generateText({
      model: google("gemini-3-flash-preview"),
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
      { status: 500 },
    );
  }
}

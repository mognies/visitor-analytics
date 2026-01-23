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

interface GenerateGreetingRequest {
  visitorId: string;
  paths: VisitorPath[];
  model?: string;
  intentAnalysis?: string;
}

interface DetailedVisitorData {
  pageInfoMap: Map<string, { title: string | null; summary: string | null }>;
  visitsByDate: Record<
    string,
    { path: string; duration: number; timestamp: number; index: number }[]
  >;
}

async function fetchDetailedVisitorData(
  visitorId: string,
  paths: VisitorPath[],
): Promise<DetailedVisitorData> {
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

  return {
    pageInfoMap,
    visitsByDate,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateGreetingRequest = await request.json();
    const { visitorId, paths, model = "gemini-2.5-flash", intentAnalysis } = body;

    if (!visitorId || !paths || paths.length === 0) {
      return NextResponse.json({ error: "visitorId and paths are required" }, { status: 400 });
    }

    // Validate model
    const validModels = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3-flash-preview"];
    if (!validModels.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model. Must be one of: ${validModels.join(", ")}` },
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

    // Fetch detailed visitor data only if intentAnalysis is not provided
    let detailedData: DetailedVisitorData | null = null;
    if (!intentAnalysis) {
      detailedData = await fetchDetailedVisitorData(visitorId, paths);
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
    let prompt = "";

    // Add intent analysis if available
    if (intentAnalysis) {
      prompt = `以下の訪問者の意図分析をもとに、この訪問者に対する1行の接客文章を生成してください。

## AI Intent Analysis:

${intentAnalysis}

このデータをもとに、以下の要件を満たす接客文章を生成してください:`;
    } else if (detailedData) {
      const { pageInfoMap, visitsByDate } = detailedData;

      prompt = `以下の訪問者の行動履歴をもとに、この訪問者に対する1行の接客文章を生成してください。

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

このデータをもとに、以下の要件を満たす接客文章を生成してください:`;
    } else {
      return NextResponse.json(
        { error: "Either intentAnalysis or visitor data is required" },
        { status: 400 },
      );
    }

    prompt += `
1. 訪問者の関心事やニーズを的確に捉えた内容にする
2. 具体的なページやコンテンツに言及して親近感を演出する
3. 自然で温かみのある日本語表現を使う
4. 1行（60文字以内）で完結させる
5. 訪問者の次のアクションを促すような内容にする
6. AI Botの立場として声をかける

セカンドアプローチとしての、接客文章のみを返してください。余計な説明や挨拶は不要です。`;

    console.log(prompt);
    // Generate greeting using Gemini
    const { text } = await generateText({
      model: google(model),
      prompt,
    });

    return NextResponse.json({
      success: true,
      greeting: text.trim(),
      visitorId,
      model,
    });
  } catch (error) {
    console.error("Error generating greeting:", error);
    return NextResponse.json(
      {
        error: "Failed to generate greeting",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

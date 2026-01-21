import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db";
import { blockDurations, pageBlocks, pages } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

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
  blockInfoMap: Map<
    string,
    {
      blockName: string | null;
      blockSummary: string | null;
      blockDom: string | null;
    }
  >;
  visitsByDate: Record<
    string,
    { path: string; duration: number; timestamp: number; index: number }[]
  >;
  blockDurationsByDate: Record<string, Record<string, Record<string, number>>>;
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

  const blockDurationRows = await db
    .select({
      blockId: blockDurations.blockId,
      path: blockDurations.path,
      duration: blockDurations.duration,
      timestamp: blockDurations.timestamp,
    })
    .from(blockDurations)
    .where(
      and(
        eq(blockDurations.visitorId, visitorId),
        inArray(blockDurations.path, uniquePaths),
      ),
    );

  const blockIds = [...new Set(blockDurationRows.map((row) => row.blockId))];
  const numericBlockIds = blockIds
    .map((blockId) => Number(blockId))
    .filter((blockId) => Number.isFinite(blockId));

  const blockInfoRows =
    numericBlockIds.length > 0
      ? await db
          .select({
            id: pageBlocks.id,
            blockName: pageBlocks.blockName,
            blockSummary: pageBlocks.blockSummary,
            blockDom: pageBlocks.blockDom,
          })
          .from(pageBlocks)
          .where(inArray(pageBlocks.id, numericBlockIds))
      : [];

  const blockInfoMap = new Map(
    blockInfoRows.map((block) => [
      String(block.id),
      {
        blockName: block.blockName,
        blockSummary: block.blockSummary,
        blockDom: block.blockDom,
      },
    ]),
  );

  // Create a map of path -> page info
  const pageInfoMap = new Map(
    pageInfos.map((p) => [p.path, { title: p.title, summary: p.summary }]),
  );

  // Group paths by date and calculate total duration per page
  const visitsByDate: Record<
    string,
    { path: string; duration: number; timestamp: number; index: number }[]
  > = {};
  const blockDurationsByDate: Record<
    string,
    Record<string, Record<string, number>>
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

  for (const block of blockDurationRows) {
    const date = new Date(block.timestamp).toISOString().split("T")[0];
    if (!blockDurationsByDate[date]) {
      blockDurationsByDate[date] = {};
    }
    if (!blockDurationsByDate[date][block.path]) {
      blockDurationsByDate[date][block.path] = {};
    }
    if (!blockDurationsByDate[date][block.path][block.blockId]) {
      blockDurationsByDate[date][block.path][block.blockId] = 0;
    }
    blockDurationsByDate[date][block.path][block.blockId] += block.duration;
  }

  return {
    pageInfoMap,
    blockInfoMap,
    visitsByDate,
    blockDurationsByDate,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateGreetingRequest = await request.json();
    const {
      visitorId,
      paths,
      model = "gemini-2.5-flash",
      intentAnalysis,
    } = body;

    if (!visitorId || !paths || paths.length === 0) {
      return NextResponse.json(
        { error: "visitorId and paths are required" },
        { status: 400 },
      );
    }

    // Validate model
    const validModels = [
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-3-flash-preview",
    ];
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
      const { pageInfoMap, blockInfoMap, visitsByDate, blockDurationsByDate } =
        detailedData;

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

          const blockDurationsForPath =
            blockDurationsByDate[date]?.[path] ?? {};
          const blockEntries = Object.entries(blockDurationsForPath).sort(
            ([blockIdA], [blockIdB]) =>
              String(blockIdA).localeCompare(String(blockIdB)),
          );
          if (blockEntries.length > 0) {
            prompt += "  ブロック別の滞在:\n";
            for (const [blockId, duration] of blockEntries) {
              const blockInfo = blockInfoMap.get(String(blockId));
              const blockLabel = blockInfo?.blockName
                ? `${blockInfo.blockName}`
                : `Block ${blockId}`;
              prompt += `  - ${blockLabel}: ${formatDuration(duration)}\n`;
              if (blockInfo?.blockSummary) {
                prompt += `    概要: ${blockInfo.blockSummary}\n`;
              }
            }
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

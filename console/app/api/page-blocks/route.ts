import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pageBlocks, pages } from "@/db/schema";
import { eq } from "drizzle-orm";

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.API_KEY || "demo-api-key";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    const apiKey = authHeader.substring(7);
    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { error: "Invalid API key" },
        {
          status: 401,
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "path is required" },
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    const page = await db.query.pages.findFirst({
      where: eq(pages.path, path),
    });

    if (!page) {
      return NextResponse.json([], {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const blocks = await db.query.pageBlocks.findMany({
      where: eq(pageBlocks.pageId, page.id),
    });

    return NextResponse.json(
      blocks.map((block) => ({
        id: block.id,
        blockName: block.blockName,
        blockSummary: block.blockSummary,
        blockDom: block.blockDom,
      })),
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch (error) {
    console.error("Error fetching page blocks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }
}

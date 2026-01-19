import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blockDurations } from "@/db/schema";

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { durations } = body;

    if (!Array.isArray(durations) || durations.length === 0) {
      return NextResponse.json(
        { error: "Invalid request body" },
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    await db.insert(blockDurations).values(
      durations.map((d) => ({
        blockId: String(d.blockId),
        path: d.path,
        duration: d.duration,
        timestamp: d.timestamp,
        visitorId: d.visitorId,
      })),
    );

    return NextResponse.json(
      {
        success: true,
        count: durations.length,
      },
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch (error) {
    console.error("Error processing block durations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }
}

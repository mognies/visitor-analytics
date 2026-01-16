import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pathDurations } from "@/db/schema";

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

    // Insert durations into database
    const insertedDurations = db
      .insert(pathDurations)
      .values(
        durations.map((d) => ({
          path: d.path,
          duration: d.duration,
          timestamp: d.timestamp,
          visitorId: d.visitorId,
        })),
      )
      .run();

    return NextResponse.json(
      {
        success: true,
        count: insertedDurations.changes,
      },
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch (error) {
    console.error("Error processing durations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }
}

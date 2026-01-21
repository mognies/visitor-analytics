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
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { durations, apiKey: bodyApiKey } = body;

    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.API_KEY || "demo-api-key";

    const headerKey =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;
    const isAuthorized =
      headerKey === expectedKey || bodyApiKey === expectedKey;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      );
    }

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
    // Use onConflictDoNothing to handle duplicates gracefully
    const result = await db
      .insert(pathDurations)
      .values(
        durations.map((d) => ({
          path: d.path,
          duration: d.duration,
          timestamp: d.timestamp,
          visitorId: d.visitorId,
        })),
      )
      .onConflictDoNothing();

    return NextResponse.json(
      {
        success: true,
        count: durations.length,
        inserted: result.rowsAffected || 0,
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

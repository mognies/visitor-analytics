import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blockDurations } from "@/db/schema";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!Array.isArray(durations) || durations.length === 0) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Use onConflictDoNothing to handle duplicates gracefully
    const result = await db
      .insert(blockDurations)
      .values(
        durations.map((d) => ({
          blockId: String(d.blockId),
          path: d.path,
          duration: d.duration,
          timestamp: d.timestamp,
          visitorId: d.visitorId,
          pageVisitId: d.pageVisitId,
        })),
      )
      .onConflictDoNothing();

    return NextResponse.json({
      success: true,
      count: durations.length,
      inserted: result.rowsAffected || 0,
    });
  } catch (error) {
    console.error("Error processing block durations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

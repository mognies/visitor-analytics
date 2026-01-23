import { NextResponse, type NextRequest } from "next/server";

function setCorsHeaders(response: NextResponse, origin: string | null) {
  // When using credentials, we must specify the exact origin, not "*"
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  } else {
    // Fallback to wildcard if no origin (but credentials won't work)
    response.headers.set("Access-Control-Allow-Origin", "*");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 200 });
      setCorsHeaders(response, origin);
      return response;
    }

    const response = NextResponse.next();
    setCorsHeaders(response, origin);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

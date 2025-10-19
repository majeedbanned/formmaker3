import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import { logger } from "@/lib/logger";

// Set runtime to experimental-edge since we're not using Mongoose here
export const runtime = 'experimental-edge';

export async function middleware(request: NextRequest) {
  // Handle CORS for mobile app API routes
  const isMobileAppApi = request.nextUrl.pathname.startsWith("/api/mobileapp");
  
  if (isMobileAppApi) {
    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
  }

  // Extract the domain from the host header
  const domain = request.headers.get("host") || "localhost:3000";
  
  // Get the token if it exists
  const token = request.cookies.get("auth-token")?.value;

  // Add domain to headers for all requests
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-domain", domain);
  
  // Check if this is an API route
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  if (isApiRoute) {
    logger.info(`API request for domain: ${domain}, path: ${request.nextUrl.pathname}`);
  }

  // Check if this is an admin or meeting route (both require authentication)
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/s");
  const isMeetingRoute = request.nextUrl.pathname.startsWith("/meeting");
  const isProtectedRoute = isAdminRoute || isMeetingRoute;

  if (isProtectedRoute) {
    if (!token) {
      // Redirect to login if there's no token
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const payload = await verifyJWT(token) as {
        userId: string;
        userType: string;
        schoolCode: string;
        username: string;
        name: string;
        role: string;
        permissions: Array<{
          systems: string;
          access: string[];
        }>;
        maghta?: string;
        grade?: string;
      };
      
      // Add user info to headers for downstream use
      requestHeaders.set("x-user-id", payload.userId);
      requestHeaders.set("x-user-type", payload.userType);
      requestHeaders.set("x-school-code", payload.schoolCode);
      requestHeaders.set("x-username", payload.username);
      // Encode text before setting in header
      requestHeaders.set("x-name", encodeURIComponent(payload.name));
      requestHeaders.set("x-user-role", payload.role);
      requestHeaders.set("x-permissions", JSON.stringify(payload.permissions));
      if (payload.maghta) {
        requestHeaders.set("x-maghta", payload.maghta);
      }
      if (payload.grade) {
        requestHeaders.set("x-grade", payload.grade);
      }
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error("Authentication failed:", error);
      // Token is invalid - redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // For non-admin routes, pass the domain in the header
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add CORS headers to mobile app API responses
  if (isMobileAppApi) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/s/:path*", "/api/:path*", "/meeting/:path*"],
}; 
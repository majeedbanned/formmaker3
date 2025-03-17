import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/jwt";

// Set runtime to experimental-edge since we're not using Mongoose here
export const runtime = 'experimental-edge';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  // Check if this is an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith("/s");

  if (isAdminRoute) {
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
      const requestHeaders = new Headers(request.headers);
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/s/:path*"],
}; 
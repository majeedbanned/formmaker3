import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  // Check if this is an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute) {
    if (!token) {
      // Redirect to login if there's no token
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const payload = await verifyAuth(token) as unknown as {
        userId: number;
        username: string;
        role: string;
      };
      
      // Add user info to headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId.toString());
      requestHeaders.set("x-user-role", payload.role);
      
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
  matcher: ["/admin/:path*"],
}; 
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/signup"];
const protectedPaths = ["/dashboard"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // Handle root path - landing page
  if (pathname === "/") {
    // Redirect authenticated users to dashboard
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Allow unauthenticated users to view landing page
    return NextResponse.next();
  }

  // If trying to access protected route without token, redirect to login
  if (isProtectedPath && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If trying to access public routes while authenticated, redirect to dashboard
  if (isPublicPath && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|avif|ico)$).*)",
  ],
};

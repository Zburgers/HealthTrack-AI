import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Minimal middleware for path-based redirects only.
 * All database credential checks are done client-side.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for api routes, static files, setup, login, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/setup' ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // All actual DB setup logic is handled client-side.
  // This middleware is just a placeholder for future path-based logic.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|setup|login).*)',
  ],
};
